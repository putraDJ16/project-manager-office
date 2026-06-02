from __future__ import annotations

import json
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from flask import current_app, render_template
from sqlalchemy import and_

from app.extensions import db
from app.models.email_outbox import EmailOutbox
from app.models.user import User
from app.models.user_email_preference import UserEmailPreference

PREFERENCE_BY_ENTITY = {
    "project": "project_assignment",
    "task": "task_assignment",
    "issue": "issue_events",
    "meeting": "meeting_invites",
    "meeting_reminder": "meeting_reminders",
    "action_item": "action_items",
}
SECURITY_EVENTS = {"auth.welcome", "auth.password_reset", "auth.password_changed"}
DEFAULT_FRONTEND_BASE_URL = "http://localhost:5173"


def get_or_create_preferences(user_id: int) -> UserEmailPreference:
    prefs = db.session.get(UserEmailPreference, user_id)
    if prefs is None:
        prefs = UserEmailPreference(user_id=user_id)
        db.session.add(prefs)
        db.session.flush()
    return prefs


def is_email_allowed(user: User | None, entity_type: str | None, event_key: str) -> bool:
    if not user or not user.is_active or not user.email:
        return False
    if event_key in SECURITY_EVENTS or entity_type == "auth":
        return True
    pref_field = PREFERENCE_BY_ENTITY.get(entity_type or "")
    if not pref_field:
        return True
    return bool(getattr(get_or_create_preferences(user.id), pref_field, True))


def _configured_frontend_base_url() -> str:
    base = (current_app.config.get("FRONTEND_BASE_URL") or "").strip()
    if base:
        return base.rstrip("/")

    origins = current_app.config.get("CORS_ORIGINS") or []
    if isinstance(origins, str):
        origins = [origin.strip() for origin in origins.split(",") if origin.strip()]
    for origin in origins:
        if origin and origin != "*":
            return origin.rstrip("/")
    return DEFAULT_FRONTEND_BASE_URL


def _target_url(path: str | None) -> str:
    if path and urlparse(path).scheme in {"http", "https"}:
        return path
    base = _configured_frontend_base_url()
    if not path:
        return base
    return f"{base}/{path.lstrip('/')}"


def render_email_template(template_key: str, context: dict[str, Any]) -> tuple[str, str]:
    payload = {**context, "frontend_url": _target_url(context.get("target_url"))}
    html = render_template(f"email/{template_key}.html", **payload)
    text = render_template(f"email/{template_key}.txt", **payload)
    return html, text


def enqueue_email(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    to_user_id: int | None = None,
    event_key: str,
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    headers: dict[str, str] | None = None,
    ical: str | None = None,
    scheduled_at: datetime | None = None,
) -> EmailOutbox:
    scheduled_at = scheduled_at or datetime.now(timezone.utc)
    query = EmailOutbox.query.filter(
        and_(
            EmailOutbox.event_key == event_key,
            EmailOutbox.entity_id == (str(entity_id) if entity_id is not None else None),
            EmailOutbox.to_user_id == to_user_id,
            EmailOutbox.status.in_(["Queued", "Sending"]),
        )
    )
    existing = query.first()
    if existing:
        return existing
    if current_app.config.get("MAIL_TEST_RECIPIENT"):
        to_email = current_app.config["MAIL_TEST_RECIPIENT"]
    row = EmailOutbox(
        to_email=to_email,
        to_user_id=to_user_id,
        event_key=event_key,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        subject=subject,
        body_html=html_body,
        body_text=text_body,
        headers_json=json.dumps(headers or {}),
        ical=ical,
        status="Queued",
        scheduled_at=scheduled_at,
    )
    db.session.add(row)
    return row


def enqueue_event_email(
    *,
    user: User | None,
    event_key: str,
    template_key: str,
    subject: str,
    context: dict[str, Any],
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    ical: str | None = None,
    headers: dict[str, str] | None = None,
) -> EmailOutbox | None:
    if not is_email_allowed(user, entity_type, event_key):
        return None
    html, text = render_email_template(template_key, context)
    return enqueue_email(
        to_email=user.email,
        to_user_id=user.id,
        event_key=event_key,
        entity_type=entity_type,
        entity_id=entity_id,
        subject=subject,
        html_body=html,
        text_body=text,
        headers=headers,
        ical=ical,
    )


def build_message(row: EmailOutbox) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = row.subject
    msg["From"] = formataddr((current_app.config["MAIL_FROM_NAME"], current_app.config["MAIL_FROM_ADDRESS"]))
    msg["To"] = row.to_email
    for key, value in json.loads(row.headers_json or "{}").items():
        msg[key] = value
    msg.set_content(row.body_text or "")
    msg.add_alternative(row.body_html, subtype="html")
    if row.ical:
        msg.add_attachment(row.ical.encode("utf-8"), maintype="text", subtype="calendar", filename="meeting.ics")
    return msg


def send_email(row: EmailOutbox) -> bool:
    if not current_app.config.get("MAIL_ENABLED"):
        return False
    msg = build_message(row)
    with smtplib.SMTP(current_app.config["MAIL_HOST"], current_app.config["MAIL_PORT"], timeout=20) as smtp:
        if current_app.config.get("MAIL_USE_TLS"):
            smtp.starttls()
        if current_app.config.get("MAIL_USERNAME") and current_app.config.get("MAIL_PASSWORD"):
            smtp.login(current_app.config["MAIL_USERNAME"], current_app.config["MAIL_PASSWORD"])
        smtp.send_message(msg)
    return True


def retry_at(attempts: int) -> datetime:
    delays = {1: 1, 2: 5, 3: 30}
    return datetime.now(timezone.utc) + timedelta(minutes=delays.get(attempts, 30))

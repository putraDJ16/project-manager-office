from __future__ import annotations

import time
from datetime import datetime, timezone

from app.extensions import db
from app.models.email_outbox import EmailOutbox
from app.services.email_service import retry_at, send_email


def dispatch_once(limit: int = 25) -> int:
    rows = (
        EmailOutbox.query.filter(EmailOutbox.status == "Queued", EmailOutbox.scheduled_at <= datetime.now(timezone.utc))
        .order_by(EmailOutbox.scheduled_at.asc(), EmailOutbox.id.asc())
        .limit(limit)
        .all()
    )
    for row in rows:
        row.status = "Sending"
        db.session.commit()
        try:
            send_email(row)
            row.status = "Sent"
            row.sent_at = datetime.now(timezone.utc)
            row.last_error = None
        except Exception as exc:  # pragma: no cover - SMTP failure path depends on infra
            row.attempts += 1
            row.last_error = str(exc)
            if row.attempts >= 3:
                row.status = "Failed"
            else:
                row.status = "Queued"
                row.scheduled_at = retry_at(row.attempts)
        db.session.commit()
    return len(rows)


def run_forever(interval_seconds: int = 5) -> None:
    while True:
        dispatch_once()
        time.sleep(interval_seconds)

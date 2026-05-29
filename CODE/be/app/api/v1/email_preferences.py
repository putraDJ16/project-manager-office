from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.extensions import db
from app.services.email_service import get_or_create_preferences
from app.utils.http import success_response
from app.utils.permissions import require_permission

FIELDS = ["project_assignment", "task_assignment", "issue_events", "meeting_invites", "meeting_reminders", "action_items"]


def _dump(prefs):
    return {field: getattr(prefs, field) for field in FIELDS}


@api_v1.get("/me/email-preferences")
@jwt_required()
@require_permission("emailPreferences", "view")
def get_email_preferences_handler():
    prefs = get_or_create_preferences(int(get_jwt()["sub"]))
    db.session.commit()
    return success_response(_dump(prefs))


@api_v1.put("/me/email-preferences")
@jwt_required()
@require_permission("emailPreferences", "edit")
def update_email_preferences_handler():
    prefs = get_or_create_preferences(int(get_jwt()["sub"]))
    payload = request.get_json(silent=True) or {}
    for field in FIELDS:
        if field in payload:
            setattr(prefs, field, bool(payload[field]))
    db.session.commit()
    return success_response(_dump(prefs), message="Preferensi email diperbarui.")

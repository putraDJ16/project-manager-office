from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.extensions import db
from app.models.email_outbox import EmailOutbox
from app.utils.http import success_response
from app.utils.permissions import require_permission


def _dump(row):
    return {
        "id": row.id,
        "to_email": row.to_email,
        "to_user_id": row.to_user_id,
        "event_key": row.event_key,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "subject": row.subject,
        "status": row.status,
        "attempts": row.attempts,
        "last_error": row.last_error,
        "scheduled_at": row.scheduled_at.isoformat() if row.scheduled_at else None,
        "sent_at": row.sent_at.isoformat() if row.sent_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@api_v1.get("/admin/email-outbox")
@jwt_required()
@require_permission("adminEmailLogs", "view")
def list_email_outbox_handler():
    query = EmailOutbox.query
    if request.args.get("status"):
        query = query.filter(EmailOutbox.status == request.args["status"])
    if request.args.get("to_email"):
        query = query.filter(EmailOutbox.to_email.ilike(f"%{request.args['to_email']}%"))
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    pagination = query.order_by(EmailOutbox.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return success_response({"items": [_dump(item) for item in pagination.items], "total": pagination.total, "page": page, "per_page": per_page})


@api_v1.post("/admin/email-outbox/<int:outbox_id>/resend")
@jwt_required()
@require_permission("adminEmailLogs", "edit")
def resend_email_handler(outbox_id: int):
    row = db.session.get(EmailOutbox, outbox_id)
    if not row:
        return success_response(None, message="Email outbox tidak ditemukan.", status_code=404)
    row.status = "Queued"
    row.attempts = 0
    row.last_error = None
    db.session.commit()
    return success_response(_dump(row), message="Email dijadwalkan ulang.")

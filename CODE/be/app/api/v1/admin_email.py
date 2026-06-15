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
    from app.utils.pagination import parse_pagination_args, paginate
    from app.utils.http import paginated_response, error_response
    
    try:
        # Parse pagination args
        per_page, cursor_payload = parse_pagination_args(request)
        
        # Build filtered query
        query = EmailOutbox.query
        
        # Parse filters
        status = request.args.get("status")
        search = request.args.get("q") or request.args.get("to_email")
        
        if status:
            query = query.filter(EmailOutbox.status == status)
        if search:
            query = query.filter(EmailOutbox.to_email.ilike(f"%{search}%"))
        
        # Sort spec: created_at DESC, id DESC (newest first)
        sort_spec = [
            (EmailOutbox.created_at, 'desc'),
            (EmailOutbox.id, 'desc')
        ]
        
        # Paginate
        result = paginate(query, sort_spec, per_page, cursor_payload, request)
        
        # Serialize items
        result['items'] = [_dump(item) for item in result['items']]
        
        return paginated_response(result)
        
    except ValueError as e:
        return error_response(str(e), status_code=400)


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

from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import notification_schema, notifications_schema
from app.services import notification_service
from app.utils.http import success_response


@api_v1.get("/notifications")
@jwt_required()
def list_notifications_handler():
    from app.utils.pagination import parse_pagination_args
    from app.utils.http import paginated_response, error_response
    
    try:
        claims = get_jwt()
        
        # Parse pagination args
        per_page, cursor_payload = parse_pagination_args(request)
        
        # Parse filters - convert unread_only to is_read filter
        unread_only = (request.args.get("unread_only") or "").lower() in {"1", "true", "yes"}
        is_read_param = request.args.get("is_read")
        
        # Determine is_read filter
        is_read = None
        if unread_only:
            is_read = False
        elif is_read_param is not None:
            is_read = is_read_param.lower() in {"1", "true", "yes"}
        
        # Get paginated results
        result = notification_service.list_notifications_paginated(
            per_page=per_page,
            cursor_payload=cursor_payload,
            request=request,
            user_id=claims["sub"],
            is_read=is_read
        )
        
        # Add unread_count to meta
        result['meta']['unread_count'] = notification_service.get_unread_count(claims["sub"])
        
        return paginated_response(result)
        
    except ValueError as e:
        return error_response(str(e), status_code=400)


@api_v1.patch("/notifications/<int:notification_id>/read")
@jwt_required()
def mark_notification_read_handler(notification_id: int):
    claims = get_jwt()
    notification = notification_service.mark_notification_read(claims["sub"], notification_id)
    return success_response(notification_schema.dump(notification), message="Notifikasi ditandai sudah dibaca.")


@api_v1.post("/notifications/read-all")
@jwt_required()
def mark_all_notifications_read_handler():
    claims = get_jwt()
    notification_service.mark_all_read(claims["sub"])
    return success_response(None, message="Semua notifikasi ditandai sudah dibaca.")

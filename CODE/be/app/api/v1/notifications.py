from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import notification_schema, notifications_schema
from app.services import notification_service
from app.utils.http import success_response


@api_v1.get("/notifications")
@jwt_required()
def list_notifications_handler():
    claims = get_jwt()
    unread_only = (request.args.get("unread_only") or "").lower() in {"1", "true", "yes"}
    notifications = notification_service.list_notifications(claims["sub"], unread_only=unread_only)
    return success_response(
        {
            "items": notifications_schema.dump(notifications),
            "unread_count": notification_service.get_unread_count(claims["sub"]),
        }
    )


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

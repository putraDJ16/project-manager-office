from app.extensions import db
from app.models import Employee, Notification, User
from app.repositories import NotificationRepository
from app.services.email_service import enqueue_event_email
from app.utils.exceptions import ApiError


def _parse_user_id(user_id: str | int):
    try:
        return int(user_id)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)


def _find_user_for_employee(employee_id: str | None = None, employee_name: str | None = None):
    if employee_id:
        user = User.query.filter_by(employee_id=employee_id, is_active=True).first()
        if user:
            return user

    normalized_name = (employee_name or "").strip()
    if normalized_name:
        employee = Employee.query.filter(Employee.name.ilike(normalized_name)).first()
        if employee:
            user = User.query.filter_by(employee_id=employee.id, is_active=True).first()
            if user:
                return user
        return User.query.filter(User.display_name.ilike(normalized_name), User.is_active.is_(True)).first()

    return None


def _template_for_entity(entity_type: str):
    return {
        "project": ("project.assigned", "project_assigned"),
        "task": ("task.assigned", "task_assigned"),
        "issue": ("issue.assigned", "issue_assigned"),
    }.get(entity_type)


def notify_user(user_id: int | None, title: str, message: str, entity_type: str, entity_id: str, target_url: str | None = None, send_email: bool = True):
    if not user_id:
        return None

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        target_url=target_url,
        is_read=False,
    )
    db.session.add(notification)
    if send_email:
        user = db.session.get(User, user_id)
        mapping = _template_for_entity(entity_type)
        if user and mapping:
            event_key, template_key = mapping
            enqueue_event_email(
                user=user,
                event_key=event_key,
                template_key=template_key,
                subject=title,
                context={"title": title, "description": message, "project_name": "", "target_url": target_url},
                entity_type=entity_type,
                entity_id=entity_id,
            )
    return notification


def notify_employee(
    employee_id: str | None = None,
    employee_name: str | None = None,
    title: str = "",
    message: str = "",
    entity_type: str = "",
    entity_id: str = "",
    target_url: str | None = None,
):
    user = _find_user_for_employee(employee_id=employee_id, employee_name=employee_name)
    if not user:
        return None
    return notify_user(user.id, title, message, entity_type, entity_id, target_url)


def list_notifications(user_id: str | int, unread_only: bool = False):
    normalized_user_id = _parse_user_id(user_id)
    return NotificationRepository.list_notifications(normalized_user_id, unread_only=unread_only)


def get_unread_count(user_id: str | int):
    normalized_user_id = _parse_user_id(user_id)
    return NotificationRepository.unread_count(normalized_user_id)


def mark_notification_read(user_id: str | int, notification_id: int):
    normalized_user_id = _parse_user_id(user_id)
    notification = NotificationRepository.get_notification(notification_id)
    if not notification or notification.user_id != normalized_user_id:
        raise ApiError("Notifikasi tidak ditemukan.", status_code=404)
    notification.is_read = True
    db.session.commit()
    return notification


def mark_all_read(user_id: str | int):
    normalized_user_id = _parse_user_id(user_id)
    notifications = NotificationRepository.list_notifications(normalized_user_id, unread_only=True)
    for notification in notifications:
        notification.is_read = True
    db.session.commit()
    return notifications

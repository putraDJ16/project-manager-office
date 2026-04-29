from app.models import Notification


class NotificationRepository:
    @staticmethod
    def list_notifications(user_id: int, unread_only: bool = False):
        query = Notification.query.filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(50).all()

    @staticmethod
    def get_notification(notification_id: int):
        return Notification.query.get(notification_id)

    @staticmethod
    def unread_count(user_id: int):
        return Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        ).count()

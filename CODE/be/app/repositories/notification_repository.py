from sqlalchemy.orm import Query

from app.models import Notification


class NotificationRepository:
    @staticmethod
    def list_notifications(user_id: int, unread_only: bool = False):
        query = Notification.query.filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(50).all()
    
    @staticmethod
    def query_notifications(user_id: int, is_read: bool | None = None) -> Query:
        """
        Build a filtered query for notifications.
        
        Args:
            user_id: Filter by user
            is_read: Optional filter by read status (True=read, False=unread, None=all)
            
        Returns:
            SQLAlchemy Query object (not executed)
        """
        query = Notification.query.filter(Notification.user_id == user_id)
        
        if is_read is not None:
            query = query.filter(Notification.is_read.is_(is_read))
        
        return query

    @staticmethod
    def get_notification(notification_id: int):
        return Notification.query.get(notification_id)

    @staticmethod
    def unread_count(user_id: int):
        return Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        ).count()

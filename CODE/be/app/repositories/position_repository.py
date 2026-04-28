from app.extensions import db
from app.models import Position


class PositionRepository:
    @staticmethod
    def list_all():
        return Position.query.order_by(Position.name.asc()).all()

    @staticmethod
    def get_by_id(position_id: str):
        return Position.query.get(position_id)

    @staticmethod
    def get_by_name(name: str):
        return Position.query.filter(db.func.lower(Position.name) == name.lower()).first()

    @staticmethod
    def get_active_by_name(name: str):
        return Position.query.filter(db.func.lower(Position.name) == name.lower(), Position.status == "Active").first()

    @staticmethod
    def save(position: Position):
        db.session.add(position)
        db.session.commit()
        return position

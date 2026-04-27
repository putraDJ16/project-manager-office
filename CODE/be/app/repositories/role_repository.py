from app.extensions import db
from app.models import Role


class RoleRepository:
    @staticmethod
    def list_all():
        return Role.query.order_by(Role.name.asc()).all()

    @staticmethod
    def get_by_id(role_id: str):
        return Role.query.get(role_id)

    @staticmethod
    def get_by_name(name: str):
        return Role.query.filter(db.func.lower(Role.name) == name.lower()).first()

    @staticmethod
    def save(role: Role):
        db.session.add(role)
        db.session.commit()
        return role

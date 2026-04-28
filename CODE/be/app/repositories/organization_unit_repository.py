from app.extensions import db
from app.models import OrganizationUnit


class OrganizationUnitRepository:
    @staticmethod
    def list_all():
        return OrganizationUnit.query.order_by(OrganizationUnit.name.asc()).all()

    @staticmethod
    def get_by_id(unit_id: str):
        return OrganizationUnit.query.get(unit_id)

    @staticmethod
    def get_by_name(name: str):
        return OrganizationUnit.query.filter(db.func.lower(OrganizationUnit.name) == name.lower()).first()

    @staticmethod
    def get_active_by_name(name: str):
        return OrganizationUnit.query.filter(
            db.func.lower(OrganizationUnit.name) == name.lower(), OrganizationUnit.status == "Active"
        ).first()

    @staticmethod
    def save(unit: OrganizationUnit):
        db.session.add(unit)
        db.session.commit()
        return unit

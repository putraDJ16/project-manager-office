from app.extensions import db
from app.models import Organization


class OrganizationRepository:
    @staticmethod
    def list_all():
        return Organization.query.order_by(Organization.name.asc()).all()

    @staticmethod
    def get_by_id(organization_id: str):
        return Organization.query.get(organization_id)

    @staticmethod
    def get_by_name(name: str):
        return Organization.query.filter(db.func.lower(Organization.name) == name.lower()).first()

    @staticmethod
    def get_active_by_name(name: str):
        return Organization.query.filter(
            db.func.lower(Organization.name) == name.lower(), Organization.status == "Active"
        ).first()

    @staticmethod
    def save(organization: Organization):
        db.session.add(organization)
        db.session.commit()
        return organization

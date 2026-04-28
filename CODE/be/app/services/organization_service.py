from app.extensions import db
from app.models import Organization
from app.repositories import OrganizationRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_organizations():
    return OrganizationRepository.list_all()


def create_organization(payload: dict):
    name = (payload.get("name") or "").strip()
    status = (payload.get("status") or "Active").strip()

    if not name:
        raise ApiError("Nama organisasi wajib diisi.")

    duplicate = OrganizationRepository.get_by_name(name)
    if duplicate:
        raise ApiError("Nama organisasi sudah digunakan.", errors={"name": "duplicate"})

    ids = [organization.id for organization in Organization.query.with_entities(Organization.id).all()]
    organization = Organization(
        id=next_string_id(ids, "org-", default_start=1, width=3),
        name=name,
        status=status if status in {"Active", "Inactive"} else "Active",
    )
    db.session.add(organization)
    db.session.commit()
    return organization


def update_organization(organization_id: str, payload: dict):
    organization = OrganizationRepository.get_by_id(organization_id)
    if not organization:
        raise ApiError("Organisasi tidak ditemukan.", status_code=404)

    name = (payload.get("name") or organization.name).strip()
    status = (payload.get("status") or organization.status).strip()
    if not name:
        raise ApiError("Nama organisasi wajib diisi.", errors={"name": "required"})

    duplicate = OrganizationRepository.get_by_name(name)
    if duplicate and duplicate.id != organization.id:
        raise ApiError("Nama organisasi sudah digunakan.", errors={"name": "duplicate"})

    organization.name = name
    organization.status = status if status in {"Active", "Inactive"} else organization.status
    db.session.commit()
    return organization


def update_organization_status(organization_id: str, status: str):
    organization = OrganizationRepository.get_by_id(organization_id)
    if not organization:
        raise ApiError("Organisasi tidak ditemukan.", status_code=404)
    if status not in {"Active", "Inactive"}:
        raise ApiError("Status organisasi tidak valid.")
    organization.status = status
    db.session.commit()
    return organization

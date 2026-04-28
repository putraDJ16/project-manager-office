from app.extensions import db
from app.models import OrganizationUnit
from app.repositories import OrganizationUnitRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_organization_units():
    return OrganizationUnitRepository.list_all()


def create_organization_unit(payload: dict):
    name = (payload.get("name") or "").strip()
    status = (payload.get("status") or "Active").strip()

    if not name:
        raise ApiError("Nama unit organisasi wajib diisi.")

    duplicate = OrganizationUnitRepository.get_by_name(name)
    if duplicate:
        raise ApiError("Nama unit organisasi sudah digunakan.", errors={"name": "duplicate"})

    ids = [unit.id for unit in OrganizationUnit.query.with_entities(OrganizationUnit.id).all()]
    unit = OrganizationUnit(
        id=next_string_id(ids, "unit-", default_start=1, width=3),
        name=name,
        status=status if status in {"Active", "Inactive"} else "Active",
    )
    db.session.add(unit)
    db.session.commit()
    return unit


def update_organization_unit(unit_id: str, payload: dict):
    unit = OrganizationUnitRepository.get_by_id(unit_id)
    if not unit:
        raise ApiError("Unit organisasi tidak ditemukan.", status_code=404)

    name = (payload.get("name") or unit.name).strip()
    status = (payload.get("status") or unit.status).strip()
    if not name:
        raise ApiError("Nama unit organisasi wajib diisi.", errors={"name": "required"})

    duplicate = OrganizationUnitRepository.get_by_name(name)
    if duplicate and duplicate.id != unit.id:
        raise ApiError("Nama unit organisasi sudah digunakan.", errors={"name": "duplicate"})

    unit.name = name
    unit.status = status if status in {"Active", "Inactive"} else unit.status
    db.session.commit()
    return unit


def update_organization_unit_status(unit_id: str, status: str):
    unit = OrganizationUnitRepository.get_by_id(unit_id)
    if not unit:
        raise ApiError("Unit organisasi tidak ditemukan.", status_code=404)
    if status not in {"Active", "Inactive"}:
        raise ApiError("Status unit organisasi tidak valid.")
    unit.status = status
    db.session.commit()
    return unit

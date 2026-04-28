from app.extensions import db
from app.models import Position
from app.repositories import PositionRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_positions():
    return PositionRepository.list_all()


def create_position(payload: dict):
    name = (payload.get("name") or "").strip()
    status = (payload.get("status") or "Active").strip()

    if not name:
        raise ApiError("Nama jabatan wajib diisi.")

    duplicate = PositionRepository.get_by_name(name)
    if duplicate:
        raise ApiError("Nama jabatan sudah digunakan.", errors={"name": "duplicate"})

    ids = [position.id for position in Position.query.with_entities(Position.id).all()]
    position = Position(
        id=next_string_id(ids, "pos-", default_start=1, width=3),
        name=name,
        status=status if status in {"Active", "Inactive"} else "Active",
    )
    db.session.add(position)
    db.session.commit()
    return position


def update_position(position_id: str, payload: dict):
    position = PositionRepository.get_by_id(position_id)
    if not position:
        raise ApiError("Jabatan tidak ditemukan.", status_code=404)

    name = (payload.get("name") or position.name).strip()
    status = (payload.get("status") or position.status).strip()
    if not name:
        raise ApiError("Nama jabatan wajib diisi.", errors={"name": "required"})

    duplicate = PositionRepository.get_by_name(name)
    if duplicate and duplicate.id != position.id:
        raise ApiError("Nama jabatan sudah digunakan.", errors={"name": "duplicate"})

    position.name = name
    position.status = status if status in {"Active", "Inactive"} else position.status
    db.session.commit()
    return position


def update_position_status(position_id: str, status: str):
    position = PositionRepository.get_by_id(position_id)
    if not position:
        raise ApiError("Jabatan tidak ditemukan.", status_code=404)
    if status not in {"Active", "Inactive"}:
        raise ApiError("Status jabatan tidak valid.")
    position.status = status
    db.session.commit()
    return position

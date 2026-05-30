from app.extensions import db
from app.models import Role
from app.repositories import RoleRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_roles():
    return RoleRepository.list_all()


def _clear_default_roles(except_role_id: str | None = None):
    query = Role.query.filter(Role.is_default.is_(True))
    if except_role_id:
        query = query.filter(Role.id != except_role_id)
    query.update({"is_default": False}, synchronize_session=False)


def create_role(payload: dict):
    name = (payload.get("name") or "").strip()
    description = (payload.get("description") or "").strip()
    status = (payload.get("status") or "Active").strip()
    permissions = payload.get("permissions") or {}
    is_default = bool(payload.get("is_default"))

    if not name or not description:
        raise ApiError("Nama role dan deskripsi wajib diisi.")

    duplicate = RoleRepository.get_by_name(name)
    if duplicate:
        raise ApiError("Nama role sudah digunakan.", errors={"name": "duplicate"})

    ids = [role.id for role in Role.query.with_entities(Role.id).all()]
    role = Role(
        id=next_string_id(ids, "role-", default_start=1, width=3),
        name=name,
        description=description,
        status=status if status in {"Active", "Inactive"} else "Active",
        permissions=permissions,
        is_default=False,
    )
    if is_default:
        if role.status != "Active":
            raise ApiError("Role default harus berstatus Active.")
        _clear_default_roles()
        role.is_default = True
    db.session.add(role)
    db.session.commit()
    return role


def update_role(role_id: str, payload: dict):
    role = RoleRepository.get_by_id(role_id)
    if not role:
        raise ApiError("Role tidak ditemukan.", status_code=404)

    name = (payload.get("name") or role.name).strip()
    description = (payload.get("description") or role.description).strip()
    status = (payload.get("status") or role.status).strip()
    permissions = payload.get("permissions", role.permissions)
    is_default = payload.get("is_default")

    duplicate = RoleRepository.get_by_name(name)
    if duplicate and duplicate.id != role.id:
        raise ApiError("Nama role sudah digunakan.", errors={"name": "duplicate"})

    role.name = name
    role.description = description
    role.status = status if status in {"Active", "Inactive"} else role.status
    role.permissions = permissions
    if role.is_default and role.status != "Active":
        raise ApiError("Role default tidak bisa dinonaktifkan.")
    if is_default is not None:
        if bool(is_default) and role.status != "Active":
            raise ApiError("Role default harus berstatus Active.")
        if bool(is_default):
            _clear_default_roles(except_role_id=role.id)
        role.is_default = bool(is_default)
    db.session.commit()
    return role


def update_role_status(role_id: str, status: str):
    role = RoleRepository.get_by_id(role_id)
    if not role:
        raise ApiError("Role tidak ditemukan.", status_code=404)

    if status not in {"Active", "Inactive"}:
        raise ApiError("Status role tidak valid.")
    if role.is_default and status != "Active":
        raise ApiError("Role default tidak bisa dinonaktifkan.")

    role.status = status
    db.session.commit()
    return role


def set_default_role(role_id: str):
    role = RoleRepository.get_by_id(role_id)
    if not role:
        raise ApiError("Role tidak ditemukan.", status_code=404)
    if role.status != "Active":
        raise ApiError("Role default harus berstatus Active.")

    _clear_default_roles(except_role_id=role.id)
    role.is_default = True
    db.session.commit()
    return role

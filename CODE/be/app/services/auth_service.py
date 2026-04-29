from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import Employee, Organization, OrganizationUnit, Position, Project, ProjectMember, Role, User
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id
from app.utils.permissions import get_user_permissions


def _initials(name: str):
    parts = [part for part in name.strip().split(" ") if part][:2]
    if not parts:
        return "US"
    return "".join(part[0].upper() for part in parts)


def login(email: str, password: str):
    user = User.query.filter(User.email.ilike(email.strip())).first()
    if not user or not user.is_active or not check_password_hash(user.password_hash, password):
        raise ApiError("Email atau password tidak valid.", status_code=401)

    claims = {
        "email": user.email,
        "name": user.display_name,
        "role_id": user.role_id,
    }

    return {
        "access_token": create_access_token(identity=str(user.id), additional_claims=claims),
        "refresh_token": create_refresh_token(identity=str(user.id), additional_claims=claims),
        "user": {
            "id": user.id,
            "name": user.display_name,
            "email": user.email,
            "initials": _initials(user.display_name),
            "role_id": user.role_id,
            "role": user.role.name if user.role else None,
            "permissions": get_user_permissions(user),
        },
    }


def register_options():
    def serialize(items):
        return [{"id": item.id, "name": item.name} for item in items]

    return {
        "organizations": serialize(
            Organization.query.filter_by(status="Active").order_by(Organization.name.asc()).all()
        ),
        "organization_units": serialize(
            OrganizationUnit.query.filter_by(status="Active").order_by(OrganizationUnit.name.asc()).all()
        ),
        "positions": serialize(Position.query.filter_by(status="Active").order_by(Position.name.asc()).all()),
    }


def _validate_active_reference(model, value: str, label: str):
    normalized = (value or "").strip()
    if not normalized:
        raise ApiError(f"{label} wajib dipilih.")

    item = model.query.filter(db.func.lower(model.name) == normalized.lower(), model.status == "Active").first()
    if not item:
        raise ApiError(f"{label} tidak tersedia di data master aktif.")
    return item.name


def register(payload: dict):
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = (payload.get("password") or "").strip()
    confirm_password = (payload.get("confirm_password") or "").strip()
    organization_name = _validate_active_reference(Organization, payload.get("organization"), "Organisasi")
    unit_name = _validate_active_reference(OrganizationUnit, payload.get("unit_organization"), "Unit organisasi")
    position_name = _validate_active_reference(Position, payload.get("position"), "Jabatan")

    if not name or not email or not password:
        raise ApiError("Nama, email, dan password wajib diisi.")
    if len(password) < 8:
        raise ApiError("Password minimal 8 karakter.")
    if password != confirm_password:
        raise ApiError("Konfirmasi password tidak cocok.")
    if User.query.filter(User.email.ilike(email)).first():
        raise ApiError("Email sudah terdaftar.", status_code=409)

    default_role = (
        Role.query.filter(Role.name.ilike("Viewer"), Role.status == "Active").first()
        or Role.query.filter(Role.name.ilike("Project Manager"), Role.status == "Active").first()
        or Role.query.filter(Role.status == "Active").first()
    )
    if not default_role:
        raise ApiError("Role default belum tersedia. Hubungi administrator.", status_code=500)

    employee = Employee.query.filter(Employee.email.ilike(email)).first()
    if not employee:
        employee_ids = [item.id for item in Employee.query.with_entities(Employee.id).all()]
        nips = [item.nip for item in Employee.query.with_entities(Employee.nip).all()]
        employee = Employee(
            id=next_string_id(employee_ids, "emp-", default_start=1, width=3),
            nip=next_string_id(nips, "REG-", default_start=1, width=5),
            name=name,
            email=email,
            organization=organization_name,
            unit_organization=unit_name,
            position=position_name,
            role_id=default_role.id,
            status="Active",
        )
        db.session.add(employee)
    else:
        employee.name = employee.name or name

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        display_name=name,
        role_id=employee.role_id or default_role.id,
        employee_id=employee.id,
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return login(email, password)


def get_profile(user_id: str):
    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)

    user = User.query.filter_by(id=normalized_user_id).first()
    if not user or not user.is_active:
        raise ApiError("User tidak ditemukan atau tidak aktif.", status_code=404)

    employee = None
    if user.employee_id:
        employee = user.employee

    return {
        "name": user.display_name,
        "email": user.email,
        "initials": _initials(user.display_name),
        "role_id": user.role_id,
        "role": user.role.name if user.role else None,
        "permissions": get_user_permissions(user),
        "organization": employee.organization if employee else None,
        "unit_organization": employee.unit_organization if employee else None,
        "position": employee.position if employee else None,
    }


def change_password(user_id: str, current_password: str, new_password: str):
    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)

    user = User.query.filter_by(id=normalized_user_id).first()
    if not user or not user.is_active:
        raise ApiError("User tidak ditemukan atau tidak aktif.", status_code=404)

    if not check_password_hash(user.password_hash, current_password):
        raise ApiError("Password saat ini tidak sesuai.", status_code=400)

    normalized_new_password = (new_password or "").strip()
    if len(normalized_new_password) < 8:
        raise ApiError("Password baru minimal 8 karakter.", status_code=400)

    if check_password_hash(user.password_hash, normalized_new_password):
        raise ApiError("Password baru harus berbeda dari password saat ini.", status_code=400)

    user.password_hash = generate_password_hash(normalized_new_password)
    db.session.commit()


def list_my_projects(user_id: str):
    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)

    user = User.query.filter_by(id=normalized_user_id).first()
    if not user or not user.is_active:
        raise ApiError("User tidak ditemukan atau tidak aktif.", status_code=404)

    if not user.employee_id:
        return []

    return (
        Project.query
        .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
        .filter(
            or_(
                Project.manager_id == user.employee_id,
                ProjectMember.employee_id == user.employee_id,
            )
        )
        .distinct()
        .order_by(Project.updated_at.desc(), Project.name.asc())
        .all()
    )

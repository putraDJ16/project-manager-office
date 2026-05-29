from flask import current_app
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Employee, Role, User
from app.repositories import (
    EmployeeRepository,
    OrganizationRepository,
    OrganizationUnitRepository,
    PositionRepository,
)
from app.services.email_service import enqueue_event_email
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_employees():
    return EmployeeRepository.list_all()


def _validate_unique(nip: str, email: str, employee_id: str | None = None):
    duplicate_nip = EmployeeRepository.get_by_nip(nip)
    if duplicate_nip and duplicate_nip.id != employee_id:
        raise ApiError("NIP sudah digunakan oleh pegawai lain.", errors={"nip": "duplicate"})

    duplicate_email = EmployeeRepository.get_by_email(email)
    if duplicate_email and duplicate_email.id != employee_id:
        raise ApiError("Email sudah digunakan oleh pegawai lain.", errors={"email": "duplicate"})

    duplicate_user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    if duplicate_user and duplicate_user.employee_id != employee_id:
        raise ApiError("Email sudah digunakan oleh akun user lain.", errors={"email": "duplicate_user"})


def _validate_role(role_id: str, current_role_id: str | None = None):
    role = Role.query.get(role_id)
    if not role:
        raise ApiError("Role yang dipilih tidak tersedia.", errors={"role_id": "not_found"})
    if role.status != "Active" and current_role_id != role_id:
        raise ApiError("Role inactive tidak bisa dipilih untuk data baru.", errors={"role_id": "inactive"})


def _validate_organization(name: str, current_name: str | None = None):
    organization = OrganizationRepository.get_by_name(name)
    if not organization:
        raise ApiError("Organisasi yang dipilih tidak tersedia.", errors={"organization": "not_found"})
    is_current_value = bool(current_name and name.lower() == current_name.lower())
    if organization.status != "Active" and not is_current_value:
        raise ApiError(
            "Organisasi inactive tidak bisa dipilih untuk data baru.", errors={"organization": "inactive"}
        )


def _validate_unit_organization(name: str, current_name: str | None = None):
    unit = OrganizationUnitRepository.get_by_name(name)
    if not unit:
        raise ApiError("Unit organisasi yang dipilih tidak tersedia.", errors={"unit_organization": "not_found"})
    is_current_value = bool(current_name and name.lower() == current_name.lower())
    if unit.status != "Active" and not is_current_value:
        raise ApiError(
            "Unit organisasi inactive tidak bisa dipilih untuk data baru.",
            errors={"unit_organization": "inactive"},
        )


def _validate_position(name: str, current_name: str | None = None):
    position = PositionRepository.get_by_name(name)
    if not position:
        raise ApiError("Jabatan yang dipilih tidak tersedia.", errors={"position": "not_found"})
    is_current_value = bool(current_name and name.lower() == current_name.lower())
    if position.status != "Active" and not is_current_value:
        raise ApiError("Jabatan inactive tidak bisa dipilih untuk data baru.", errors={"position": "inactive"})


def _sync_employee_user(employee: Employee):
    user = User.query.filter_by(employee_id=employee.id).first()
    if not user:
        return

    user.email = employee.email
    user.display_name = employee.name
    user.role_id = employee.role_id
    user.is_active = employee.status == "Active"


def create_employee(payload: dict):
    required_fields = [
        "nip",
        "name",
        "email",
        "organization",
        "unit_organization",
        "position",
        "role_id",
    ]
    clean = {field: (payload.get(field) or "").strip() for field in required_fields}
    for field, value in clean.items():
        if not value:
            raise ApiError("Semua field wajib diisi.", errors={field: "required"})

    _validate_unique(clean["nip"], clean["email"])
    _validate_role(clean["role_id"])
    _validate_organization(clean["organization"])
    _validate_unit_organization(clean["unit_organization"])
    _validate_position(clean["position"])

    existing_user = User.query.filter(db.func.lower(User.email) == clean["email"].lower()).first()
    if existing_user:
        raise ApiError("Email sudah digunakan oleh akun user lain.", errors={"email": "duplicate_user"})

    ids = [employee.id for employee in Employee.query.with_entities(Employee.id).all()]
    employee = Employee(
        id=next_string_id(ids, "emp-", default_start=1, width=3),
        nip=clean["nip"],
        name=clean["name"],
        email=clean["email"],
        organization=clean["organization"],
        unit_organization=clean["unit_organization"],
        position=clean["position"],
        role_id=clean["role_id"],
        status=(payload.get("status") or "Active"),
    )

    default_password = current_app.config.get("DEFAULT_EMPLOYEE_PASSWORD", "Welcome123!")
    user = User(
        email=clean["email"],
        password_hash=generate_password_hash(default_password),
        display_name=clean["name"],
        role_id=clean["role_id"],
        employee_id=employee.id,
        is_active=employee.status == "Active",
    )

    db.session.add(employee)
    db.session.add(user)
    db.session.flush()
    enqueue_event_email(
        user=user,
        event_key="auth.welcome",
        template_key="welcome_employee",
        subject="Akun PMO Anda sudah aktif",
        context={"employee": employee, "default_password": default_password, "target_url": "/login"},
        entity_type="auth",
        entity_id=employee.id,
    )
    db.session.commit()
    return employee, default_password


def update_employee(employee_id: str, payload: dict):
    employee = EmployeeRepository.get_by_id(employee_id)
    if not employee:
        raise ApiError("Pegawai tidak ditemukan.", status_code=404)

    nip = (payload.get("nip") or employee.nip).strip()
    name = (payload.get("name") or employee.name).strip()
    email = (payload.get("email") or employee.email).strip()
    organization = (payload.get("organization") or employee.organization).strip()
    unit_organization = (payload.get("unit_organization") or employee.unit_organization).strip()
    position = (payload.get("position") or employee.position).strip()
    role_id = (payload.get("role_id") or employee.role_id).strip()
    status = (payload.get("status") or employee.status).strip()

    _validate_unique(nip, email, employee.id)
    _validate_role(role_id, current_role_id=employee.role_id)
    _validate_organization(organization, current_name=employee.organization)
    _validate_unit_organization(unit_organization, current_name=employee.unit_organization)
    _validate_position(position, current_name=employee.position)

    employee.nip = nip
    employee.name = name
    employee.email = email
    employee.organization = organization
    employee.unit_organization = unit_organization
    employee.position = position
    employee.role_id = role_id
    employee.status = status if status in {"Active", "Inactive"} else employee.status
    _sync_employee_user(employee)
    db.session.commit()
    return employee


def update_employee_status(employee_id: str, status: str):
    employee = EmployeeRepository.get_by_id(employee_id)
    if not employee:
        raise ApiError("Pegawai tidak ditemukan.", status_code=404)
    if status not in {"Active", "Inactive"}:
        raise ApiError("Status pegawai tidak valid.")
    employee.status = status
    _sync_employee_user(employee)
    db.session.commit()
    return employee


def reset_employee_password(employee_id: str):
    employee = EmployeeRepository.get_by_id(employee_id)
    if not employee:
        raise ApiError("Pegawai tidak ditemukan.", status_code=404)

    default_password = current_app.config.get("DEFAULT_EMPLOYEE_PASSWORD", "Welcome123!")
    user = User.query.filter_by(employee_id=employee.id).first()

    if not user:
        user = User(
            email=employee.email,
            password_hash=generate_password_hash(default_password),
            display_name=employee.name,
            role_id=employee.role_id,
            employee_id=employee.id,
            is_active=employee.status == "Active",
        )
        db.session.add(user)
    else:
        user.password_hash = generate_password_hash(default_password)
        user.email = employee.email
        user.display_name = employee.name
        user.role_id = employee.role_id
        user.is_active = employee.status == "Active"

    db.session.flush()
    enqueue_event_email(
        user=user,
        event_key="auth.password_reset",
        template_key="password_reset",
        subject="Password Anda telah direset",
        context={"employee": employee, "default_password": default_password, "target_url": "/login"},
        entity_type="auth",
        entity_id=employee.id,
    )
    db.session.commit()
    return default_password

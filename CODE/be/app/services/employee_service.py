from app.extensions import db
from app.models import Employee, Role
from app.repositories import EmployeeRepository
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


def _validate_role(role_id: str, current_role_id: str | None = None):
    role = Role.query.get(role_id)
    if not role:
        raise ApiError("Role yang dipilih tidak tersedia.", errors={"role_id": "not_found"})
    if role.status != "Active" and current_role_id != role_id:
        raise ApiError("Role inactive tidak bisa dipilih untuk data baru.", errors={"role_id": "inactive"})


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
    db.session.add(employee)
    db.session.commit()
    return employee


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

    employee.nip = nip
    employee.name = name
    employee.email = email
    employee.organization = organization
    employee.unit_organization = unit_organization
    employee.position = position
    employee.role_id = role_id
    employee.status = status if status in {"Active", "Inactive"} else employee.status
    db.session.commit()
    return employee


def update_employee_status(employee_id: str, status: str):
    employee = EmployeeRepository.get_by_id(employee_id)
    if not employee:
        raise ApiError("Pegawai tidak ditemukan.", status_code=404)
    if status not in {"Active", "Inactive"}:
        raise ApiError("Status pegawai tidak valid.")
    employee.status = status
    db.session.commit()
    return employee

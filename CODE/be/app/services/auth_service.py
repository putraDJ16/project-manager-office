import secrets
from datetime import datetime, timedelta, timezone

from flask import render_template
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import AccountOtp, Employee, Issue, Organization, OrganizationUnit, Position, Project, ProjectMember, Role, Task, User
from app.services.email_service import enqueue_email, enqueue_event_email
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id
from app.utils.permissions import get_user_permissions

OTP_PURPOSE_REGISTER = "register"
OTP_PURPOSE_CHANGE_PASSWORD = "change_password"
OTP_PURPOSE_FORGOT_PASSWORD = "forgot_password"
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _initials(name: str):
    parts = [part for part in name.strip().split(" ") if part][:2]
    if not parts:
        return "US"
    return "".join(part[0].upper() for part in parts)


def _abbreviated_name(name: str | None):
    parts = [part for part in (name or "").strip().split(" ") if part]
    if len(parts) < 2:
        return parts[0] if parts else None
    return f"{parts[0]} {parts[1][0]}."


def _effective_role(user: User):
    if user.employee_id and user.employee and user.employee.role:
        return user.employee.role
    return user.role


def _assignment_aliases(user: User):
    employee = user.employee if user.employee_id else None
    raw_aliases = [
        str(user.id),
        user.display_name,
        user.email,
        user.employee_id,
        employee.id if employee else None,
        employee.name if employee else None,
        employee.email if employee else None,
        _abbreviated_name(user.display_name),
        _abbreviated_name(employee.name if employee else None),
    ]
    return sorted({alias.strip() for alias in raw_aliases if isinstance(alias, str) and alias.strip()})


def _get_active_user(user_id: str):
    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)

    user = User.query.filter_by(id=normalized_user_id).first()
    if not user or not user.is_active:
        raise ApiError("User tidak ditemukan atau tidak aktif.", status_code=404)
    return user


def _utcnow():
    return datetime.now(timezone.utc)


def _as_aware(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _generate_otp_code():
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_otp_email(*, email: str, user: User | None, purpose: str, code: str, token_id: int):
    if purpose == OTP_PURPOSE_REGISTER:
        title = "Verifikasi Pendaftaran"
        intro = "Masukkan kode berikut untuk menyelesaikan pendaftaran akun PMO Anda."
        subject = "Kode OTP Pendaftaran PMO"
        event_key = "auth.register_otp"
    elif purpose == OTP_PURPOSE_FORGOT_PASSWORD:
        title = "Reset Password"
        intro = "Masukkan kode berikut untuk mengatur ulang password akun PMO Anda."
        subject = "Kode OTP Reset Password PMO"
        event_key = "auth.forgot_password_otp"
    else:
        title = "Verifikasi Ubah Password"
        intro = "Masukkan kode berikut untuk mengonfirmasi perubahan password akun PMO Anda."
        subject = "Kode OTP Ubah Password PMO"
        event_key = "auth.change_password_otp"

    context = {
        "title": title,
        "intro": intro,
        "code": code,
        "expires_in_minutes": OTP_TTL_MINUTES,
    }
    html = render_template("email/account_otp.html", **context)
    text = render_template("email/account_otp.txt", **context)
    enqueue_email(
        to_email=email,
        to_user_id=user.id if user else None,
        event_key=event_key,
        entity_type="auth",
        entity_id=token_id,
        subject=subject,
        html_body=html,
        text_body=text,
    )


def _create_otp(email: str, purpose: str, user: User | None = None):
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        raise ApiError("Email wajib diisi.")

    AccountOtp.query.filter(
        AccountOtp.email == normalized_email,
        AccountOtp.purpose == purpose,
        AccountOtp.consumed_at.is_(None),
    ).update({"consumed_at": _utcnow()}, synchronize_session=False)

    code = _generate_otp_code()
    otp = AccountOtp(
        email=normalized_email,
        purpose=purpose,
        code_hash=generate_password_hash(code),
        expires_at=_utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
    )
    db.session.add(otp)
    db.session.flush()
    _send_otp_email(email=normalized_email, user=user, purpose=purpose, code=code, token_id=otp.id)
    db.session.commit()
    return {"expires_in_minutes": OTP_TTL_MINUTES}


def _verify_otp(email: str, purpose: str, code: str):
    normalized_email = (email or "").strip().lower()
    normalized_code = (code or "").strip()
    if not normalized_code:
        raise ApiError("Kode OTP wajib diisi.")

    otp = (
        AccountOtp.query
        .filter(
            AccountOtp.email == normalized_email,
            AccountOtp.purpose == purpose,
            AccountOtp.consumed_at.is_(None),
        )
        .order_by(AccountOtp.created_at.desc())
        .first()
    )
    if not otp:
        raise ApiError("Kode OTP belum diminta atau sudah digunakan.")
    if _as_aware(otp.expires_at) < _utcnow():
        otp.consumed_at = _utcnow()
        db.session.commit()
        raise ApiError("Kode OTP sudah kedaluwarsa. Kirim ulang kode OTP.")
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.consumed_at = _utcnow()
        db.session.commit()
        raise ApiError("Percobaan OTP terlalu banyak. Kirim ulang kode OTP.")

    otp.attempts += 1
    if not check_password_hash(otp.code_hash, normalized_code):
        db.session.commit()
        raise ApiError("Kode OTP tidak valid.")

    otp.consumed_at = _utcnow()
    db.session.flush()
    return otp


def login(email: str, password: str):
    user = User.query.filter(User.email.ilike(email.strip())).first()
    if not user or not user.is_active or not check_password_hash(user.password_hash, password):
        raise ApiError("Email atau password tidak valid.", status_code=401)

    role = _effective_role(user)
    claims = {
        "email": user.email,
        "name": user.display_name,
        "role_id": role.id if role else user.role_id,
        "employee_id": user.employee_id,
    }

    return {
        "access_token": create_access_token(identity=str(user.id), additional_claims=claims),
        "refresh_token": create_refresh_token(identity=str(user.id), additional_claims=claims),
        "user": {
            "id": user.id,
            "name": user.display_name,
            "email": user.email,
            "initials": _initials(user.display_name),
            "role_id": role.id if role else user.role_id,
            "role": role.name if role else None,
            "permissions": get_user_permissions(user),
            "employee_id": user.employee_id,
            "employee_name": user.employee.name if user.employee else None,
            "onboarding_completed": bool(user.onboarding_completed),
        },
    }


def request_forgot_password_otp(email: str):
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        raise ApiError("Email wajib diisi.")

    user = User.query.filter(User.email.ilike(normalized_email), User.is_active.is_(True)).first()
    if user:
        _create_otp(user.email, OTP_PURPOSE_FORGOT_PASSWORD, user=user)

    return {"expires_in_minutes": OTP_TTL_MINUTES}


def reset_forgot_password(payload: dict):
    email = (payload.get("email") or "").strip().lower()
    new_password = (payload.get("new_password") or "").strip()
    confirm_password = (payload.get("confirm_password") or "").strip()
    otp = (payload.get("otp") or "").strip()

    if not email:
        raise ApiError("Email wajib diisi.")
    if not new_password:
        raise ApiError("Password baru wajib diisi.")
    if len(new_password) < 8:
        raise ApiError("Password baru minimal 8 karakter.", status_code=400)
    if new_password != confirm_password:
        raise ApiError("Konfirmasi password baru tidak cocok.", status_code=400)

    user = User.query.filter(User.email.ilike(email), User.is_active.is_(True)).first()
    if not user:
        raise ApiError("Kode OTP tidak valid.")
    if check_password_hash(user.password_hash, new_password):
        raise ApiError("Password baru harus berbeda dari password saat ini.", status_code=400)

    _verify_otp(user.email, OTP_PURPOSE_FORGOT_PASSWORD, otp)
    user.password_hash = generate_password_hash(new_password)
    enqueue_event_email(
        user=user,
        event_key="auth.password_reset",
        template_key="password_reset",
        subject="Konfirmasi: password berhasil direset",
        context={"target_url": "/login"},
        entity_type="auth",
        entity_id=user.id,
    )
    db.session.commit()


def _validate_register_payload(payload: dict):
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

    return {
        "name": name,
        "email": email,
        "password": password,
        "organization_name": organization_name,
        "unit_name": unit_name,
        "position_name": position_name,
    }


def request_register_otp(payload: dict):
    data = _validate_register_payload(payload)
    return _create_otp(data["email"], OTP_PURPOSE_REGISTER)


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
    data = _validate_register_payload(payload)
    _verify_otp(data["email"], OTP_PURPOSE_REGISTER, payload.get("otp"))

    default_role = (
        Role.query.filter(Role.is_default.is_(True), Role.status == "Active").first()
        or Role.query.filter(Role.name.ilike("Viewer"), Role.status == "Active").first()
        or Role.query.filter(Role.name.ilike("Project Manager"), Role.status == "Active").first()
        or Role.query.filter(Role.status == "Active").first()
    )
    if not default_role:
        raise ApiError("Role default belum tersedia. Hubungi administrator.", status_code=500)

    employee = Employee.query.filter(Employee.email.ilike(data["email"])).first()
    if not employee:
        employee_ids = [item.id for item in Employee.query.with_entities(Employee.id).all()]
        nips = [item.nip for item in Employee.query.with_entities(Employee.nip).all()]
        employee = Employee(
            id=next_string_id(employee_ids, "emp-", default_start=1, width=3),
            nip=next_string_id(nips, "REG-", default_start=1, width=5),
            name=data["name"],
            email=data["email"],
            organization=data["organization_name"],
            unit_organization=data["unit_name"],
            position=data["position_name"],
            role_id=default_role.id,
            status="Active",
        )
        db.session.add(employee)
    else:
        employee.name = employee.name or data["name"]

    user = User(
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
        display_name=data["name"],
        role_id=employee.role_id or default_role.id,
        employee_id=employee.id,
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return login(data["email"], data["password"])


def get_profile(user_id: str):
    user = _get_active_user(user_id)
    employee = None
    if user.employee_id:
        employee = user.employee
    role = _effective_role(user)

    return {
        "id": user.id,
        "name": user.display_name,
        "email": user.email,
        "initials": _initials(user.display_name),
        "role_id": role.id if role else user.role_id,
        "role": role.name if role else None,
        "permissions": get_user_permissions(user),
        "employee_id": employee.id if employee else None,
        "employee_name": employee.name if employee else None,
        "organization": employee.organization if employee else None,
        "unit_organization": employee.unit_organization if employee else None,
        "position": employee.position if employee else None,
        "onboarding_completed": bool(user.onboarding_completed),
    }


def complete_onboarding(user_id: str):
    user = _get_active_user(user_id)
    user.onboarding_completed = True
    db.session.commit()
    return get_profile(user_id)


def request_change_password_otp(user_id: str, current_password: str, new_password: str, confirm_password: str):
    user = _get_active_user(user_id)

    if not check_password_hash(user.password_hash, current_password):
        raise ApiError("Password saat ini tidak sesuai.", status_code=400)

    normalized_new_password = (new_password or "").strip()
    if len(normalized_new_password) < 8:
        raise ApiError("Password baru minimal 8 karakter.", status_code=400)

    if check_password_hash(user.password_hash, normalized_new_password):
        raise ApiError("Password baru harus berbeda dari password saat ini.", status_code=400)

    if normalized_new_password != (confirm_password or "").strip():
        raise ApiError("Konfirmasi password baru tidak cocok.", status_code=400)

    return _create_otp(user.email, OTP_PURPOSE_CHANGE_PASSWORD, user=user)


def change_password(user_id: str, current_password: str, new_password: str, otp: str):
    user = _get_active_user(user_id)

    if not check_password_hash(user.password_hash, current_password):
        raise ApiError("Password saat ini tidak sesuai.", status_code=400)

    normalized_new_password = (new_password or "").strip()
    if len(normalized_new_password) < 8:
        raise ApiError("Password baru minimal 8 karakter.", status_code=400)

    if check_password_hash(user.password_hash, normalized_new_password):
        raise ApiError("Password baru harus berbeda dari password saat ini.", status_code=400)

    _verify_otp(user.email, OTP_PURPOSE_CHANGE_PASSWORD, otp)
    user.password_hash = generate_password_hash(normalized_new_password)
    enqueue_event_email(
        user=user,
        event_key="auth.password_changed",
        template_key="password_changed",
        subject="Konfirmasi: password berhasil diubah",
        context={"target_url": "/profil"},
        entity_type="auth",
        entity_id=user.id,
    )
    db.session.commit()


def list_my_projects(user_id: str, member_only: bool = False):
    user = _get_active_user(user_id)

    if not user.employee_id:
        return []

    if member_only:
        return (
            Project.query
            .filter(Project.members.any(ProjectMember.employee_id == user.employee_id))
            .order_by(Project.updated_at.desc(), Project.name.asc())
            .all()
        )

    return (
        Project.query
        .filter(
            or_(
                Project.manager_id == user.employee_id,
                Project.members.any(ProjectMember.employee_id == user.employee_id),
            )
        )
        .order_by(Project.updated_at.desc(), Project.name.asc())
        .all()
    )


def get_my_assignment_counter(user_id: str):
    user = _get_active_user(user_id)
    aliases = _assignment_aliases(user)
    if not aliases:
        return {
            "active_tasks": 0,
            "active_issues": 0,
            "total_active": 0,
        }

    task_count = Task.query.filter(
        Task.assignee.in_(aliases),
        Task.progress_percentage < 100,
    ).count()
    issue_count = Issue.query.filter(
        Issue.assignee.in_(aliases),
        Issue.status != "Resolved",
    ).count()

    return {
        "active_tasks": task_count,
        "active_issues": issue_count,
        "total_active": task_count + issue_count,
    }

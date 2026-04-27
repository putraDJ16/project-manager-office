from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash

from app.models import User
from app.utils.exceptions import ApiError


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
        },
    }


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
        "organization": employee.organization if employee else None,
        "unit_organization": employee.unit_organization if employee else None,
        "position": employee.position if employee else None,
    }

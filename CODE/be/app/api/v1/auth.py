from flask import request
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import projects_schema
from app.services.auth_service import change_password, get_profile, list_my_projects, login, register, register_options
from app.utils.exceptions import ApiError
from app.utils.http import success_response


@api_v1.post("/auth/login")
def login_handler():
    payload = request.get_json(silent=True) or {}
    result = login(payload.get("email", ""), payload.get("password", ""))
    return success_response(result)


@api_v1.post("/auth/register")
def register_handler():
    payload = request.get_json(silent=True) or {}
    result = register(payload)
    return success_response(result, message="Pendaftaran berhasil.", status_code=201)


@api_v1.get("/auth/register-options")
def register_options_handler():
    return success_response(register_options())


@api_v1.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh_handler():
    claims = get_jwt()
    identity = claims["sub"]
    next_access = create_access_token(
        identity=identity,
        additional_claims={
            "email": claims.get("email"),
            "name": claims.get("name"),
            "role_id": claims.get("role_id"),
        },
    )
    return success_response({"access_token": next_access})


@api_v1.get("/auth/me")
@jwt_required()
def me_handler():
    claims = get_jwt()
    identity = claims["sub"]
    profile = get_profile(identity)
    return success_response(profile)


@api_v1.post("/auth/change-password")
@jwt_required()
def change_password_handler():
    claims = get_jwt()
    identity = claims["sub"]
    payload = request.get_json(silent=True) or {}

    current_password = (payload.get("current_password") or "").strip()
    new_password = (payload.get("new_password") or "").strip()
    confirm_password = (payload.get("confirm_password") or "").strip()

    if not current_password:
        raise ApiError("Password saat ini wajib diisi.")
    if not new_password:
        raise ApiError("Password baru wajib diisi.")
    if new_password != confirm_password:
        raise ApiError("Konfirmasi password baru tidak cocok.")

    change_password(identity, current_password, new_password)
    return success_response(None, message="Password berhasil diubah.")


@api_v1.get("/auth/my-projects")
@jwt_required()
def my_projects_handler():
    claims = get_jwt()
    identity = claims["sub"]
    projects = list_my_projects(identity)
    return success_response(projects_schema.dump(projects))

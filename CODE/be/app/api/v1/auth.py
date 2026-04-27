from flask import request
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

from app.api.v1 import api_v1
from app.services.auth_service import get_profile, login
from app.utils.http import success_response


@api_v1.post("/auth/login")
def login_handler():
    payload = request.get_json(silent=True) or {}
    result = login(payload.get("email", ""), payload.get("password", ""))
    return success_response(result)


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

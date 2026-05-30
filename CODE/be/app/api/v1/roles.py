from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import role_schema, roles_schema
from app.services import role_service
from app.utils.http import success_response
from app.utils.permissions import require_permission


@api_v1.get("/roles")
@jwt_required()
@require_permission("masterRoles", "view")
def list_roles_handler():
    roles = role_service.list_roles()
    return success_response(roles_schema.dump(roles))


@api_v1.post("/roles")
@jwt_required()
@require_permission("masterRoles", "create")
def create_role_handler():
    payload = request.get_json(silent=True) or {}
    role = role_service.create_role(payload)
    return success_response(role_schema.dump(role), message="Role berhasil ditambahkan.", status_code=201)


@api_v1.patch("/roles/<string:role_id>")
@jwt_required()
@require_permission("masterRoles", "edit")
def update_role_handler(role_id: str):
    payload = request.get_json(silent=True) or {}
    role = role_service.update_role(role_id, payload)
    return success_response(role_schema.dump(role), message="Role berhasil diperbarui.")


@api_v1.patch("/roles/<string:role_id>/status")
@jwt_required()
@require_permission("masterRoles", "edit")
def update_role_status_handler(role_id: str):
    payload = request.get_json(silent=True) or {}
    role = role_service.update_role_status(role_id, payload.get("status", ""))
    return success_response(role_schema.dump(role), message="Status role berhasil diperbarui.")


@api_v1.patch("/roles/<string:role_id>/default")
@jwt_required()
@require_permission("masterRoles", "edit")
def set_default_role_handler(role_id: str):
    role = role_service.set_default_role(role_id)
    return success_response(role_schema.dump(role), message="Role default pengguna baru berhasil diperbarui.")

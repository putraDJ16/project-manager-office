from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import position_schema, positions_schema
from app.services import position_service
from app.utils.http import success_response
from app.utils.permissions import require_any_permission, require_permission


@api_v1.get("/positions")
@jwt_required()
@require_any_permission((("masterPositions", "view"), ("masterEmployees", "view")))
def list_positions_handler():
    positions = position_service.list_positions()
    return success_response(positions_schema.dump(positions))


@api_v1.post("/positions")
@jwt_required()
@require_permission("masterPositions", "create")
def create_position_handler():
    payload = request.get_json(silent=True) or {}
    position = position_service.create_position(payload)
    return success_response(position_schema.dump(position), message="Jabatan berhasil ditambahkan.", status_code=201)


@api_v1.patch("/positions/<string:position_id>")
@jwt_required()
@require_permission("masterPositions", "edit")
def update_position_handler(position_id: str):
    payload = request.get_json(silent=True) or {}
    position = position_service.update_position(position_id, payload)
    return success_response(position_schema.dump(position), message="Jabatan berhasil diperbarui.")


@api_v1.patch("/positions/<string:position_id>/status")
@jwt_required()
@require_permission("masterPositions", "edit")
def update_position_status_handler(position_id: str):
    payload = request.get_json(silent=True) or {}
    position = position_service.update_position_status(position_id, payload.get("status", ""))
    return success_response(position_schema.dump(position), message="Status jabatan berhasil diperbarui.")

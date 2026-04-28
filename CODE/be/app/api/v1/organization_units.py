from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import organization_unit_schema, organization_units_schema
from app.services import organization_unit_service
from app.utils.http import success_response


@api_v1.get("/organization-units")
@jwt_required()
def list_organization_units_handler():
    units = organization_unit_service.list_organization_units()
    return success_response(organization_units_schema.dump(units))


@api_v1.post("/organization-units")
@jwt_required()
def create_organization_unit_handler():
    payload = request.get_json(silent=True) or {}
    unit = organization_unit_service.create_organization_unit(payload)
    return success_response(
        organization_unit_schema.dump(unit),
        message="Unit organisasi berhasil ditambahkan.",
        status_code=201,
    )


@api_v1.patch("/organization-units/<string:unit_id>")
@jwt_required()
def update_organization_unit_handler(unit_id: str):
    payload = request.get_json(silent=True) or {}
    unit = organization_unit_service.update_organization_unit(unit_id, payload)
    return success_response(organization_unit_schema.dump(unit), message="Unit organisasi berhasil diperbarui.")


@api_v1.patch("/organization-units/<string:unit_id>/status")
@jwt_required()
def update_organization_unit_status_handler(unit_id: str):
    payload = request.get_json(silent=True) or {}
    unit = organization_unit_service.update_organization_unit_status(unit_id, payload.get("status", ""))
    return success_response(
        organization_unit_schema.dump(unit), message="Status unit organisasi berhasil diperbarui."
    )

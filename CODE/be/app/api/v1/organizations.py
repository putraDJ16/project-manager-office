from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import organization_schema, organizations_schema
from app.services import organization_service
from app.utils.http import success_response


@api_v1.get("/organizations")
@jwt_required()
def list_organizations_handler():
    organizations = organization_service.list_organizations()
    return success_response(organizations_schema.dump(organizations))


@api_v1.post("/organizations")
@jwt_required()
def create_organization_handler():
    payload = request.get_json(silent=True) or {}
    organization = organization_service.create_organization(payload)
    return success_response(
        organization_schema.dump(organization),
        message="Organisasi berhasil ditambahkan.",
        status_code=201,
    )


@api_v1.patch("/organizations/<string:organization_id>")
@jwt_required()
def update_organization_handler(organization_id: str):
    payload = request.get_json(silent=True) or {}
    organization = organization_service.update_organization(organization_id, payload)
    return success_response(organization_schema.dump(organization), message="Organisasi berhasil diperbarui.")


@api_v1.patch("/organizations/<string:organization_id>/status")
@jwt_required()
def update_organization_status_handler(organization_id: str):
    payload = request.get_json(silent=True) or {}
    organization = organization_service.update_organization_status(organization_id, payload.get("status", ""))
    return success_response(organization_schema.dump(organization), message="Status organisasi berhasil diperbarui.")

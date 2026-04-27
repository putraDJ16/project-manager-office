from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import phase_schema, phases_schema, project_schema, projects_schema
from app.services import project_service
from app.utils.http import success_response


@api_v1.get("/projects")
@jwt_required()
def list_projects_handler():
    projects = project_service.list_projects()
    return success_response(projects_schema.dump(projects))


@api_v1.post("/projects")
@jwt_required()
def create_project_handler():
    payload = request.get_json(silent=True) or {}
    project = project_service.create_project(payload)
    return success_response(project_schema.dump(project), message="Project berhasil ditambahkan.", status_code=201)


@api_v1.patch("/projects/<string:project_id>")
@jwt_required()
def update_project_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    project = project_service.update_project(project_id, payload)
    return success_response(project_schema.dump(project), message="Project berhasil diperbarui.")


@api_v1.get("/projects/<string:project_id>/phases")
@jwt_required()
def list_phases_handler(project_id: str):
    phases = project_service.list_phases(project_id)
    return success_response(phases_schema.dump(phases))


@api_v1.post("/projects/<string:project_id>/phases")
@jwt_required()
def create_phase_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    phase = project_service.create_phase(project_id, payload)
    return success_response(phase_schema.dump(phase), message="Fase berhasil ditambahkan.", status_code=201)

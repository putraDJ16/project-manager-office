from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import (
    phase_schema,
    phases_schema,
    project_detail_schema,
    project_holiday_schema,
    project_holidays_schema,
    project_member_schema,
    project_members_schema,
    project_schema,
    projects_schema,
)
from app.services import project_service
from app.utils.http import success_response
from app.utils.permissions import require_permission, require_project_permission


@api_v1.get("/projects")
@jwt_required()
@require_permission("masterProjects", "view")
def list_projects_handler():
    projects = project_service.list_projects()
    return success_response(projects_schema.dump(projects))


@api_v1.post("/projects")
@jwt_required()
@require_permission("masterProjects", "create")
def create_project_handler():
    payload = request.get_json(silent=True) or {}
    project = project_service.create_project(payload)
    return success_response(project_schema.dump(project), message="Project berhasil ditambahkan.", status_code=201)


@api_v1.get("/projects/<string:project_id>")
@jwt_required()
@require_project_permission("masterProjects", "view")
def get_project_handler(project_id: str):
    project = project_service.get_project(project_id)
    return success_response(project_detail_schema.dump(project))


@api_v1.patch("/projects/<string:project_id>")
@jwt_required()
@require_project_permission("masterProjects", "edit")
def update_project_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    project = project_service.update_project(project_id, payload)
    return success_response(project_schema.dump(project), message="Project berhasil diperbarui.")


@api_v1.get("/projects/<string:project_id>/phases")
@jwt_required()
@require_project_permission("projectPhases", "view")
def list_phases_handler(project_id: str):
    phases = project_service.list_phases(project_id)
    return success_response(phases_schema.dump(phases))


@api_v1.post("/projects/<string:project_id>/phases")
@jwt_required()
@require_project_permission("projectPhases", "create")
def create_phase_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    phase = project_service.create_phase(project_id, payload)
    return success_response(phase_schema.dump(phase), message="Fase berhasil ditambahkan.", status_code=201)


@api_v1.get("/projects/<string:project_id>/members")
@jwt_required()
@require_project_permission("projectMembers", "view")
def list_members_handler(project_id: str):
    members = project_service.list_members(project_id)
    return success_response(project_members_schema.dump(members))


@api_v1.post("/projects/<string:project_id>/members")
@jwt_required()
@require_project_permission("projectMembers", "create")
def add_member_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    member = project_service.add_member(project_id, payload)
    return success_response(project_member_schema.dump(member), message="Anggota berhasil ditambahkan.", status_code=201)


@api_v1.delete("/projects/<string:project_id>/members/<string:employee_id>")
@jwt_required()
@require_project_permission("projectMembers", "delete")
def remove_member_handler(project_id: str, employee_id: str):
    project_service.remove_member(project_id, employee_id)
    return success_response(None, message="Anggota berhasil dihapus dari project.")


@api_v1.get("/projects/<string:project_id>/holidays")
@jwt_required()
@require_project_permission("masterProjects", "view")
def list_project_holidays_handler(project_id: str):
    holidays = project_service.list_holidays(project_id)
    return success_response(project_holidays_schema.dump(holidays))


@api_v1.post("/projects/<string:project_id>/holidays")
@jwt_required()
@require_project_permission("masterProjects", "edit")
def create_project_holiday_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    holiday = project_service.create_holiday(project_id, payload)
    return success_response(project_holiday_schema.dump(holiday), message="Hari libur project berhasil ditambahkan.", status_code=201)


@api_v1.delete("/projects/<string:project_id>/holidays/<int:holiday_id>")
@jwt_required()
@require_project_permission("masterProjects", "edit")
def delete_project_holiday_handler(project_id: str, holiday_id: int):
    project_service.delete_holiday(project_id, holiday_id)
    return success_response(None, message="Hari libur project berhasil dihapus.")

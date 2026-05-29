from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import task_timesheet_schema, task_timesheets_schema
from app.services import timesheet_service
from app.utils.http import success_response
from app.utils.permissions import get_current_user, require_project_permission


@api_v1.get("/my-timesheets")
@jwt_required()
def list_my_timesheets_handler():
    user = get_current_user()
    timesheets = timesheet_service.list_my_timesheets(
        user=user,
        start_date=request.args.get("start_date"),
        end_date=request.args.get("end_date"),
    )
    return success_response(task_timesheets_schema.dump(timesheets))


@api_v1.get("/projects/<string:project_id>/timesheets")
@jwt_required()
@require_project_permission("projectTimesheets", "view")
def list_project_timesheets_handler(project_id: str):
    timesheets = timesheet_service.list_project_timesheets(
        project_id=project_id,
        start_date=request.args.get("start_date"),
        end_date=request.args.get("end_date"),
    )
    return success_response(task_timesheets_schema.dump(timesheets))


@api_v1.post("/my-timesheets")
@jwt_required()
def create_my_timesheet_handler():
    payload = request.get_json(silent=True) or {}
    user = get_current_user()
    timesheet = timesheet_service.create_my_timesheet(payload, user=user)
    return success_response(task_timesheet_schema.dump(timesheet), message="Timesheet berhasil ditambahkan.", status_code=201)


@api_v1.patch("/my-timesheets/<int:timesheet_id>")
@jwt_required()
def update_my_timesheet_handler(timesheet_id: int):
    payload = request.get_json(silent=True) or {}
    user = get_current_user()
    timesheet = timesheet_service.update_my_timesheet(timesheet_id, payload, user=user)
    return success_response(task_timesheet_schema.dump(timesheet), message="Timesheet berhasil diperbarui.")


@api_v1.delete("/my-timesheets/<int:timesheet_id>")
@jwt_required()
def delete_my_timesheet_handler(timesheet_id: int):
    user = get_current_user()
    timesheet_service.delete_my_timesheet(timesheet_id, user=user)
    return success_response(None, message="Timesheet berhasil dihapus.")

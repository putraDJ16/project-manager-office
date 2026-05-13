from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import (
    calendar_meetings_schema,
    meeting_attendee_schema,
    meeting_attendees_schema,
    meeting_schema,
    meetings_schema,
)
from app.services import meeting_service
from app.utils.http import success_response
from app.utils.permissions import get_current_user, require_project_permission


@api_v1.get("/projects/<string:project_id>/meetings")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def list_meetings_handler(project_id: str):
    meetings = meeting_service.list_meetings(project_id, request.args)
    return success_response(meetings_schema.dump(meetings))


@api_v1.post("/projects/<string:project_id>/meetings")
@jwt_required()
@require_project_permission("projectMeetings", "create")
def create_meeting_handler(project_id: str):
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    meeting = meeting_service.create_meeting(project_id, payload, user_id=user.id)
    return success_response(meeting_schema.dump(meeting), message="Meeting berhasil dibuat.", status_code=201)


@api_v1.get("/projects/<string:project_id>/meetings/<int:meeting_id>")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def get_meeting_handler(project_id: str, meeting_id: int):
    meeting = meeting_service.get_meeting(project_id, meeting_id)
    return success_response(meeting_schema.dump(meeting))


@api_v1.patch("/projects/<string:project_id>/meetings/<int:meeting_id>")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def update_meeting_handler(project_id: str, meeting_id: int):
    payload = request.get_json(silent=True) or {}
    meeting = meeting_service.update_meeting(project_id, meeting_id, payload)
    return success_response(meeting_schema.dump(meeting), message="Meeting berhasil diperbarui.")


@api_v1.delete("/projects/<string:project_id>/meetings/<int:meeting_id>")
@jwt_required()
@require_project_permission("projectMeetings", "delete")
def delete_meeting_handler(project_id: str, meeting_id: int):
    meeting_service.delete_meeting(project_id, meeting_id)
    return success_response(None, message="Meeting berhasil dihapus.")


@api_v1.post("/projects/<string:project_id>/meetings/<int:meeting_id>/attendees")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def add_attendees_handler(project_id: str, meeting_id: int):
    payload = request.get_json(silent=True) or {}
    attendees = meeting_service.add_attendees(project_id, meeting_id, payload.get("attendee_ids") or [])
    return success_response(meeting_attendees_schema.dump(attendees), message="Peserta meeting berhasil ditambahkan.", status_code=201)


@api_v1.delete("/projects/<string:project_id>/meetings/<int:meeting_id>/attendees/<string:employee_id>")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def remove_attendee_handler(project_id: str, meeting_id: int, employee_id: str):
    meeting_service.remove_attendee(project_id, meeting_id, employee_id)
    return success_response(None, message="Peserta meeting berhasil dihapus.")


@api_v1.patch("/projects/<string:project_id>/meetings/<int:meeting_id>/attendees/rsvp")
@jwt_required()
def rsvp_meeting_handler(project_id: str, meeting_id: int):
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    attendee = meeting_service.rsvp_meeting(project_id, meeting_id, user, payload)
    return success_response(meeting_attendee_schema.dump(attendee), message="RSVP meeting berhasil diperbarui.")


@api_v1.get("/my-calendar")
@jwt_required()
def my_calendar_handler():
    user = get_current_user()
    events = meeting_service.list_my_calendar(
        user,
        request.args.get("start_date"),
        request.args.get("end_date"),
        request.args.get("project_ids"),
    )
    return success_response(calendar_meetings_schema.dump(events))

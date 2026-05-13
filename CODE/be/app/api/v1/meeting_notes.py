from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import meeting_action_item_schema, meeting_note_schema, meeting_note_summaries_schema
from app.services import meeting_note_service
from app.utils.http import success_response
from app.utils.permissions import get_current_user, require_project_permission


@api_v1.get("/projects/<string:project_id>/meetings/<int:meeting_id>/note")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def get_meeting_note_handler(project_id: str, meeting_id: int):
    note = meeting_note_service.get_note(project_id, meeting_id)
    return success_response(meeting_note_schema.dump(note) if note else None)


@api_v1.put("/projects/<string:project_id>/meetings/<int:meeting_id>/note")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def upsert_meeting_note_handler(project_id: str, meeting_id: int):
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    note = meeting_note_service.upsert_note(project_id, meeting_id, payload, user_id=user.id)
    return success_response(meeting_note_schema.dump(note), message="Catatan meeting berhasil disimpan.")


@api_v1.delete("/projects/<string:project_id>/meetings/<int:meeting_id>/note")
@jwt_required()
@require_project_permission("projectMeetings", "delete")
def delete_meeting_note_handler(project_id: str, meeting_id: int):
    meeting_note_service.delete_note(project_id, meeting_id)
    return success_response(None, message="Catatan meeting berhasil dihapus.")


@api_v1.post("/projects/<string:project_id>/meetings/<int:meeting_id>/note/action-items")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def create_action_item_handler(project_id: str, meeting_id: int):
    payload = request.get_json(silent=True) or {}
    item = meeting_note_service.create_action_item(project_id, meeting_id, payload)
    return success_response(meeting_action_item_schema.dump(item), message="Action item berhasil ditambahkan.", status_code=201)


@api_v1.patch("/projects/<string:project_id>/meetings/<int:meeting_id>/note/action-items/<int:item_id>")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def update_action_item_handler(project_id: str, meeting_id: int, item_id: int):
    payload = request.get_json(silent=True) or {}
    item = meeting_note_service.update_action_item(project_id, meeting_id, item_id, payload)
    return success_response(meeting_action_item_schema.dump(item), message="Action item berhasil diperbarui.")


@api_v1.delete("/projects/<string:project_id>/meetings/<int:meeting_id>/note/action-items/<int:item_id>")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def delete_action_item_handler(project_id: str, meeting_id: int, item_id: int):
    meeting_note_service.delete_action_item(project_id, meeting_id, item_id)
    return success_response(None, message="Action item berhasil dihapus.")


@api_v1.get("/projects/<string:project_id>/meeting-notes")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def list_project_meeting_notes_handler(project_id: str):
    summaries = meeting_note_service.list_project_meeting_notes(project_id, request.args)
    return success_response(meeting_note_summaries_schema.dump(summaries))

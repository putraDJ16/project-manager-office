from flask import request, send_from_directory
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import meeting_file_schema, meeting_files_schema
from app.services import meeting_file_service
from app.utils.http import success_response
from app.utils.permissions import get_current_user, require_project_permission


@api_v1.get("/projects/<string:project_id>/meetings/<int:meeting_id>/files")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def list_meeting_files_handler(project_id: str, meeting_id: int):
    files = meeting_file_service.list_files(project_id, meeting_id)
    return success_response(meeting_files_schema.dump(files))


@api_v1.post("/projects/<string:project_id>/meetings/<int:meeting_id>/files")
@jwt_required()
@require_project_permission("projectMeetings", "edit")
def upload_meeting_file_handler(project_id: str, meeting_id: int):
    user = get_current_user()
    file_item = meeting_file_service.upload_file(
        project_id,
        meeting_id,
        {"description": request.form.get("description")},
        request.files.get("file"),
        user_id=user.id,
    )
    return success_response(meeting_file_schema.dump(file_item), message="File meeting berhasil diunggah.", status_code=201)


@api_v1.get("/projects/<string:project_id>/meetings/<int:meeting_id>/files/<int:file_id>/download")
@jwt_required()
@require_project_permission("projectMeetings", "view")
def download_meeting_file_handler(project_id: str, meeting_id: int, file_id: int):
    payload = meeting_file_service.get_download_payload(project_id, meeting_id, file_id)
    return send_from_directory(
        payload["directory"],
        payload["stored_name"],
        as_attachment=True,
        download_name=payload["download_name"],
    )


@api_v1.delete("/projects/<string:project_id>/meetings/<int:meeting_id>/files/<int:file_id>")
@jwt_required()
def delete_meeting_file_handler(project_id: str, meeting_id: int, file_id: int):
    user = get_current_user()
    meeting_file_service.delete_file(project_id, meeting_id, file_id, user)
    return success_response(None, message="File meeting berhasil dihapus.")

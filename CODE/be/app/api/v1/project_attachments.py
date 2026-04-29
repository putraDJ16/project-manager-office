from flask import request, send_from_directory
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import (
    project_attachment_file_schema,
    project_attachment_files_schema,
    project_attachment_folder_schema,
    project_attachment_folders_schema,
)
from app.services import project_attachment_service
from app.utils.http import success_response
from app.utils.permissions import require_permission


@api_v1.get("/projects/<string:project_id>/attachments/folders")
@jwt_required()
@require_permission("projectAttachments", "view")
def list_attachment_folders_handler(project_id: str):
    folders = project_attachment_service.list_folders(project_id)
    return success_response(project_attachment_folders_schema.dump(folders))


@api_v1.post("/projects/<string:project_id>/attachments/folders")
@jwt_required()
@require_permission("projectAttachments", "create")
def create_attachment_folder_handler(project_id: str):
    payload = request.get_json(silent=True) or {}
    folder = project_attachment_service.create_folder(project_id, payload)
    return success_response(
        project_attachment_folder_schema.dump(folder),
        message="Folder lampiran berhasil ditambahkan.",
        status_code=201,
    )


@api_v1.patch("/projects/<string:project_id>/attachments/folders/<string:folder_id>")
@jwt_required()
@require_permission("projectAttachments", "edit")
def update_attachment_folder_handler(project_id: str, folder_id: str):
    payload = request.get_json(silent=True) or {}
    folder = project_attachment_service.update_folder(project_id, folder_id, payload)
    return success_response(
        project_attachment_folder_schema.dump(folder),
        message="Folder lampiran berhasil diperbarui.",
    )


@api_v1.delete("/projects/<string:project_id>/attachments/folders/<string:folder_id>")
@jwt_required()
@require_permission("projectAttachments", "delete")
def delete_attachment_folder_handler(project_id: str, folder_id: str):
    project_attachment_service.delete_folder(project_id, folder_id)
    return success_response(None, message="Folder lampiran berhasil dihapus.")


@api_v1.get("/projects/<string:project_id>/attachments/files")
@jwt_required()
@require_permission("projectAttachments", "view")
def list_attachment_files_handler(project_id: str):
    folder_id = (request.args.get("folder_id") or "").strip() or None
    files = project_attachment_service.list_files(project_id, folder_id=folder_id)
    return success_response(project_attachment_files_schema.dump(files))


@api_v1.post("/projects/<string:project_id>/attachments/files")
@jwt_required()
@require_permission("projectAttachments", "create")
def upload_attachment_file_handler(project_id: str):
    payload = {
        "folder_id": request.form.get("folder_id"),
        "description": request.form.get("description"),
    }
    upload = request.files.get("file")
    claims = get_jwt()
    uploaded_by = str(claims.get("sub") or "")
    file_item = project_attachment_service.upload_file(project_id, payload, upload, uploaded_by=uploaded_by)
    return success_response(
        project_attachment_file_schema.dump(file_item),
        message="File lampiran berhasil diunggah.",
        status_code=201,
    )


@api_v1.patch("/projects/<string:project_id>/attachments/files/<string:file_id>")
@jwt_required()
@require_permission("projectAttachments", "edit")
def update_attachment_file_handler(project_id: str, file_id: str):
    payload = request.get_json(silent=True) or {}
    file_item = project_attachment_service.update_file(project_id, file_id, payload)
    return success_response(
        project_attachment_file_schema.dump(file_item),
        message="File lampiran berhasil diperbarui.",
    )


@api_v1.delete("/projects/<string:project_id>/attachments/files/<string:file_id>")
@jwt_required()
@require_permission("projectAttachments", "delete")
def delete_attachment_file_handler(project_id: str, file_id: str):
    project_attachment_service.delete_file(project_id, file_id)
    return success_response(None, message="File lampiran berhasil dihapus.")


@api_v1.get("/projects/<string:project_id>/attachments/files/<string:file_id>/download")
@jwt_required()
@require_permission("projectAttachments", "view")
def download_attachment_file_handler(project_id: str, file_id: str):
    payload = project_attachment_service.get_download_payload(project_id, file_id)
    return send_from_directory(
        payload["directory"],
        payload["stored_name"],
        as_attachment=True,
        download_name=payload["download_name"],
    )

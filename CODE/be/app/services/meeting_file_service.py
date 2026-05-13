import os
from uuid import uuid4

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import ProjectMeetingFile, User
from app.services.meeting_service import _ensure_meeting
from app.services.project_attachment_service import _project_storage_dir, _safe_remove
from app.utils.exceptions import ApiError
from app.utils.permissions import user_has_permission, user_is_project_member


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt"}
MAX_FILE_BYTES = 20 * 1024 * 1024


def _validate_upload(upload: FileStorage | None):
    if not upload:
        raise ApiError("File wajib diunggah.", errors={"file": "required"})

    filename = secure_filename(upload.filename or "")
    if not filename:
        raise ApiError("Nama file tidak valid.", errors={"file": "invalid_name"})

    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ApiError("Tipe file meeting tidak didukung.", errors={"file": "unsupported_type"})

    stream = upload.stream
    current_position = stream.tell()
    stream.seek(0, os.SEEK_END)
    size_bytes = stream.tell()
    stream.seek(current_position)
    if size_bytes > MAX_FILE_BYTES:
        raise ApiError("Ukuran file meeting maksimal 20 MB.", errors={"file": "too_large"})
    return filename, extension


def list_files(project_id: str, meeting_id: int):
    _ensure_meeting(project_id, meeting_id)
    return ProjectMeetingFile.query.filter_by(meeting_id=meeting_id).order_by(ProjectMeetingFile.created_at.desc()).all()


def upload_file(project_id: str, meeting_id: int, payload: dict, upload: FileStorage | None, user_id: int | None = None):
    meeting = _ensure_meeting(project_id, meeting_id)
    filename, extension = _validate_upload(upload)
    description = (payload.get("description") or "").strip() or None

    stored_name = f"meeting-{meeting.id}_{uuid4().hex}{extension}"
    project_dir = _project_storage_dir(project_id)
    file_path = os.path.join(project_dir, stored_name)
    upload.save(file_path)
    size_bytes = os.path.getsize(file_path)

    file_item = ProjectMeetingFile(
        meeting_id=meeting.id,
        original_name=filename,
        stored_name=stored_name,
        mime_type=upload.mimetype,
        size_bytes=size_bytes,
        description=description,
        uploaded_by=user_id,
    )
    db.session.add(file_item)
    db.session.commit()
    return file_item


def _ensure_file(project_id: str, meeting_id: int, file_id: int):
    _ensure_meeting(project_id, meeting_id)
    file_item = ProjectMeetingFile.query.filter_by(id=file_id, meeting_id=meeting_id).first()
    if not file_item:
        raise ApiError("File meeting tidak ditemukan.", status_code=404)
    return file_item


def delete_file(project_id: str, meeting_id: int, file_id: int, user: User):
    file_item = _ensure_file(project_id, meeting_id, file_id)
    can_delete = (
        file_item.uploaded_by == user.id
        or user_has_permission(user, "projectMeetings", "delete")
        or user_is_project_member(user, project_id)
    )
    if not can_delete:
        raise ApiError("Anda tidak memiliki izin untuk menghapus file meeting.", status_code=403)

    project_dir = _project_storage_dir(project_id)
    _safe_remove(os.path.join(project_dir, file_item.stored_name))
    db.session.delete(file_item)
    db.session.commit()


def get_download_payload(project_id: str, meeting_id: int, file_id: int):
    file_item = _ensure_file(project_id, meeting_id, file_id)
    project_dir = _project_storage_dir(project_id)
    file_path = os.path.join(project_dir, file_item.stored_name)
    if not os.path.exists(file_path):
        raise ApiError("File fisik meeting tidak ditemukan.", status_code=404)
    return {"directory": project_dir, "stored_name": file_item.stored_name, "download_name": file_item.original_name}

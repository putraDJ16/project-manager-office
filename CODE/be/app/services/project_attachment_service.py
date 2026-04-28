import os
from uuid import uuid4

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Project, ProjectAttachmentFile, ProjectAttachmentFolder
from app.repositories import ProjectAttachmentRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def _ensure_project(project_id: str):
    project = Project.query.get(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return project


def _storage_root():
    configured = current_app.config.get("ATTACHMENT_STORAGE_DIR")
    if configured:
        root = configured
    else:
        root = os.path.abspath(os.path.join(current_app.root_path, "..", "storage", "attachments"))
    os.makedirs(root, exist_ok=True)
    return root


def _project_storage_dir(project_id: str):
    path = os.path.join(_storage_root(), project_id)
    os.makedirs(path, exist_ok=True)
    return path


def _build_folder_map(project_id: str):
    folders = ProjectAttachmentRepository.list_folders(project_id)
    return {folder.id: folder for folder in folders}


def list_folders(project_id: str):
    _ensure_project(project_id)
    return ProjectAttachmentRepository.list_folders(project_id)


def create_folder(project_id: str, payload: dict):
    _ensure_project(project_id)
    name = (payload.get("name") or "").strip()
    parent_id = (payload.get("parent_id") or "").strip() or None

    if not name:
        raise ApiError("Nama folder wajib diisi.")

    if parent_id:
        parent = ProjectAttachmentRepository.get_folder(parent_id)
        if not parent or parent.project_id != project_id:
            raise ApiError("Folder induk tidak ditemukan pada project ini.", errors={"parent_id": "not_found"})

    duplicate = ProjectAttachmentRepository.get_sibling_folder_by_name(project_id, parent_id, name)
    if duplicate:
        raise ApiError("Nama folder sudah digunakan pada level ini.", errors={"name": "duplicate"})

    ids = [item.id for item in ProjectAttachmentFolder.query.with_entities(ProjectAttachmentFolder.id).all()]
    folder = ProjectAttachmentFolder(
        id=next_string_id(ids, "fld-", default_start=1, width=3),
        project_id=project_id,
        name=name,
        parent_id=parent_id,
    )
    db.session.add(folder)
    db.session.commit()
    return folder


def _is_descendant(folder_map: dict[str, ProjectAttachmentFolder], folder_id: str, parent_id: str):
    current_id = parent_id
    while current_id:
        if current_id == folder_id:
            return True
        current_folder = folder_map.get(current_id)
        if not current_folder:
            return False
        current_id = current_folder.parent_id
    return False


def update_folder(project_id: str, folder_id: str, payload: dict):
    _ensure_project(project_id)
    folder = ProjectAttachmentRepository.get_folder(folder_id)
    if not folder or folder.project_id != project_id:
        raise ApiError("Folder tidak ditemukan.", status_code=404)

    name = (payload.get("name") or folder.name).strip()
    next_parent_id = payload.get("parent_id")
    if next_parent_id is None:
        parent_id = folder.parent_id
    else:
        parent_id = (next_parent_id or "").strip() or None

    if not name:
        raise ApiError("Nama folder wajib diisi.")

    if parent_id == folder.id:
        raise ApiError("Folder tidak bisa menjadi parent dirinya sendiri.", errors={"parent_id": "invalid"})

    folder_map = _build_folder_map(project_id)
    if parent_id:
        parent = folder_map.get(parent_id)
        if not parent:
            raise ApiError("Folder induk tidak ditemukan pada project ini.", errors={"parent_id": "not_found"})
        if _is_descendant(folder_map, folder.id, parent_id):
            raise ApiError("Folder tidak bisa dipindah ke dalam subfolder miliknya.", errors={"parent_id": "invalid"})

    duplicate = ProjectAttachmentRepository.get_sibling_folder_by_name(project_id, parent_id, name)
    if duplicate and duplicate.id != folder.id:
        raise ApiError("Nama folder sudah digunakan pada level ini.", errors={"name": "duplicate"})

    folder.name = name
    folder.parent_id = parent_id
    db.session.commit()
    return folder


def _collect_folder_descendants(project_id: str, folder_id: str):
    folders = ProjectAttachmentRepository.list_folders(project_id)
    children_map: dict[str | None, list[str]] = {}
    for folder in folders:
        children_map.setdefault(folder.parent_id, []).append(folder.id)

    stack = [folder_id]
    result = []
    while stack:
        current = stack.pop()
        result.append(current)
        for child_id in children_map.get(current, []):
            stack.append(child_id)
    return result


def _safe_remove(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def delete_folder(project_id: str, folder_id: str):
    _ensure_project(project_id)
    folder = ProjectAttachmentRepository.get_folder(folder_id)
    if not folder or folder.project_id != project_id:
        raise ApiError("Folder tidak ditemukan.", status_code=404)

    descendant_ids = _collect_folder_descendants(project_id, folder_id)
    files = ProjectAttachmentFile.query.filter(
        ProjectAttachmentFile.project_id == project_id, ProjectAttachmentFile.folder_id.in_(descendant_ids)
    ).all()

    project_dir = _project_storage_dir(project_id)
    for file_item in files:
        _safe_remove(os.path.join(project_dir, file_item.stored_name))

    db.session.delete(folder)
    db.session.commit()


def list_files(project_id: str, folder_id: str | None = None):
    _ensure_project(project_id)
    if folder_id:
        folder = ProjectAttachmentRepository.get_folder(folder_id)
        if not folder or folder.project_id != project_id:
            raise ApiError("Folder tidak ditemukan pada project ini.", errors={"folder_id": "not_found"})
        return ProjectAttachmentRepository.list_files(project_id, folder_id)
    return ProjectAttachmentRepository.list_all_files(project_id)


def upload_file(project_id: str, payload: dict, upload: FileStorage | None, uploaded_by: str | None = None):
    _ensure_project(project_id)
    if not upload:
        raise ApiError("File wajib diunggah.", errors={"file": "required"})

    filename = secure_filename(upload.filename or "")
    if not filename:
        raise ApiError("Nama file tidak valid.", errors={"file": "invalid_name"})

    folder_id = (payload.get("folder_id") or "").strip() or None
    description = (payload.get("description") or "").strip() or None

    if folder_id:
        folder = ProjectAttachmentRepository.get_folder(folder_id)
        if not folder or folder.project_id != project_id:
            raise ApiError("Folder tidak ditemukan pada project ini.", errors={"folder_id": "not_found"})

    file_ids = [item.id for item in ProjectAttachmentFile.query.with_entities(ProjectAttachmentFile.id).all()]
    file_id = next_string_id(file_ids, "fil-", default_start=1, width=3)
    extension = os.path.splitext(filename)[1]
    stored_name = f"{file_id}_{uuid4().hex}{extension}"

    project_dir = _project_storage_dir(project_id)
    file_path = os.path.join(project_dir, stored_name)
    upload.save(file_path)
    size_bytes = os.path.getsize(file_path)

    file_item = ProjectAttachmentFile(
        id=file_id,
        project_id=project_id,
        folder_id=folder_id,
        original_name=filename,
        stored_name=stored_name,
        mime_type=upload.mimetype,
        size_bytes=size_bytes,
        description=description,
        uploaded_by=uploaded_by,
    )
    db.session.add(file_item)
    db.session.commit()
    return file_item


def update_file(project_id: str, file_id: str, payload: dict):
    _ensure_project(project_id)
    file_item = ProjectAttachmentRepository.get_file(file_id)
    if not file_item or file_item.project_id != project_id:
        raise ApiError("Lampiran file tidak ditemukan.", status_code=404)

    if "description" in payload:
        file_item.description = (payload.get("description") or "").strip() or None

    if "folder_id" in payload:
        folder_id = (payload.get("folder_id") or "").strip() or None
        if folder_id:
            folder = ProjectAttachmentRepository.get_folder(folder_id)
            if not folder or folder.project_id != project_id:
                raise ApiError("Folder tidak ditemukan pada project ini.", errors={"folder_id": "not_found"})
        file_item.folder_id = folder_id

    db.session.commit()
    return file_item


def delete_file(project_id: str, file_id: str):
    _ensure_project(project_id)
    file_item = ProjectAttachmentRepository.get_file(file_id)
    if not file_item or file_item.project_id != project_id:
        raise ApiError("Lampiran file tidak ditemukan.", status_code=404)

    project_dir = _project_storage_dir(project_id)
    _safe_remove(os.path.join(project_dir, file_item.stored_name))

    db.session.delete(file_item)
    db.session.commit()


def get_download_payload(project_id: str, file_id: str):
    _ensure_project(project_id)
    file_item = ProjectAttachmentRepository.get_file(file_id)
    if not file_item or file_item.project_id != project_id:
        raise ApiError("Lampiran file tidak ditemukan.", status_code=404)

    project_dir = _project_storage_dir(project_id)
    file_path = os.path.join(project_dir, file_item.stored_name)
    if not os.path.exists(file_path):
        raise ApiError("File fisik tidak ditemukan.", status_code=404)

    return {"directory": project_dir, "stored_name": file_item.stored_name, "download_name": file_item.original_name}

# Feature Context: Project Attachments

## Purpose

Mengelola folder dan file lampiran pada project.

## Business Flow

1. User membuka project detail attachments.
2. Frontend memuat folder dan file.
3. User membuat/mengubah/menghapus folder.
4. User upload/update/delete/download file.
5. Backend menyimpan metadata di database dan file di storage directory.

## User Roles / Permissions

Memakai module `projectAttachments`; fallback ke `masterProjects` ada di permission helper. Project member/manager dapat akses via `require_project_permission`.

## Main Backend Files

- `CODE/be/app/api/v1/project_attachments.py`
- `CODE/be/app/services/project_attachment_service.py`
- `CODE/be/app/repositories/project_attachment_repository.py`
- `CODE/be/app/models/project_attachment_folder.py`
- `CODE/be/app/models/project_attachment_file.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/proyek/ProjectDetail.tsx`
- `CODE/fe/src/app/services/projectAttachmentApi.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/projects/<project_id>/attachments/folders` | List folders |
| POST | `/api/v1/projects/<project_id>/attachments/folders` | Create folder |
| PATCH | `/api/v1/projects/<project_id>/attachments/folders/<folder_id>` | Update folder |
| DELETE | `/api/v1/projects/<project_id>/attachments/folders/<folder_id>` | Delete folder |
| GET | `/api/v1/projects/<project_id>/attachments/files` | List files |
| POST | `/api/v1/projects/<project_id>/attachments/files` | Upload file |
| PATCH | `/api/v1/projects/<project_id>/attachments/files/<file_id>` | Update file metadata |
| DELETE | `/api/v1/projects/<project_id>/attachments/files/<file_id>` | Delete file |
| GET | `/api/v1/projects/<project_id>/attachments/files/<file_id>/download` | Download file |

## Database / Models

| Table/Model | Usage |
|---|---|
| `project_attachment_folders` / `ProjectAttachmentFolder` | Folder tree |
| `project_attachment_files` / `ProjectAttachmentFile` | File metadata |
| `projects` / `Project` | Parent project |

## Validation Rules

- Project must exist.
- Folder name required.
- Folder parent must belong to same project.
- Duplicate folder name at same parent level is blocked.
- Folder cannot be parent of itself or moved under its descendant.
- Upload requires a valid file name.
- File folder target must belong to same project.

## Error Handling

Uses `ApiError` for not found, duplicate, invalid parent, invalid file, and permission errors.

## Tests

- `CODE/be/tests/test_project_attachments_api.py`
- `CODE/be/tests/test_permissions_compatibility.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/project_attachments.py`
- `CODE/be/app/services/project_attachment_service.py`
- `CODE/be/app/repositories/project_attachment_repository.py`
- `CODE/fe/src/app/services/projectAttachmentApi.ts`
- Attachment section inside `CODE/fe/src/app/pages/proyek/ProjectDetail.tsx`

## Do Not Change

- Jangan ubah storage path semantics without deployment/env review.
- Jangan expose stored filename directly unless explicitly needed.

## Common Change Scenarios

- Menambah file metadata.
- Menambah file validation.
- Mengubah folder tree behavior.
- Menambah preview/download behavior.

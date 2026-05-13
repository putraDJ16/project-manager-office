# Feature Context: Project Management

## Purpose

Mengelola project, detail project, phase, member, holiday project, dan RASCI metadata.

## Business Flow

1. User melihat daftar project.
2. User dengan permission membuat atau mengubah project.
3. Project detail memuat members, phases, tasks, holidays, attachments, dan issues.
4. Member dapat ditambahkan/dihapus dan dapat memicu notification.
5. Holiday project digunakan oleh task mandays/date calculation.

## User Roles / Permissions

Endpoint memakai `masterProjects`, `projectPhases`, dan `projectMembers`. Project member/manager dapat memperoleh akses melalui `require_project_permission`.

## Main Backend Files

- `CODE/be/app/api/v1/projects.py`
- `CODE/be/app/services/project_service.py`
- `CODE/be/app/repositories/project_repository.py`
- `CODE/be/app/models/project.py`
- `CODE/be/app/models/phase.py`
- `CODE/be/app/models/project_member.py`
- `CODE/be/app/models/project_holiday.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/proyek/ProjectList.tsx`
- `CODE/fe/src/app/pages/proyek/ProjectDetail.tsx`
- `CODE/fe/src/app/pages/proyek/ProjectMonitoring.tsx`
- `CODE/fe/src/app/services/projectApi.ts`
- `CODE/fe/src/app/routes.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/projects` | List project |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/<project_id>` | Project detail |
| PATCH | `/api/v1/projects/<project_id>` | Update project |
| GET | `/api/v1/projects/<project_id>/phases` | List phases |
| POST | `/api/v1/projects/<project_id>/phases` | Create phase |
| GET | `/api/v1/projects/<project_id>/members` | List members |
| POST | `/api/v1/projects/<project_id>/members` | Add member |
| DELETE | `/api/v1/projects/<project_id>/members/<employee_id>` | Remove member |
| GET | `/api/v1/projects/<project_id>/holidays` | List holidays |
| POST | `/api/v1/projects/<project_id>/holidays` | Create holiday |
| DELETE | `/api/v1/projects/<project_id>/holidays/<holiday_id>` | Delete holiday |

## Database / Models

| Table/Model | Usage |
|---|---|
| `projects` / `Project` | Main project data |
| `phases` / `Phase` | Project phases |
| `project_members` / `ProjectMember` | Project membership |
| `project_holidays` / `ProjectHoliday` | Holiday calendar |
| `employees` / `Employee` | Manager and member data |

## Validation Rules

- Project name wajib.
- Project status harus salah satu `PROJECT_STATUS`.
- Priority jika diisi harus salah satu `PROJECT_PRIORITY`.
- Manager jika diisi harus employee valid.
- Phase name wajib.
- Member `employee_id` wajib dan harus employee valid.
- Duplicate member tidak boleh.
- Holiday date wajib valid dan unik per project.

## Error Handling

`ApiError` untuk not found, invalid enum, duplicate, dan permission failure. Duplicate holiday memakai status 409.

## Tests

- `CODE/be/tests/test_tasks_api.py`
- `CODE/be/tests/test_notifications_api.py`
- `CODE/be/tests/test_permissions_compatibility.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/projects.py`
- `CODE/be/app/services/project_service.py`
- `CODE/be/app/repositories/project_repository.py`
- `CODE/fe/src/app/pages/proyek/ProjectList.tsx`
- `CODE/fe/src/app/pages/proyek/ProjectDetail.tsx`
- `CODE/fe/src/app/services/projectApi.ts`

## Do Not Change

- Jangan ubah permission fallback project tanpa update tests.
- Jangan ubah project response fields tanpa update frontend types and schemas.

## Common Change Scenarios

- Menambah field project.
- Menambah validasi RASCI.
- Menambah holiday behavior.
- Menambah filter/search project.

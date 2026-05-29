# Feature Context: Task Management

## Purpose

Mengelola task project, progress, comments, checklist, date, mandays, dan timesheet harian user.

## Business Flow

1. User membuka menu Tugas Saya untuk melihat tab tugas, isu/bug, kalender meeting, indikator timesheet harian, tabulasi proyek, dan input timesheet harian.
2. User membuat task untuk project dan phase valid.
3. User mengubah task fields atau progress sesuai permission.
4. User menambah komentar/checklist jika punya permission, project member, atau assignee.
5. Mandays/date logic mempertimbangkan weekend dan project holidays.

## User Roles / Permissions

Menu/route `Tugas Saya` memakai module `tasks` untuk akses halaman dan list tugas personal/global tanpa filter project. Tab Tugas di detail Proyek memakai module `projectTasks` dan tidak fallback ke `tasks`, supaya akses Tugas Saya tidak otomatis membuka tab tugas proyek. Tab rekap Timesheet di detail Proyek memakai module `projectTimesheets` dan tidak fallback ke `projectTasks`. Interaction memakai `projectTaskComments`. Project member dan assignee punya akses terbatas untuk interaction/progress sesuai helper di `CODE/be/app/api/v1/tasks.py`.

## Main Backend Files

- `CODE/be/app/api/v1/tasks.py`
- `CODE/be/app/services/task_service.py`
- `CODE/be/app/repositories/task_repository.py`
- `CODE/be/app/models/task.py`
- `CODE/be/app/models/task_comment.py`
- `CODE/be/app/models/task_checklist_item.py`
- `CODE/be/app/models/task_timesheet.py`
- `CODE/be/app/models/project_holiday.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/tugas/TaskList.tsx`
- `CODE/fe/src/app/pages/tugas/MyTasksPage.tsx`
- `CODE/fe/src/app/pages/tugas/TaskDetailModal.tsx`
- `CODE/fe/src/app/pages/tugas/TaskDetailPanel.tsx`
- `CODE/fe/src/app/pages/tugas/TaskFormFields.tsx`
- `CODE/fe/src/app/services/taskApi.ts`
- `CODE/fe/src/app/services/timesheetApi.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/<task_id>` | Update task |
| GET | `/api/v1/tasks/<task_id>/comments` | List comments |
| POST | `/api/v1/tasks/<task_id>/comments` | Create comment |
| GET | `/api/v1/tasks/<task_id>/checklist` | List checklist |
| POST | `/api/v1/tasks/<task_id>/checklist` | Create checklist item |
| PATCH | `/api/v1/tasks/<task_id>/checklist/<item_id>` | Update checklist item |
| DELETE | `/api/v1/tasks/<task_id>/checklist/<item_id>` | Delete checklist item |
| GET | `/api/v1/my-timesheets` | List timesheet milik user login |
| POST | `/api/v1/my-timesheets` | Tambah timesheet harian (pilih project dulu, task opsional) |
| PATCH | `/api/v1/my-timesheets/<timesheet_id>` | Update timesheet harian |
| DELETE | `/api/v1/my-timesheets/<timesheet_id>` | Hapus timesheet harian |

## Database / Models

| Table/Model | Usage |
|---|---|
| `tasks` / `Task` | Main task |
| `task_comments` / `TaskComment` | Comments |
| `task_checklist_items` / `TaskChecklistItem` | Checklist |
| `task_timesheets` / `TaskTimesheet` | Daily timesheet entries by user per task/date |
| `projects` / `Project` | Project relation |
| `phases` / `Phase` | Phase relation |
| `project_holidays` / `ProjectHoliday` | Mandays/date calculation |

## Validation Rules

- Create task requires title, priority, assignee, project_id, and phase_id.
- Phase must exist and belong to selected project.
- Progress percentage must be integer 0-100.
- Mandays must be integer >= 1 when provided.
- Comment content required and max 2000 chars.
- Checklist title required and max 240 chars.

## Error Handling

Not found uses 404 `ApiError`. Validation errors include field keys in `errors` where implemented.

## Tests

- `CODE/be/tests/test_tasks_api.py`
- `CODE/be/tests/test_timesheets_api.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/tasks.py`
- `CODE/be/app/services/task_service.py`
- `CODE/be/app/repositories/task_repository.py`
- `CODE/fe/src/app/pages/tugas/`
- `CODE/fe/src/app/services/taskApi.ts`

## Do Not Change

- Jangan ubah limited assignee/project-member permissions tanpa updating `test_tasks_api.py`.
- Jangan ubah task schema fields tanpa update frontend task types.

## Common Change Scenarios

- Menambah validasi progress.
- Menambah task field.
- Mengubah checklist/comment behavior.
- Menambah filter/search.

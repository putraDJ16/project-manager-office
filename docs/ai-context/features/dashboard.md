# Feature Context: Dashboard

## Purpose

Menampilkan ringkasan PMO dari project, task, dan issue.

## Business Flow

1. User authenticated membuka route `/`.
2. Frontend memanggil API project, task, dan issue.
3. Data digabung di page untuk statistik, daftar prioritas, dan ringkasan project.

## User Roles / Permissions

Route dashboard memakai module `dashboard` di `CODE/fe/src/app/routes.ts`. Backend data tetap mengikuti permission endpoint masing-masing.

## Main Backend Files

- `CODE/be/app/api/v1/projects.py`
- `CODE/be/app/api/v1/tasks.py`
- `CODE/be/app/api/v1/issues.py`
- `CODE/be/app/services/project_service.py`
- `CODE/be/app/services/task_service.py`
- `CODE/be/app/services/issue_service.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/HomeDashboard.tsx`
- `CODE/fe/src/app/routes.ts`
- `CODE/fe/src/app/services/projectApi.ts`
- `CODE/fe/src/app/services/taskApi.ts`
- `CODE/fe/src/app/services/issueService.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/projects` | Project summary data |
| GET | `/api/v1/tasks` | Task summary data |
| GET | `/api/v1/issues` | Issue/risk summary data |

## Database / Models

| Table/Model | Usage |
|---|---|
| `projects` / `Project` | Project status and metadata |
| `tasks` / `Task` | Task counts and priority |
| `issues` / `Issue` | Risk/issue counts |

## Validation Rules

- Needs verification: dashboard-specific validation is not present; it relies on API permission/validation.

## Error Handling

Frontend handles failed API calls inside page loading/error state. Backend errors follow each endpoint's feature behavior.

## Tests

- Needs verification: no dedicated dashboard tests found.

## Safe Modification Scope

- `CODE/fe/src/app/pages/HomeDashboard.tsx`
- Related service files only if API usage changes.

## Do Not Change

- Jangan ubah project/task/issue API contract hanya untuk dashboard tanpa explicit request.

## Common Change Scenarios

- Menambah metric dashboard.
- Menambah filter ringkasan.
- Mengubah cara agregasi frontend.

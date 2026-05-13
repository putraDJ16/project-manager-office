# Feature Context: Workload

## Purpose

Menampilkan heatmap/analisis beban kerja SDM dari employee, project, dan issue.

## Business Flow

1. User membuka route `/sdm/workload`.
2. Frontend memuat employees, projects, dan issues.
3. Page menghitung workload per employee berdasarkan assignment/project/issue.
4. User memfilter berdasarkan organisasi, posisi, issue, dan project count.

## User Roles / Permissions

Route memakai module `workload`. API data tetap mengikuti permission endpoint masing-masing, terutama `masterEmployees`, `masterProjects`, dan `projectIssues`.

## Main Backend Files

- `CODE/be/app/api/v1/employees.py`
- `CODE/be/app/api/v1/projects.py`
- `CODE/be/app/api/v1/issues.py`
- `CODE/be/app/services/employee_service.py`
- `CODE/be/app/services/project_service.py`
- `CODE/be/app/services/issue_service.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/sdm/WorkloadHeatmap.tsx`
- `CODE/fe/src/app/routes.ts`
- `CODE/fe/src/app/services/masterApi.ts`
- `CODE/fe/src/app/services/projectApi.ts`
- `CODE/fe/src/app/services/issueService.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/employees` | Employee list |
| GET | `/api/v1/projects` | Project list/detail data |
| GET | `/api/v1/issues` | Issue list |

## Database / Models

| Table/Model | Usage |
|---|---|
| `employees` / `Employee` | Employee base |
| `projects` / `Project` | Project assignments |
| `project_members` / `ProjectMember` | Membership |
| `issues` / `Issue` | Assigned/reported issues |

## Validation Rules

- Needs verification: workload calculation is frontend-only and has no backend validation.

## Error Handling

Frontend handles API load errors in the page. Backend errors are inherited from employee/project/issue features.

## Tests

- Needs verification: no dedicated workload tests found.

## Safe Modification Scope

- `CODE/fe/src/app/pages/sdm/WorkloadHeatmap.tsx`
- Related service files only when API usage changes.

## Do Not Change

- Jangan ubah employee/project/issue API contracts only for workload without updating related features.

## Common Change Scenarios

- Menambah workload metric.
- Menambah filter heatmap.
- Memindahkan calculation ke backend.

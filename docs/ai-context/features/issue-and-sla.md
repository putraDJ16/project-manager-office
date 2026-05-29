# Feature Context: Issue and SLA

## Purpose

Mengelola issue project, status issue, escalation, dan konfigurasi SLA per severity.

## Business Flow

1. User melihat issue list global atau by project.
2. User membuat issue untuk project.
3. User mengubah status issue atau melakukan escalation.
4. Frontend menghitung indikator SLA dari created time dan SLA config.
5. SLA config dapat dibaca/diubah oleh role yang punya permission.

## User Roles / Permissions

Menu global Isu & Bug memakai `issues`, sedangkan tab Isu & Bug di detail Proyek memakai `projectIssues`. Fallback legacy hanya dari `projectIssues` ke `issues` ada di `PERMISSION_FALLBACKS`, sehingga role global issue tetap dapat mengakses endpoint project issue lama. Akses Proyek (`masterProjects`) tidak otomatis membuka menu Isu & Bug. Project member/manager juga dapat akses issue project.
Khusus endpoint ubah status (`PATCH /issues/<issue_id>/status`), hanya pelapor atau assignee issue tersebut yang dapat melakukan perubahan.

## Main Backend Files

- `CODE/be/app/api/v1/issues.py`
- `CODE/be/app/api/v1/sla.py`
- `CODE/be/app/services/issue_service.py`
- `CODE/be/app/repositories/issue_repository.py`
- `CODE/be/app/models/issue.py`
- `CODE/be/app/models/sla_rule.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/isu/IssueList.tsx`
- `CODE/fe/src/app/pages/isu/IssueDetailPanel.tsx`
- `CODE/fe/src/app/pages/proyek/ProjectIssuePanel.tsx`
- `CODE/fe/src/app/services/issueService.ts`
- `CODE/fe/src/app/services/issueSla.ts`
- `CODE/fe/src/app/domain/issues.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/issues` | List issues |
| POST | `/api/v1/issues` | Create issue |
| PATCH | `/api/v1/issues/<issue_id>/status` | Update status |
| POST | `/api/v1/issues/<issue_id>/escalate` | Escalate issue |
| GET | `/api/v1/sla-config` | Get SLA rules |
| PUT | `/api/v1/sla-config` | Update SLA rules |

## Database / Models

| Table/Model | Usage |
|---|---|
| `issues` / `Issue` | Main issue |
| `sla_rules` / `SlaRule` | SLA config |
| `projects` / `Project` | Project relation |

## Validation Rules

- Create issue requires project, title, and reporter.
- Issue status must be valid according to service/model constants.
- Perubahan status issue ditolak (403) jika actor bukan pelapor atau assignee.
- SLA rules normalize severity, target hours, auto escalate, and escalation delay.
- Needs verification: exact SLA bounds should be checked in `issue_service.py` before changing.

## Error Handling

Missing issue uses 404. Permission failure uses 403. Validation uses `ApiError`.

## Tests

- `CODE/be/tests/test_issues_sla_api.py`
- `CODE/be/tests/test_sla_service.py`
- `CODE/be/tests/test_permissions_compatibility.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/issues.py`
- `CODE/be/app/api/v1/sla.py`
- `CODE/be/app/services/issue_service.py`
- `CODE/fe/src/app/pages/isu/`
- `CODE/fe/src/app/pages/proyek/ProjectIssuePanel.tsx`
- `CODE/fe/src/app/services/issueService.ts`
- `CODE/fe/src/app/services/issueSla.ts`

## Do Not Change

- Jangan ubah issue status/severity enum tanpa migration, frontend domain update, and tests.
- Jangan ubah SLA API response wrapper without updating issueService frontend.

## Common Change Scenarios

- Menambah status flow.
- Menambah severity.
- Menambah filter/search issue.
- Mengubah SLA indicator atau auto escalation behavior.

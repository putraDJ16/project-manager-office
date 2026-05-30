# Testing Context

## Framework

- Backend test framework: pytest.
- Backend test config: `CODE/be/pytest.ini`.
- Backend fixtures: `CODE/be/tests/conftest.py`.
- Backend app tests use `TestingConfig` with SQLite in-memory database.
- Frontend has no unit/e2e test script in `CODE/fe/package.json`; use `npm run build` for TypeScript/build verification.

## Commands

```bash
cd CODE/be
pytest
```

```bash
cd CODE/fe
npm run build
```

## Feature Test Map

| Feature | Test Files | What Is Covered | When To Update |
|---|---|---|---|
| Auth and Session | `CODE/be/tests/test_auth_api.py` | Login failure/success, forgot password with OTP, register with OTP, register options, duplicate email, me/refresh, onboarding completion, change password with OTP, my projects, assignment counter | Auth payload/session contract, password rules, register rules, OTP rules, onboarding/profile/project assignment logic |
| Project Management | `CODE/be/tests/test_tasks_api.py`, `CODE/be/tests/test_notifications_api.py`, `CODE/be/tests/test_permissions_compatibility.py` | Project/phase/task flows, project assignment notification, RASCI assignment, member permissions | Project fields, phases, members, RASCI, permissions, notification side effects |
| Task Management | `CODE/be/tests/test_tasks_api.py`, `CODE/be/tests/test_timesheets_api.py` | Task CRUD flow, assignee/project member permissions, checklist/comments, mandays skipping weekends/holidays, restricted comments, timesheet harian | Task validation, progress rules, assignee/member permission behavior, checklist/comment behavior, date/mandays logic, timesheet ownership/access rules |
| Issue and SLA | `CODE/be/tests/test_issues_sla_api.py`, `CODE/be/tests/test_sla_service.py`, `CODE/be/tests/test_permissions_compatibility.py` | Issue endpoint flow, SLA config, SLA normalization, legacy permission compatibility | Issue status/severity rules, SLA rule behavior, auto escalation assumptions, permissions |
| Master Data | `CODE/be/tests/test_master_api.py`, `CODE/be/tests/test_employee_service.py` | Roles, employees, reset password, organizations, units, positions, master mutation permission, duplicate employee email | Master validation, status changes, employee role/reference checks, password reset |
| Project Attachments | `CODE/be/tests/test_project_attachments_api.py`, `CODE/be/tests/test_permissions_compatibility.py` | Folder/file API flow and compatibility permissions | Folder tree validation, upload metadata, download/delete behavior, attachment permissions |
| Meeting Agenda | `CODE/be/tests/test_meetings_api.py` | Meeting CRUD, invalid time validation, RSVP, personal calendar isolation, JWT protection | Meeting payload contract, attendee/member validation, RSVP rules, personal calendar filtering |
| Meeting Notes (MoM) | `CODE/be/tests/test_meeting_notes_api.py`, `CODE/be/tests/test_meeting_files_api.py` | Note upsert, action item update/delete, meeting note summary filters, file upload/download/delete, unsupported file validation | Note/action item contract, summary search/filter, file validation/storage behavior |
| Notifications | `CODE/be/tests/test_notifications_api.py` | Notifications for project/issue assignment and RASCI member flows | Any flow creating or reading notifications |
| Audit Trail | `CODE/be/tests/test_audit_trails_api.py` | Authenticated activity capture and sensitive payload masking | Audit hook, masking behavior, audit query API |
| Dashboard | Needs verification | No dedicated backend or frontend test found | Add tests if dashboard gets business-specific aggregation logic |
| Workload | Needs verification | No dedicated backend or frontend test found | Add tests if workload calculations move into reusable logic or backend |

## Test Naming Pattern

- Backend tests use `test_<feature>_<behavior>` functions.
- Files are named `test_<feature>_api.py` or `test_<feature>_service.py`.

## Required Test Updates

- Update or add API tests when adding an endpoint, changing response shape, changing permission rules, or changing validation.
- Add service tests when business rules change without an API-level behavior difference.
- Add regression tests for bug fixes that can be reproduced through service/API behavior.
- Run the narrow test file first, then broader backend tests if shared permissions/models/services changed.

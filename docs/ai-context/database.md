# Database And Model Map

Primary ORM models are in `CODE/be/app/models/`. Alembic migrations are in `CODE/be/migrations/versions/`.

| Table/Model | Purpose | Important Fields | Related Feature | Related Files |
|---|---|---|---|---|
| `users` / `User` | Login identity and session subject. | `id`, `email`, `password_hash`, `display_name`, `role_id`, `employee_id`, `is_active` | Auth and Session, Notifications, Audit Trail | `CODE/be/app/models/user.py`, `CODE/be/app/services/auth_service.py` |
| `roles` / `Role` | Permission roles. | `id`, `name`, `description`, `status`, `permissions` JSON | Auth and Session, Master Data | `CODE/be/app/models/role.py`, `CODE/be/app/utils/permissions.py`, `CODE/be/app/services/role_service.py` |
| `employees` / `Employee` | Master employee record and optional user link target. | `id`, `nip`, `name`, `email`, `organization`, `unit_organization`, `position`, `role_id`, `status` | Master Data, Project Management, Workload | `CODE/be/app/models/employee.py`, `CODE/be/app/services/employee_service.py` |
| `organizations` / `Organization` | Master organization reference. | `id`, `name`, `status` | Master Data, Auth registration options | `CODE/be/app/models/organization.py`, `CODE/be/app/services/organization_service.py` |
| `organization_units` / `OrganizationUnit` | Master organization unit reference. | `id`, `name`, `status` | Master Data, Auth registration options | `CODE/be/app/models/organization_unit.py`, `CODE/be/app/services/organization_unit_service.py` |
| `positions` / `Position` | Master position reference. | `id`, `name`, `status` | Master Data, Auth registration options | `CODE/be/app/models/position.py`, `CODE/be/app/services/position_service.py` |
| `projects` / `Project` | Main project entity. | `id`, `name`, `status`, `description`, `priority`, `manager_id`, `rasci`, `start_date`, `end_date` | Project Management, Dashboard, Task, Issue, Attachment | `CODE/be/app/models/project.py`, `CODE/be/app/services/project_service.py` |
| `phases` / `Phase` | Project phases. | `id`, `project_id`, `name`, `order_index` | Project Management, Task Management | `CODE/be/app/models/phase.py`, `CODE/be/app/services/project_service.py` |
| `project_members` / `ProjectMember` | Membership relation between projects and employees. | `project_id`, `employee_id`, `joined_at` | Project Management, Permissions, Notifications, Workload | `CODE/be/app/models/project_member.py`, `CODE/be/app/services/project_service.py` |
| `project_holidays` / `ProjectHoliday` | Project-specific holidays used by task mandays/date calculation. | `id`, `project_id`, `holiday_date`, `name`; unique `project_id + holiday_date` | Project Management, Task Management | `CODE/be/app/models/project_holiday.py`, `CODE/be/app/services/project_service.py`, `CODE/be/app/services/task_service.py` |
| `tasks` / `Task` | Project task. | `id`, `title`, `priority`, `assignee`, `project_id`, `phase_id`, `created_by`, `phase_updated_at`, `progress_percentage`, `mandays`, `start_date`, `end_date` | Task Management, Dashboard, Auth assignment counter | `CODE/be/app/models/task.py`, `CODE/be/app/services/task_service.py` |
| `task_comments` / `TaskComment` | Comments on tasks. | `id`, `task_id`, `author_name`, `content` | Task Management | `CODE/be/app/models/task_comment.py`, `CODE/be/app/services/task_service.py` |
| `task_checklist_items` / `TaskChecklistItem` | Checklist items on tasks. | `id`, `task_id`, `title`, `is_done`, `order_index`, `created_by` | Task Management | `CODE/be/app/models/task_checklist_item.py`, `CODE/be/app/services/task_service.py` |
| `issues` / `Issue` | Project issue/bug/risk item. | `id`, `project_id`, `title`, `severity`, `status`, `reporter`, `assignee`, `description`, `module`, `environment`, `reproduction_steps`, `actual_result`, `expected_result`, `attachments` | Issue and SLA, Dashboard, Workload | `CODE/be/app/models/issue.py`, `CODE/be/app/services/issue_service.py` |
| `sla_rules` / `SlaRule` | SLA target and escalation config per issue severity. | `id`, `severity`, `target_hours`, `auto_escalate`, `escalation_delay_minutes` | Issue and SLA | `CODE/be/app/models/sla_rule.py`, `CODE/be/app/services/issue_service.py` |
| `project_attachment_folders` / `ProjectAttachmentFolder` | Folder tree for project attachments. | `id`, `project_id`, `name`, `parent_id` | Project Attachments | `CODE/be/app/models/project_attachment_folder.py`, `CODE/be/app/services/project_attachment_service.py` |
| `project_attachment_files` / `ProjectAttachmentFile` | Uploaded project file metadata. | `id`, `project_id`, `folder_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `description`, `uploaded_by` | Project Attachments | `CODE/be/app/models/project_attachment_file.py`, `CODE/be/app/services/project_attachment_service.py` |
| `project_meetings` / `ProjectMeeting` | Meeting schedule inside a project. | `id`, `project_id`, `title`, `description`, `location`, `meeting_type`, `meeting_url`, `start_datetime`, `end_datetime`, `status`, `created_by` | Meeting Agenda, Personal Calendar | `CODE/be/app/models/project_meeting.py`, `CODE/be/app/services/meeting_service.py` |
| `project_meeting_attendees` / `ProjectMeetingAttendee` | Meeting attendee RSVP relation. | `meeting_id`, `employee_id`, `rsvp_status`, `attended`; composite PK `meeting_id + employee_id` | Meeting Agenda, Personal Calendar | `CODE/be/app/models/project_meeting.py`, `CODE/be/app/services/meeting_service.py` |
| `project_meeting_notes` / `ProjectMeetingNote` | One meeting note/MoM record per meeting. | `id`, `meeting_id`, `summary`, `notes`, `decisions`, `created_by`, `last_edited_by`; unique `meeting_id` | Meeting Notes (MoM) | `CODE/be/app/models/project_meeting_note.py`, `CODE/be/app/services/meeting_note_service.py` |
| `project_meeting_action_items` / `ProjectMeetingActionItem` | Queryable action items attached to meeting notes. | `id`, `meeting_note_id`, `description`, `assignee_employee_id`, `due_date`, `is_done`, `order_index` | Meeting Notes (MoM) | `CODE/be/app/models/project_meeting_note.py`, `CODE/be/app/services/meeting_note_service.py` |
| `project_meeting_files` / `ProjectMeetingFile` | Supporting documents uploaded to a meeting. | `id`, `meeting_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `description`, `uploaded_by` | Meeting Notes (MoM) | `CODE/be/app/models/project_meeting_file.py`, `CODE/be/app/services/meeting_file_service.py` |
| `notifications` / `Notification` | In-app notifications. | `id`, `user_id`, `title`, `message`, `entity_type`, `entity_id`, `target_url`, `is_read` | Notifications | `CODE/be/app/models/notification.py`, `CODE/be/app/services/notification_service.py` |
| `audit_trails` / `AuditTrail` | Request audit records. | `id`, `user_id`, `user_email`, `action`, `method`, `path`, `status_code`, `ip_address`, `user_agent`, `request_query`, `request_body`, `note` | Audit Trail | `CODE/be/app/models/audit_trail.py`, `CODE/be/app/services/audit_trail_service.py` |

## Enums And Status Fields

Defined in `CODE/be/app/models/constants.py`:

- `ROLE_STATUS`: `Active`, `Inactive`.
- `EMPLOYEE_STATUS`: `Active`, `Inactive`.
- `PROJECT_STATUS`: `Planning`, `Active`, `On Hold`, `Completed`.
- `PROJECT_PRIORITY`: `Low`, `Medium`, `High`, `Critical`.
- `TASK_PRIORITY`: `Low`, `Medium`, `High`, `Critical`.
- `ISSUE_STATUS`: `Open`, `Investigating`, `In Progress`, `Escalated`, `Resolved`.
- `ISSUE_SEVERITY`: `Blocker`, `Critical`, `Major`, `Minor`, `Trivial`.

## Important Constraints

- `employees.nip` and `employees.email` are unique.
- `roles.name` is unique.
- `organizations.name`, `organization_units.name`, and `positions.name` are unique.
- `project_holidays` has unique constraint on `project_id + holiday_date`.
- `project_members` uses composite primary key `project_id + employee_id`.
- Attachment folders cascade on project deletion and support self-parenting relationships; service prevents invalid parent/self-descendant moves.
- File storage path depends on `ATTACHMENT_STORAGE_DIR`; runtime storage behavior needs environment verification outside code review.
- Meeting files reuse `ATTACHMENT_STORAGE_DIR` with the project storage directory pattern from project attachments.

## Migration Files

Current migration files include:

- `CODE/be/migrations/versions/2fb0f999e545_init_schema.py`
- `CODE/be/migrations/versions/7662423bafaf_init_schema.py`
- `CODE/be/migrations/versions/8f12f1cce9aa_add_task_audit_fields.py`
- `CODE/be/migrations/versions/a1b2c3d4e5f6_add_project_fields_and_members.py`
- `CODE/be/migrations/versions/a9b8c7d6e5f4_add_task_progress_percentage.py`
- `CODE/be/migrations/versions/b3c4d5e6f7a8_add_task_dates.py`
- `CODE/be/migrations/versions/c1d2e3f4a5b6_add_task_comments_table.py`
- `CODE/be/migrations/versions/c4e5f6a7b8c9_add_master_reference_tables.py`
- `CODE/be/migrations/versions/d2e3f4a5b6c7_add_notifications_table.py`
- `CODE/be/migrations/versions/d9c6c2f07d52_set_default_created_by_on_tasks.py`
- `CODE/be/migrations/versions/e1f2a3b4c5d6_add_project_holidays_and_task_mandays.py`
- `CODE/be/migrations/versions/e7f8a9b0c1d2_add_project_attachment_tables.py`
- `CODE/be/migrations/versions/f1a2b3c4d5e6_add_audit_trails_table.py`
- `CODE/be/migrations/versions/f2a3b4c5d6e7_add_project_rasci.py`
- `CODE/be/migrations/versions/f3a4b5c6d7e8_add_task_checklist_items.py`
- `CODE/be/migrations/versions/f4a5b6c7d8e9_add_project_meetings_tables.py`

from app.schemas.audit_trail_schema import AuditTrailSchema
from app.schemas.employee_schema import EmployeeSchema
from app.schemas.issue_schema import IssueSchema, SlaRuleSchema
from app.schemas.meeting_schema import (
    CalendarMeetingSchema,
    MeetingActionItemSchema,
    MeetingAttendeeSchema,
    MeetingFileSchema,
    MeetingNoteSchema,
    MeetingNoteSummarySchema,
    MeetingSchema,
)
from app.schemas.notification_schema import NotificationSchema
from app.schemas.organization_schema import OrganizationSchema
from app.schemas.organization_unit_schema import OrganizationUnitSchema
from app.schemas.position_schema import PositionSchema
from app.schemas.project_attachment_schema import ProjectAttachmentFileSchema, ProjectAttachmentFolderSchema
from app.schemas.project_schema import PhaseSchema, ProjectDetailSchema, ProjectHolidaySchema, ProjectMemberSchema, ProjectSchema
from app.schemas.role_schema import RoleSchema
from app.schemas.task_schema import TaskSchema
from app.schemas.task_checklist_schema import TaskChecklistItemSchema
from app.schemas.task_comment_schema import TaskCommentSchema

role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)
audit_trail_schema = AuditTrailSchema()
audit_trails_schema = AuditTrailSchema(many=True)
employee_schema = EmployeeSchema()
employees_schema = EmployeeSchema(many=True)
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_detail_schema = ProjectDetailSchema()
project_member_schema = ProjectMemberSchema()
project_members_schema = ProjectMemberSchema(many=True)
project_holiday_schema = ProjectHolidaySchema()
project_holidays_schema = ProjectHolidaySchema(many=True)
phase_schema = PhaseSchema()
phases_schema = PhaseSchema(many=True)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_checklist_item_schema = TaskChecklistItemSchema()
task_checklist_items_schema = TaskChecklistItemSchema(many=True)
task_comment_schema = TaskCommentSchema()
task_comments_schema = TaskCommentSchema(many=True)
issue_schema = IssueSchema()
issues_schema = IssueSchema(many=True)
sla_rule_schema = SlaRuleSchema()
sla_rules_schema = SlaRuleSchema(many=True)
notification_schema = NotificationSchema()
notifications_schema = NotificationSchema(many=True)
organization_schema = OrganizationSchema()
organizations_schema = OrganizationSchema(many=True)
organization_unit_schema = OrganizationUnitSchema()
organization_units_schema = OrganizationUnitSchema(many=True)
position_schema = PositionSchema()
positions_schema = PositionSchema(many=True)
project_attachment_folder_schema = ProjectAttachmentFolderSchema()
project_attachment_folders_schema = ProjectAttachmentFolderSchema(many=True)
project_attachment_file_schema = ProjectAttachmentFileSchema()
project_attachment_files_schema = ProjectAttachmentFileSchema(many=True)
meeting_schema = MeetingSchema()
meetings_schema = MeetingSchema(many=True)
meeting_attendee_schema = MeetingAttendeeSchema()
meeting_attendees_schema = MeetingAttendeeSchema(many=True)
meeting_note_schema = MeetingNoteSchema()
meeting_notes_schema = MeetingNoteSchema(many=True)
meeting_action_item_schema = MeetingActionItemSchema()
meeting_action_items_schema = MeetingActionItemSchema(many=True)
meeting_file_schema = MeetingFileSchema()
meeting_files_schema = MeetingFileSchema(many=True)
meeting_note_summary_schema = MeetingNoteSummarySchema()
meeting_note_summaries_schema = MeetingNoteSummarySchema(many=True)
calendar_meeting_schema = CalendarMeetingSchema()
calendar_meetings_schema = CalendarMeetingSchema(many=True)

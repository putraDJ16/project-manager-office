from app.schemas.audit_trail_schema import AuditTrailSchema
from app.schemas.employee_schema import EmployeeSchema
from app.schemas.issue_schema import IssueSchema, SlaRuleSchema
from app.schemas.organization_schema import OrganizationSchema
from app.schemas.organization_unit_schema import OrganizationUnitSchema
from app.schemas.position_schema import PositionSchema
from app.schemas.project_attachment_schema import ProjectAttachmentFileSchema, ProjectAttachmentFolderSchema
from app.schemas.project_schema import PhaseSchema, ProjectDetailSchema, ProjectMemberSchema, ProjectSchema
from app.schemas.role_schema import RoleSchema
from app.schemas.task_schema import TaskSchema
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
phase_schema = PhaseSchema()
phases_schema = PhaseSchema(many=True)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_comment_schema = TaskCommentSchema()
task_comments_schema = TaskCommentSchema(many=True)
issue_schema = IssueSchema()
issues_schema = IssueSchema(many=True)
sla_rule_schema = SlaRuleSchema()
sla_rules_schema = SlaRuleSchema(many=True)
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

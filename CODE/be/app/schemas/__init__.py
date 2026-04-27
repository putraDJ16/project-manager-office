from app.schemas.employee_schema import EmployeeSchema
from app.schemas.issue_schema import IssueSchema, SlaRuleSchema
from app.schemas.project_schema import PhaseSchema, ProjectSchema
from app.schemas.role_schema import RoleSchema
from app.schemas.task_schema import TaskSchema

role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)
employee_schema = EmployeeSchema()
employees_schema = EmployeeSchema(many=True)
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
phase_schema = PhaseSchema()
phases_schema = PhaseSchema(many=True)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
issue_schema = IssueSchema()
issues_schema = IssueSchema(many=True)
sla_rule_schema = SlaRuleSchema()
sla_rules_schema = SlaRuleSchema(many=True)

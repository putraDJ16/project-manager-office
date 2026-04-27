from marshmallow import Schema, fields


class IssueSchema(Schema):
    id = fields.String(required=True)
    project_id = fields.String(required=True)
    title = fields.String(required=True)
    severity = fields.String(required=True)
    status = fields.String(required=True)
    reporter = fields.String(required=True)
    assignee = fields.String(allow_none=True)
    description = fields.String(required=True)
    module = fields.String(required=True)
    environment = fields.String(required=True)
    reproduction_steps = fields.List(fields.String(), required=True)
    actual_result = fields.String(required=True)
    expected_result = fields.String(required=True)
    attachments = fields.List(fields.String(), required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class SlaRuleSchema(Schema):
    severity = fields.String(required=True)
    target_hours = fields.Integer(required=True)
    auto_escalate = fields.Boolean(required=True)
    escalation_delay_minutes = fields.Integer(required=True)

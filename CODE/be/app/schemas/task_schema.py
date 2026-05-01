from marshmallow import Schema, fields


class TaskSchema(Schema):
    id = fields.String(required=True)
    title = fields.String(required=True)
    priority = fields.String(required=True)
    assignee = fields.String(required=True)
    created_by = fields.String(required=True)
    project_id = fields.String(required=True)
    phase_id = fields.String(required=True)
    phase_updated_at = fields.DateTime(allow_none=True)
    progress_percentage = fields.Integer(required=True)
    mandays = fields.Integer(allow_none=True)
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

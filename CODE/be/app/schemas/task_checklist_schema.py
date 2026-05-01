from marshmallow import Schema, fields


class TaskChecklistItemSchema(Schema):
    id = fields.Integer(required=True)
    task_id = fields.String(required=True)
    title = fields.String(required=True)
    is_done = fields.Boolean(required=True)
    order_index = fields.Integer(required=True)
    created_by = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

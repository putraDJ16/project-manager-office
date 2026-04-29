from marshmallow import Schema, fields


class TaskCommentSchema(Schema):
    id = fields.Integer(required=True)
    task_id = fields.String(required=True)
    author_name = fields.String(required=True)
    content = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

from marshmallow import Schema, fields


class NotificationSchema(Schema):
    id = fields.Integer(required=True)
    user_id = fields.Integer(required=True)
    title = fields.String(required=True)
    message = fields.String(required=True)
    entity_type = fields.String(required=True)
    entity_id = fields.String(required=True)
    target_url = fields.String(allow_none=True)
    is_read = fields.Boolean(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

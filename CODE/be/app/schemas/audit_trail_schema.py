from marshmallow import Schema, fields


class AuditTrailSchema(Schema):
    id = fields.Integer(required=True)
    user_id = fields.Integer(allow_none=True)
    user_email = fields.String(allow_none=True)
    user_name = fields.Method("get_user_name", allow_none=True)
    action = fields.String(required=True)
    method = fields.String(required=True)
    path = fields.String(required=True)
    status_code = fields.Integer(required=True)
    ip_address = fields.String(allow_none=True)
    user_agent = fields.String(allow_none=True)
    request_query = fields.Raw(allow_none=True)
    request_body = fields.Raw(allow_none=True)
    note = fields.String(allow_none=True)
    created_at = fields.DateTime()

    def get_user_name(self, obj):
        if not obj.user:
            return None
        return obj.user.display_name

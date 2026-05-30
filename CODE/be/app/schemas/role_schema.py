from marshmallow import Schema, fields


class RoleSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    description = fields.String(required=True)
    status = fields.String(required=True)
    permissions = fields.Dict(required=True)
    is_default = fields.Boolean(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

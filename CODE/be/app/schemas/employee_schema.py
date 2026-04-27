from marshmallow import Schema, fields


class EmployeeSchema(Schema):
    id = fields.String(required=True)
    nip = fields.String(required=True)
    name = fields.String(required=True)
    email = fields.String(required=True)
    organization = fields.String(required=True)
    unit_organization = fields.String(required=True)
    position = fields.String(required=True)
    role_id = fields.String(required=True)
    status = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

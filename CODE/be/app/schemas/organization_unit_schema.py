from marshmallow import Schema, fields


class OrganizationUnitSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    status = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

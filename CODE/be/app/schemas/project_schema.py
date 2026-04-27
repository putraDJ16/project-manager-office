from marshmallow import Schema, fields


class ProjectSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    status = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class PhaseSchema(Schema):
    id = fields.String(required=True)
    project_id = fields.String(required=True)
    name = fields.String(required=True)
    order_index = fields.Integer(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

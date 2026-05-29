from marshmallow import Schema, fields


class SuccessEnvelopeSchema(Schema):
    data = fields.Raw(allow_none=True)
    message = fields.String(allow_none=True)


class ErrorEnvelopeSchema(Schema):
    message = fields.String(required=True)
    errors = fields.Dict(keys=fields.String(), values=fields.Raw(), allow_none=True)


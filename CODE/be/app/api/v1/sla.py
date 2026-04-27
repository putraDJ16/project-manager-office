from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import sla_rules_schema
from app.services import issue_service
from app.utils.http import success_response


@api_v1.get("/sla-config")
@jwt_required()
def get_sla_handler():
    rules = issue_service.get_sla_config()
    return success_response({"rules": sla_rules_schema.dump(rules)})


@api_v1.put("/sla-config")
@jwt_required()
def put_sla_handler():
    payload = request.get_json(silent=True) or {}
    rules = issue_service.update_sla_config(payload)
    return success_response({"rules": sla_rules_schema.dump(rules)}, message="SLA berhasil diperbarui.")

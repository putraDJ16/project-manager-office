from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import audit_trails_schema
from app.services import audit_trail_service
from app.utils.http import success_response


@api_v1.get("/audit-trails")
@jwt_required()
def list_audit_trails_handler():
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    user_id = request.args.get("user_id", type=int)
    method = request.args.get("method")
    path = request.args.get("path")
    status_code = request.args.get("status_code", type=int)

    result = audit_trail_service.list_audit_trails(
        page=page,
        per_page=per_page,
        user_id=user_id,
        method=method,
        path=path,
        status_code=status_code,
    )
    return success_response({"items": audit_trails_schema.dump(result["items"]), "meta": result["meta"]})

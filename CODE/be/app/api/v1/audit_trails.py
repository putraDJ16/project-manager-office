from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.services import audit_trail_service
from app.utils.http import error_response, paginated_response
from app.utils.pagination import parse_pagination_args


@api_v1.get("/audit-trails")
@jwt_required()
def list_audit_trails_handler():
    try:
        per_page, cursor_payload = parse_pagination_args(request)

        user_id = request.args.get("user_id", type=int)
        method = request.args.get("method")
        path = request.args.get("path")
        status_code = request.args.get("status_code", type=int)
        search = request.args.get("q") or request.args.get("search")

        result = audit_trail_service.list_audit_trails_paginated(
            per_page=per_page,
            cursor_payload=cursor_payload,
            request=request,
            user_id=user_id,
            method=method,
            path=path,
            status_code=status_code,
            search=search,
        )
        return paginated_response(result)

    except ValueError as e:
        return error_response(str(e), status_code=400)

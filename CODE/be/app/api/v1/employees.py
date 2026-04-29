from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import employee_schema, employees_schema
from app.services import employee_service
from app.utils.http import success_response
from app.utils.permissions import require_permission


@api_v1.get("/employees")
@jwt_required()
@require_permission("masterEmployees", "view")
def list_employees_handler():
    employees = employee_service.list_employees()
    return success_response(employees_schema.dump(employees))


@api_v1.post("/employees")
@jwt_required()
@require_permission("masterEmployees", "create")
def create_employee_handler():
    payload = request.get_json(silent=True) or {}
    employee, default_password = employee_service.create_employee(payload)
    return success_response(
        employee_schema.dump(employee),
        message=f"Pegawai berhasil ditambahkan. Password default: {default_password}",
        status_code=201,
    )


@api_v1.patch("/employees/<string:employee_id>")
@jwt_required()
@require_permission("masterEmployees", "edit")
def update_employee_handler(employee_id: str):
    payload = request.get_json(silent=True) or {}
    employee = employee_service.update_employee(employee_id, payload)
    return success_response(employee_schema.dump(employee), message="Pegawai berhasil diperbarui.")


@api_v1.patch("/employees/<string:employee_id>/status")
@jwt_required()
@require_permission("masterEmployees", "edit")
def update_employee_status_handler(employee_id: str):
    payload = request.get_json(silent=True) or {}
    employee = employee_service.update_employee_status(employee_id, payload.get("status", ""))
    return success_response(employee_schema.dump(employee), message="Status pegawai berhasil diperbarui.")


@api_v1.post("/employees/<string:employee_id>/reset-password")
@jwt_required()
@require_permission("masterEmployees", "edit")
def reset_employee_password_handler(employee_id: str):
    default_password = employee_service.reset_employee_password(employee_id)
    return success_response(
        message=f"Password pegawai berhasil direset. Password baru: {default_password}",
    )

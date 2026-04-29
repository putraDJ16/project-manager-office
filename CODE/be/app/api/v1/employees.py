from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import employee_schema, employees_schema
from app.services import employee_service
from app.utils.http import success_response


@api_v1.get("/employees")
@jwt_required()
def list_employees_handler():
    employees = employee_service.list_employees()
    return success_response(employees_schema.dump(employees))


@api_v1.post("/employees")
@jwt_required()
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
def update_employee_handler(employee_id: str):
    payload = request.get_json(silent=True) or {}
    employee = employee_service.update_employee(employee_id, payload)
    return success_response(employee_schema.dump(employee), message="Pegawai berhasil diperbarui.")


@api_v1.patch("/employees/<string:employee_id>/status")
@jwt_required()
def update_employee_status_handler(employee_id: str):
    payload = request.get_json(silent=True) or {}
    employee = employee_service.update_employee_status(employee_id, payload.get("status", ""))
    return success_response(employee_schema.dump(employee), message="Status pegawai berhasil diperbarui.")

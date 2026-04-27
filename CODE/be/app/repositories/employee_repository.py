from app.extensions import db
from app.models import Employee


class EmployeeRepository:
    @staticmethod
    def list_all():
        return Employee.query.order_by(Employee.name.asc()).all()

    @staticmethod
    def get_by_id(employee_id: str):
        return Employee.query.get(employee_id)

    @staticmethod
    def get_by_email(email: str):
        return Employee.query.filter(db.func.lower(Employee.email) == email.lower()).first()

    @staticmethod
    def get_by_nip(nip: str):
        return Employee.query.filter(db.func.lower(Employee.nip) == nip.lower()).first()

    @staticmethod
    def save(employee: Employee):
        db.session.add(employee)
        db.session.commit()
        return employee

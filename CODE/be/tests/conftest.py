import pytest

from app import create_app
from app.extensions import db
from app.services.seed_service import seed_database


@pytest.fixture()
def app():
    application = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite+pysqlite:///:memory:",
            "JWT_SECRET_KEY": "test-secret",
            "CORS_ORIGINS": ["http://localhost:5173"],
        }
    )
    with application.app_context():
        db.create_all()
        seed_database(force_reset=False)
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@zoho.local", "password": "Admin123!"},
    )
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

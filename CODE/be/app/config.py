import os
from datetime import timedelta


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5434/zoho_pm"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
    JSON_SORT_KEYS = False
    ATTACHMENT_STORAGE_DIR = os.getenv("ATTACHMENT_STORAGE_DIR", "")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(25 * 1024 * 1024)))
    DEFAULT_EMPLOYEE_PASSWORD = os.getenv("DEFAULT_EMPLOYEE_PASSWORD", "Welcome123!")
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    API_VERSION = os.getenv("API_VERSION", "1.0.0")
    API_PUBLIC_URL = os.getenv("API_PUBLIC_URL", FRONTEND_BASE_URL)
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    API_DOCS_VISIBILITY = os.getenv(
        "API_DOCS_VISIBILITY", "public" if FLASK_ENV == "development" else "jwt"
    ).lower()
    MAIL_ENABLED = os.getenv("MAIL_ENABLED", "false").lower() == "true"
    MAIL_HOST = os.getenv("MAIL_HOST", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "agenda@indocyber.id")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "PMO Indocyber")
    MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS", "agenda@indocyber.id")
    MAIL_TEST_RECIPIENT = os.getenv("MAIL_TEST_RECIPIENT", "")
    MAIL_INLINE_WORKER = os.getenv("MAIL_INLINE_WORKER", "false").lower() == "true"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("SESSION_TIMEOUT_MINUTES", "480"))
    )


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite+pysqlite:///:memory:"

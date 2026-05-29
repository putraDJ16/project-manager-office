from flask import Flask, request
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from app.api.v1 import register_api_routes
from app.config import Config
from app.docs.routes import register_docs_routes
from app.extensions import cors, db, jwt, migrate
from app.models import *  # noqa: F401,F403
from app.services import audit_trail_service
from app.services.seed_service import seed_database
from app.utils.exceptions import ApiError
from app.utils.http import error_response


def create_app(config_object: dict | None = None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_object:
        app.config.update(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=False)

    api_v1 = register_api_routes()
    app.register_blueprint(api_v1)
    register_docs_routes(app)

    _register_error_handlers(app)
    _register_hooks(app)
    _register_cli(app)

    return app


def _register_error_handlers(app: Flask):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return error_response(error.message, error.status_code, error.errors)

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return error_response(error.description, error.code or 400)

    @app.errorhandler(Exception)
    def handle_exception(error: Exception):
        return error_response(str(error), 500)

    @jwt.unauthorized_loader
    def on_unauthorized(reason: str):
        return error_response(f"Unauthorized: {reason}", 401)

    @jwt.invalid_token_loader
    def on_invalid_token(reason: str):
        return error_response(f"Invalid token: {reason}", 401)


def _register_cli(app: Flask):
    @app.cli.command("email-worker")
    def email_worker_command():
        """Run the email outbox dispatcher loop."""
        from app.services.email_dispatcher import run_forever

        run_forever()

    @app.cli.command("meeting-reminders")
    def meeting_reminders_command():
        """Placeholder for scheduled meeting reminder enqueueing."""
        print("Meeting reminder scheduler belum diaktifkan untuk v1 MVP.")

    @app.cli.command("seed")
    def seed_command():
        """Seed initial data."""
        seed_database(force_reset=False)
        print("Seed data berhasil dibuat.")

    @app.cli.command("reset-db")
    def reset_db_command():
        """Reset and seed database."""
        db.drop_all()
        db.create_all()
        seed_database(force_reset=False)
        print("Database berhasil di-reset dan di-seed.")


def _register_hooks(app: Flask):
    @app.after_request
    def capture_audit_trail(response):
        audit_trail_service.record_from_request(request, response)
        return response

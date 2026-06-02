from app.services.email_service import _target_url


def test_target_url_uses_cors_origin_when_frontend_base_url_is_empty(app):
    app.config["FRONTEND_BASE_URL"] = ""
    app.config["CORS_ORIGINS"] = ["https://pmo.example.com"]

    with app.app_context():
        assert _target_url("/proyek/1") == "https://pmo.example.com/proyek/1"


def test_target_url_keeps_absolute_url(app):
    app.config["FRONTEND_BASE_URL"] = "https://pmo.example.com"

    with app.app_context():
        assert _target_url("https://external.example.com/proyek/1") == "https://external.example.com/proyek/1"

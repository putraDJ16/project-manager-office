from __future__ import annotations

from datetime import datetime, timezone

from flask import Flask, abort, current_app, jsonify, render_template_string
from flask_jwt_extended import verify_jwt_in_request

from app.docs.builder import build_openapi_spec

_cached_spec: dict | None = None


def register_docs_routes(app: Flask):
    @app.get("/api/v1/openapi.json")
    def openapi_json_handler():
        _guard_docs_visibility()
        return jsonify(get_openapi_spec(current_app))

    @app.get("/api/docs")
    def swagger_ui_handler():
        _guard_docs_visibility()
        environment = current_app.config.get("FLASK_ENV", "development")
        generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        return render_template_string(
            SWAGGER_TEMPLATE,
            environment=environment,
            generated_at=generated_at,
        )


def get_openapi_spec(app: Flask) -> dict:
    global _cached_spec
    if _cached_spec is None or app.config.get("TESTING"):
        _cached_spec = build_openapi_spec(app)
    return _cached_spec


def _guard_docs_visibility():
    visibility = current_app.config.get("API_DOCS_VISIBILITY", "public")
    if visibility == "disabled":
        abort(404)
    if visibility == "jwt":
        verify_jwt_in_request()


SWAGGER_TEMPLATE = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>PMO Indocyber API Docs</title>
    <link rel="stylesheet" href="/static/swagger-ui/swagger-ui.css">
  </head>
  <body>
    <div class="docs-banner">
      Lingkungan: {{ environment }}. Spec di-generate otomatis dari kode pada {{ generated_at }}.
    </div>
    <div id="swagger-ui"></div>
    <script src="/static/swagger-ui/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/v1/openapi.json",
        dom_id: "#swagger-ui",
        presets: SwaggerUIBundle.presets.apis,
        layout: "BaseLayout",
        persistAuthorization: true
      });
    </script>
  </body>
</html>
"""


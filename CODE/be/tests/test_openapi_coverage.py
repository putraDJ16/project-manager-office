HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}


def _openapi_path(rule: str) -> str:
    import re

    return re.sub(r"<(?:[^:<>]+:)?([^<>]+)>", r"{\1}", rule.removeprefix("/api/v1"))


def test_openapi_covers_all_api_v1_routes(app):
    from app.docs.routes import get_openapi_spec

    expected = set()
    for rule in app.url_map.iter_rules():
        if not rule.rule.startswith("/api/v1/") or rule.rule == "/api/v1/openapi.json":
            continue
        for method in rule.methods & HTTP_METHODS:
            expected.add((method.lower(), _openapi_path(rule.rule)))

    spec = get_openapi_spec(app)
    actual = {
        (method, path)
        for path, operations in spec["paths"].items()
        for method in operations.keys()
    }

    assert actual == expected


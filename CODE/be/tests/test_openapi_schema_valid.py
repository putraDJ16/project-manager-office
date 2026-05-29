def test_openapi_operations_have_required_response_metadata(app):
    from app.docs.routes import get_openapi_spec

    spec = get_openapi_spec(app)

    assert spec["components"]["securitySchemes"]["bearerAuth"]["scheme"] == "bearer"
    assert "SuccessEnvelope" in spec["components"]["schemas"]
    assert "ErrorEnvelope" in spec["components"]["schemas"]

    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            responses = operation.get("responses", {})
            assert any(status in responses for status in ("200", "201")), f"{method.upper()} {path}"
            assert "400" in responses, f"{method.upper()} {path}"
            if operation.get("security"):
                assert "401" in responses, f"{method.upper()} {path}"


def test_openapi_spec_valid_when_validator_available(app):
    from app.docs.routes import get_openapi_spec

    spec = get_openapi_spec(app)
    try:
        from openapi_spec_validator import validate
    except ImportError:
        return

    validate(spec)


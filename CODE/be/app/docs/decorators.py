from functools import wraps


def apidoc(
    *,
    tag: str | None = None,
    summary: str | None = None,
    description: str | None = None,
    permissions: list[str] | None = None,
    query_params: list[dict] | None = None,
    body=None,
    responses: dict | None = None,
    examples: dict | None = None,
    hidden: bool = False,
):
    """Attach OpenAPI metadata to a Flask view without changing behavior."""

    def decorator(handler):
        handler._apidoc = {
            "tag": tag,
            "summary": summary,
            "description": description,
            "permissions": permissions or [],
            "query_params": query_params or [],
            "body": body,
            "responses": responses or {},
            "examples": examples or {},
            "hidden": hidden,
        }

        @wraps(handler)
        def wrapper(*args, **kwargs):
            return handler(*args, **kwargs)

        wrapper._apidoc = handler._apidoc
        return wrapper

    return decorator


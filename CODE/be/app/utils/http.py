from flask import jsonify


def success_response(data=None, message: str | None = None, status_code: int = 200):
    payload = {"data": data}
    if message:
        payload["message"] = message
    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400, errors: dict | None = None):
    payload = {"message": message}
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code


def paginated_response(result: dict, message: str | None = None, status_code: int = 200):
    """
    Return a paginated JSON response.
    
    Args:
        result: Dict with 'items', 'meta', and 'links' from pagination.paginate()
        message: Optional message
        status_code: HTTP status code
        
    Returns:
        Flask JSON response with paginated data structure
    """
    payload = {
        "data": {
            "items": result["items"],
            "meta": result["meta"],
            "links": result["links"]
        }
    }
    if message:
        payload["message"] = message
    return jsonify(payload), status_code

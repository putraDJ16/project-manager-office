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

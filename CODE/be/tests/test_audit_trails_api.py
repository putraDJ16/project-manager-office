def test_audit_trail_records_authenticated_activity(client, auth_headers):
    projects_response = client.get("/api/v1/projects", headers=auth_headers)
    assert projects_response.status_code == 200

    audit_response = client.get("/api/v1/audit-trails?per_page=50", headers=auth_headers)
    assert audit_response.status_code == 200

    payload = audit_response.get_json()["data"]
    assert payload["meta"]["total"] >= 1
    assert any(
        item["path"] == "/api/v1/projects" and item["method"] == "GET" and item["status_code"] == 200
        for item in payload["items"]
    )


def test_audit_trail_masks_sensitive_payload(client, auth_headers):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@zoho.local", "password": "Admin123!"},
    )
    assert login_response.status_code == 200

    audit_response = client.get("/api/v1/audit-trails?per_page=100", headers=auth_headers)
    assert audit_response.status_code == 200

    items = audit_response.get_json()["data"]["items"]
    login_items = [item for item in items if item["path"] == "/api/v1/auth/login" and item["method"] == "POST"]
    assert login_items
    latest_login = login_items[0]
    assert latest_login["request_body"]["password"] == "***REDACTED***"


def test_audit_trail_supports_cursor_navigation(client, auth_headers):
    for _ in range(4):
        projects_response = client.get("/api/v1/projects", headers=auth_headers)
        assert projects_response.status_code == 200

    first_response = client.get("/api/v1/audit-trails?per_page=2", headers=auth_headers)
    assert first_response.status_code == 200
    first_payload = first_response.get_json()["data"]

    assert len(first_payload["items"]) == 2
    assert first_payload["meta"]["has_next"] is True
    assert first_payload["links"]["next"] is not None
    assert first_payload["links"]["prev"] is None

    second_response = client.get(first_payload["links"]["next"], headers=auth_headers)
    assert second_response.status_code == 200
    second_payload = second_response.get_json()["data"]

    first_ids = {item["id"] for item in first_payload["items"]}
    second_ids = {item["id"] for item in second_payload["items"]}

    assert first_ids.isdisjoint(second_ids)
    assert second_payload["meta"]["has_prev"] is True
    assert second_payload["links"]["prev"] is not None


def test_audit_trail_rejects_invalid_cursor(client, auth_headers):
    response = client.get("/api/v1/audit-trails?cursor=not-a-real-cursor", headers=auth_headers)

    assert response.status_code == 400
    assert response.get_json()["message"] == "Cursor tidak valid."

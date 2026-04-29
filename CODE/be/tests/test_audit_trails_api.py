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

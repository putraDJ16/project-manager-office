def test_swagger_ui_served(client):
    response = client.get("/api/docs")

    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert b"swagger-ui" in response.data
    assert b"Lingkungan:" in response.data


def test_openapi_json_served(client):
    response = client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert response.content_type.startswith("application/json")
    payload = response.get_json()
    assert payload["openapi"] == "3.0.3"
    assert payload["info"]["title"] == "PMO Indocyber API"
    assert "paths" in payload


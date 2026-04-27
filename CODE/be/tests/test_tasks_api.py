def test_projects_phases_tasks_flow(client, auth_headers):
    projects = client.get("/api/v1/projects", headers=auth_headers)
    assert projects.status_code == 200
    assert len(projects.get_json()["data"]) >= 1

    created_project = client.post(
        "/api/v1/projects", headers=auth_headers, json={"name": "Project API Test", "status": "Planning"}
    )
    assert created_project.status_code == 201
    project_id = created_project.get_json()["data"]["id"]

    phases = client.get(f"/api/v1/projects/{project_id}/phases", headers=auth_headers)
    assert phases.status_code == 200
    assert len(phases.get_json()["data"]) == 1
    phase_id = phases.get_json()["data"][0]["id"]

    created_task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Task dari API",
            "priority": "Medium",
            "assignee": "u1",
            "project_id": project_id,
            "phase_id": phase_id,
        },
    )
    assert created_task.status_code == 201
    created_task_data = created_task.get_json()["data"]
    assert created_task_data["created_by"] == "Administrator"
    assert created_task_data["phase_updated_at"] is None
    task_id = created_task.get_json()["data"]["id"]

    listed = client.get(f"/api/v1/tasks?project_id={project_id}", headers=auth_headers)
    assert listed.status_code == 200
    assert any(task["id"] == task_id for task in listed.get_json()["data"])

    created_phase = client.post(
        f"/api/v1/projects/{project_id}/phases",
        headers=auth_headers,
        json={"name": "Fase 2 API Test"},
    )
    assert created_phase.status_code == 201
    next_phase_id = created_phase.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/tasks/{task_id}",
        headers=auth_headers,
        json={"title": "Task Updated", "priority": "High", "phase_id": next_phase_id},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["title"] == "Task Updated"
    assert updated.get_json()["data"]["phase_id"] == next_phase_id
    assert updated.get_json()["data"]["phase_updated_at"] is not None

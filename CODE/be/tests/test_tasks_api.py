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
            "progress_percentage": 35,
        },
    )
    assert created_task.status_code == 201
    created_task_data = created_task.get_json()["data"]
    assert created_task_data["created_by"] == "Administrator"
    assert created_task_data["phase_updated_at"] is None
    assert created_task_data["progress_percentage"] == 35
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
        json={"title": "Task Updated", "priority": "High", "phase_id": next_phase_id, "progress_percentage": 80},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["title"] == "Task Updated"
    assert updated.get_json()["data"]["phase_id"] == next_phase_id
    assert updated.get_json()["data"]["phase_updated_at"] is not None
    assert updated.get_json()["data"]["progress_percentage"] == 80

    listed_comments = client.get(f"/api/v1/tasks/{task_id}/comments", headers=auth_headers)
    assert listed_comments.status_code == 200
    assert listed_comments.get_json()["data"] == []

    created_comment = client.post(
        f"/api/v1/tasks/{task_id}/comments",
        headers=auth_headers,
        json={"content": "Komentar pertama untuk task ini."},
    )
    assert created_comment.status_code == 201
    created_comment_data = created_comment.get_json()["data"]
    assert created_comment_data["task_id"] == task_id
    assert created_comment_data["author_name"] == "Administrator"
    assert created_comment_data["content"] == "Komentar pertama untuk task ini."

    listed_comments_after_create = client.get(f"/api/v1/tasks/{task_id}/comments", headers=auth_headers)
    assert listed_comments_after_create.status_code == 200
    listed_comment_rows = listed_comments_after_create.get_json()["data"]
    assert len(listed_comment_rows) == 1
    assert listed_comment_rows[0]["content"] == "Komentar pertama untuk task ini."

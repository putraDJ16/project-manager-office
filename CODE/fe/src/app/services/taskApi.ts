import { apiRequest } from "./apiClient";

export type ApiProject = {
  id: string;
  name: string;
  status: string;
};

export type ApiPhase = {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
};

export type ApiTask = {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  created_by: string;
  project_id: string;
  phase_id: string;
  created_at: string;
  updated_at: string;
  phase_updated_at: string | null;
  start_date: string | null;
  end_date: string | null;
};

type ApiMutationResult<T> = {
  data: T;
  message?: string;
};

let projectsInFlight: Promise<ApiProject[]> | null = null;

export async function fetchProjects() {
  if (projectsInFlight) return projectsInFlight;

  projectsInFlight = apiRequest<ApiProject[]>("/projects", { method: "GET" })
    .then((result) => result.data)
    .finally(() => {
      projectsInFlight = null;
    });

  return projectsInFlight;
}

export async function createProject(payload: { name: string; status: string }): Promise<ApiMutationResult<ApiProject>> {
  const result = await apiRequest<ApiProject>("/projects", { method: "POST", body: payload });
  return { data: result.data, message: result.message };
}

export async function fetchPhases(projectId: string) {
  const result = await apiRequest<ApiPhase[]>(`/projects/${projectId}/phases`, { method: "GET" });
  return result.data;
}

export async function createPhase(projectId: string, payload: { name: string }): Promise<ApiMutationResult<ApiPhase>> {
  const result = await apiRequest<ApiPhase>(`/projects/${projectId}/phases`, {
    method: "POST",
    body: payload
  });
  return { data: result.data, message: result.message };
}

export async function fetchTasks(projectId: string, searchQuery: string) {
  const search = searchQuery.trim();
  const query = new URLSearchParams({ project_id: projectId });
  if (search) query.set("search", search);
  const result = await apiRequest<ApiTask[]>(`/tasks?${query.toString()}`, { method: "GET" });
  return result.data;
}

export async function createTask(payload: {
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  project_id: string;
  phase_id: string;
  start_date?: string | null;
  end_date?: string | null;
}): Promise<ApiMutationResult<ApiTask>> {
  const result = await apiRequest<ApiTask>("/tasks", { method: "POST", body: payload });
  return { data: result.data, message: result.message };
}

export async function updateTask(
  taskId: string,
  payload: Partial<{
    title: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    assignee: string;
    phase_id: string;
    start_date: string | null;
    end_date: string | null;
  }>
) {
  const result = await apiRequest<ApiTask>(`/tasks/${taskId}`, { method: "PATCH", body: payload });
  return result.data;
}

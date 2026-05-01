import { apiRequest } from "./apiClient";

export type ApiProject = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  priority: string | null;
  manager_id: string | null;
  manager_name: string | null;
  rasci: RasciAssignment | null;
  start_date: string | null;
  end_date: string | null;
  phase_count: number;
  task_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type RasciAssignment = {
  responsible: string[];
  accountable: string | null;
  support: string[];
  consulted: string[];
  informed: string[];
};

export type RasciRole = keyof RasciAssignment;

export type ApiProjectDetail = ApiProject & {
  members: ApiProjectMember[];
};

export type ApiProjectMember = {
  project_id: string;
  employee_id: string;
  employee_name: string | null;
  employee_nip: string | null;
  employee_position: string | null;
  employee_organization: string | null;
  joined_at: string;
};

export type ApiProjectHoliday = {
  id: number;
  project_id: string;
  holiday_date: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  manager_id?: string;
  rasci?: RasciAssignment;
  start_date?: string;
  end_date?: string;
  phases?: { name: string }[];
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

type MutationResult<T> = { data: T; message?: string };

export async function fetchProjects(): Promise<ApiProject[]> {
  const result = await apiRequest<ApiProject[]>("/projects", { method: "GET" });
  return result.data;
}

export async function getProject(projectId: string): Promise<ApiProjectDetail> {
  const result = await apiRequest<ApiProjectDetail>(`/projects/${projectId}`, { method: "GET" });
  return result.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<MutationResult<ApiProject>> {
  const result = await apiRequest<ApiProject>("/projects", { method: "POST", body: payload });
  return { data: result.data, message: result.message };
}

export async function updateProject(projectId: string, payload: UpdateProjectPayload): Promise<MutationResult<ApiProject>> {
  const result = await apiRequest<ApiProject>(`/projects/${projectId}`, { method: "PATCH", body: payload });
  return { data: result.data, message: result.message };
}

export async function fetchProjectMembers(projectId: string): Promise<ApiProjectMember[]> {
  const result = await apiRequest<ApiProjectMember[]>(`/projects/${projectId}/members`, { method: "GET" });
  return result.data;
}

export async function addProjectMember(
  projectId: string,
  employeeId: string,
  rasciRoles: RasciRole[] = []
): Promise<MutationResult<ApiProjectMember>> {
  const result = await apiRequest<ApiProjectMember>(`/projects/${projectId}/members`, {
    method: "POST",
    body: { employee_id: employeeId, rasci_roles: rasciRoles },
  });
  return { data: result.data, message: result.message };
}

export async function removeProjectMember(projectId: string, employeeId: string): Promise<void> {
  await apiRequest<null>(`/projects/${projectId}/members/${employeeId}`, { method: "DELETE" });
}

export async function fetchProjectHolidays(projectId: string): Promise<ApiProjectHoliday[]> {
  const result = await apiRequest<ApiProjectHoliday[]>(`/projects/${projectId}/holidays`, { method: "GET" });
  return result.data;
}

export async function createProjectHoliday(
  projectId: string,
  payload: { holiday_date: string; name: string }
): Promise<MutationResult<ApiProjectHoliday>> {
  const result = await apiRequest<ApiProjectHoliday>(`/projects/${projectId}/holidays`, {
    method: "POST",
    body: payload,
  });
  return { data: result.data, message: result.message };
}

export async function deleteProjectHoliday(projectId: string, holidayId: number): Promise<void> {
  await apiRequest<null>(`/projects/${projectId}/holidays/${holidayId}`, { method: "DELETE" });
}

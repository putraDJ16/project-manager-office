import { apiRequest } from "./apiClient";

export type ApiTimesheet = {
  id: number;
  task_id: string | null;
  user_id: number;
  work_date: string;
  hours_spent: number;
  notes: string | null;
  task_title: string | null;
  project_id: string | null;
  employee_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchMyTimesheets(params?: { start_date?: string; end_date?: string }) {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<ApiTimesheet[]>(`/my-timesheets${suffix}`, { method: "GET" });
  return result.data;
}

export async function createMyTimesheet(payload: {
  project_id: string;
  task_id?: string;
  work_date: string;
  hours_spent: number;
  notes?: string;
}) {
  const result = await apiRequest<ApiTimesheet>("/my-timesheets", {
    method: "POST",
    body: payload,
  });
  return result;
}

export async function updateMyTimesheet(
  timesheetId: number,
  payload: {
    project_id: string;
    task_id?: string;
    work_date: string;
    hours_spent: number;
    notes?: string;
  }
) {
  const result = await apiRequest<ApiTimesheet>(`/my-timesheets/${timesheetId}`, {
    method: "PATCH",
    body: payload,
  });
  return result;
}

export async function fetchProjectTimesheets(
  projectId: string,
  params?: { start_date?: string; end_date?: string }
) {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<ApiTimesheet[]>(`/projects/${projectId}/timesheets${suffix}`, { method: "GET" });
  return result.data;
}

export async function deleteMyTimesheet(timesheetId: number) {
  const result = await apiRequest<null>(`/my-timesheets/${timesheetId}`, {
    method: "DELETE",
  });
  return result;
}

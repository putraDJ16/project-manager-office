import { apiRequest } from "./apiClient";
import type { ModuleKey, PermissionSet } from "../data/masterData";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    initials: string;
    role_id?: string | null;
    role?: string | null;
    permissions?: Partial<Record<ModuleKey, PermissionSet>>;
  };
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  organization?: string;
  unit_organization?: string;
  position?: string;
};

type RegisterOption = {
  id: string;
  name: string;
};

export type RegisterOptionsResponse = {
  organizations: RegisterOption[];
  organization_units: RegisterOption[];
  positions: RegisterOption[];
};

type MeResponse = {
  id: number;
  name: string;
  email: string;
  initials: string;
  role_id?: string;
  role?: string | null;
  permissions?: Partial<Record<ModuleKey, PermissionSet>>;
  employee_id?: string | null;
  employee_name?: string | null;
  organization?: string | null;
  unit_organization?: string | null;
  position?: string | null;
};

export type MyProjectResponse = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  manager_name: string | null;
  member_count: number;
  task_count: number;
  start_date: string | null;
  end_date: string | null;
};

export type MyAssignmentCounterResponse = {
  active_tasks: number;
  active_issues: number;
  total_active: number;
};

export async function loginWithApi(email: string, password: string) {
  // Mock eksplisit untuk mode demo/testing tertentu.
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      user: { id: "USR-111", name: email.split("@")[0], email, initials: "U" }
    };
  }

  try {
    const result = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true
    });
    return result.data;
  } catch (error) {
    // Di local dev, jangan fallback agar kegagalan auth terlihat jelas.
    if (import.meta.env.DEV) {
      throw error;
    }

    // Fallback hanya aktif jika diizinkan eksplisit via env.
    if (import.meta.env.VITE_ALLOW_LOGIN_FALLBACK === "true") {
      console.warn("Login API failed. Fallback to mock session. Error:", error);
      return {
        access_token: "mock-token-fallback",
        refresh_token: "mock-refresh-fallback",
        user: { id: "USR-999", name: email.split("@")[0], email, initials: "FB" }
      };
    }

    throw error;
  }
}

export async function registerWithApi(payload: RegisterPayload) {
  const result = await apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true
  });
  return result.data;
}

export async function fetchRegisterOptions() {
  const result = await apiRequest<RegisterOptionsResponse>("/auth/register-options", {
    method: "GET",
    skipAuth: true
  });
  return result.data;
}

export async function getMe() {
  const result = await apiRequest<MeResponse>("/auth/me", { method: "GET" });
  return result.data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const result = await apiRequest<null>("/auth/change-password", {
    method: "POST",
    body: payload,
  });
  return result.message ?? "Password berhasil diubah.";
}

export async function fetchMyProjects() {
  const result = await apiRequest<MyProjectResponse[]>("/auth/my-projects", { method: "GET" });
  return result.data;
}

export async function fetchMyAssignmentCounter() {
  const result = await apiRequest<MyAssignmentCounterResponse>("/auth/my-assignment-counter", { method: "GET" });
  return result.data;
}

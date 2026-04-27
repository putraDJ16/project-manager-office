import { apiRequest } from "./apiClient";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    initials: string;
  };
};

type MeResponse = {
  name: string;
  email: string;
  initials: string;
  role_id?: string;
  role?: string | null;
  organization?: string | null;
  unit_organization?: string | null;
  position?: string | null;
};

export async function loginWithApi(email: string, password: string) {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true
  });
  return result.data;
}

export async function getMe() {
  const result = await apiRequest<MeResponse>("/auth/me", { method: "GET" });
  return result.data;
}

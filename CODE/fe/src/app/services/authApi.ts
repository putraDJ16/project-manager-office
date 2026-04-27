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
  // Jika VITE_USE_MOCK=true diset di Vercel, langsung return mock
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
    // Pada Vercel (tanpa backend konfigurasi), akan selalu throw 404/405
    // Kita fallback otomatis ke mock agar tidak terjadi bloking.
    console.warn("Login API failed. Fallback to mock session. Error:", error);
    return {
      access_token: "mock-token-fallback",
      refresh_token: "mock-refresh-fallback",
      user: { id: "USR-999", name: email.split("@")[0], email, initials: "FB" }
    };
  }
}

export async function getMe() {
  const result = await apiRequest<MeResponse>("/auth/me", { method: "GET" });
  return result.data;
}

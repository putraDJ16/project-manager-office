import { clearAuthSession, getAccessToken, getRefreshToken, updateAccessToken } from "../data/auth";

const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = importMetaEnv?.VITE_API_BASE_URL?.trim() || "/api/v1";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`
    }
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as ApiResponse<{ access_token: string }>;
  if (!payload?.data?.access_token) return null;

  updateAccessToken(payload.data.access_token);
  return payload.data.access_token;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, headers, skipAuth, ...rest } = options;

  const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;

  const makeRequest = async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
        ...(headers ?? {}),
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {})
      },
      body:
        body === undefined ? undefined : isFormDataBody ? (body as FormData) : JSON.stringify(body)
    });
    return response;
  };

  let response = await makeRequest(skipAuth ? null : getAccessToken());
  if (response.status === 401 && !skipAuth) {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      clearAuthSession();
      throw new Error("Sesi berakhir. Silakan login kembali.");
    }
    response = await makeRequest(refreshedToken);
  }

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & {
    message?: string;
    errors?: Record<string, string>;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Terjadi kesalahan saat mengakses API.");
  }

  return payload as ApiResponse<T>;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

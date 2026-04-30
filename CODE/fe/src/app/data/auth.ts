import type { ModuleKey, PermissionSet } from "./masterData";

export const AUTH_STORAGE_KEY = "pm-saas-auth-session";
const SESSION_TIMEOUT_MINUTES = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? "480");
export const SESSION_TIMEOUT_MS = Math.max(1, SESSION_TIMEOUT_MINUTES) * 60 * 1000;

export type AuthSession = {
  userId?: string | number;
  name: string;
  email: string;
  initials: string;
  roleId?: string | null;
  role?: string | null;
  permissions?: Partial<Record<ModuleKey, PermissionSet>>;
  loggedInAt: string;
  accessToken: string;
  refreshToken: string;
};

export function getSessionExpiresAt(session: Pick<AuthSession, "loggedInAt">) {
  const startedAt = new Date(session.loggedInAt).getTime();
  if (!Number.isFinite(startedAt)) return 0;
  return startedAt + SESSION_TIMEOUT_MS;
}

export function isSessionExpired(session: Pick<AuthSession, "loggedInAt">) {
  return Date.now() >= getSessionExpiresAt(session);
}

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "US";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function loadAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      !parsed?.name ||
      !parsed?.email ||
      !parsed?.initials ||
      !parsed?.loggedInAt ||
      !parsed?.accessToken ||
      !parsed?.refreshToken
    ) {
      return null;
    }
    const session = {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      initials: parsed.initials,
      roleId: parsed.roleId,
      role: parsed.role,
      permissions: parsed.permissions,
      loggedInAt: parsed.loggedInAt,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken
    };
    if (isSessionExpired(session)) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken() {
  return loadAuthSession()?.accessToken ?? null;
}

export function getRefreshToken() {
  return loadAuthSession()?.refreshToken ?? null;
}

export function updateAccessToken(nextAccessToken: string) {
  const current = loadAuthSession();
  if (!current) return;
  saveAuthSession({ ...current, accessToken: nextAccessToken });
}

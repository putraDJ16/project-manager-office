export const AUTH_STORAGE_KEY = "pm-saas-auth-session";

export type AuthSession = {
  userId?: string | number;
  name: string;
  email: string;
  initials: string;
  loggedInAt: string;
  accessToken: string;
  refreshToken: string;
};

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
    return {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      initials: parsed.initials,
      loggedInAt: parsed.loggedInAt,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken
    };
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

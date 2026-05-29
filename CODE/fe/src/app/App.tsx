import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { routes } from "./routes";
import { Routes, Route } from "react-router";
import { LoginPage } from "./pages/auth/LoginPage";
import { completeOnboarding, getMe } from "./services/authApi";
import { OnboardingTour } from "./components/onboarding/OnboardingTour";
import type { AppRoute } from "./routes";
import {
  clearAuthSession,
  getSessionExpiresAt,
  isSessionExpired,
  loadAuthSession,
  saveAuthSession,
  type AuthSession
} from "./data/auth";
import { hasPermission, normalizeSessionPermissions } from "./utils/permissions";
import { applyTheme, getStoredTheme, type ThemeMode } from "./utils/theme";

const AUTH_SESSION_REFRESH_EVENT = "auth-session-refresh";

function PermissionGate({ route, session }: { route: AppRoute; session: AuthSession }) {
  const routeModules = Array.isArray(route.module) ? route.module : route.module ? [route.module] : [];
  if (routeModules.length > 0 && !routeModules.some((module) => hasPermission(session, module, "view"))) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">Akses dibatasi</p>
          <p className="mt-2 text-sm text-amber-700">
            Role Anda belum memiliki permission untuk melihat halaman ini.
          </p>
        </div>
      </div>
    );
  }

  const Page = route.component;
  return <Page />;
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [isManualOnboardingOpen, setIsManualOnboardingOpen] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = loadAuthSession();
    return session ? normalizeSessionPermissions(session) : null;
  });

  const refreshAuthSessionFromApi = useCallback(async () => {
    const currentSession = loadAuthSession();
    if (!currentSession?.accessToken) return;

    try {
      const profile = await getMe();
      setAuthSession((current) => {
        const baseSession = current ?? currentSession;
        const refreshedSession = normalizeSessionPermissions({
          ...baseSession,
          userId: profile.id,
          name: profile.name,
          email: profile.email,
          initials: profile.initials,
          roleId: profile.role_id,
          role: profile.role,
          employeeId: profile.employee_id,
          employeeName: profile.employee_name,
          onboardingCompleted: profile.onboarding_completed,
          permissions: profile.permissions
        });
        saveAuthSession(refreshedSession);
        return refreshedSession;
      });
    } catch {
      if (loadAuthSession()) return;
      setAuthSession(null);
    }
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!authSession) return;

    if (isSessionExpired(authSession)) {
      clearAuthSession();
      setAuthSession(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      clearAuthSession();
      setAuthSession(null);
    }, Math.max(0, getSessionExpiresAt(authSession) - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [authSession]);

  useEffect(() => {
    const syncSession = () => {
      const session = loadAuthSession();
      setAuthSession(session ? normalizeSessionPermissions(session) : null);
      void refreshAuthSessionFromApi();
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    window.addEventListener(AUTH_SESSION_REFRESH_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener(AUTH_SESSION_REFRESH_EVENT, syncSession);
    };
  }, [refreshAuthSessionFromApi]);

  useEffect(() => {
    if (!authSession?.accessToken) return;

    let isMounted = true;
    refreshAuthSessionFromApi()
      .then(() => {
        if (!isMounted) return;
      });

    return () => {
      isMounted = false;
    };
  }, [authSession?.accessToken, refreshAuthSessionFromApi]);

  const handleToggleTheme = () => {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  };

  const handleLogin = (session: AuthSession) => {
    const normalizedSession = normalizeSessionPermissions(session);
    saveAuthSession(normalizedSession);
    setAuthSession(normalizedSession);
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
    setIsManualOnboardingOpen(false);
  };

  const handleCompleteOnboarding = async () => {
    if (authSession?.onboardingCompleted) {
      setIsManualOnboardingOpen(false);
      setOnboardingError(null);
      return;
    }

    setIsCompletingOnboarding(true);
    setOnboardingError(null);
    try {
      const result = await completeOnboarding();
      setAuthSession((current) => {
        if (!current) return current;
        const refreshedSession = normalizeSessionPermissions({
          ...current,
          userId: result.profile.id,
          name: result.profile.name,
          email: result.profile.email,
          initials: result.profile.initials,
          roleId: result.profile.role_id,
          role: result.profile.role,
          employeeId: result.profile.employee_id,
          employeeName: result.profile.employee_name,
          onboardingCompleted: result.profile.onboarding_completed,
          permissions: result.profile.permissions
        });
        saveAuthSession(refreshedSession);
        return refreshedSession;
      });
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : "Gagal menyelesaikan onboarding.");
    } finally {
      setIsCompletingOnboarding(false);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authSession ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={handleLogin} themeMode={themeMode} onToggleTheme={handleToggleTheme} />
            )
          }
        />

        <Route
          path="/"
          element={
            authSession ? (
              <AppShell
                session={authSession}
                onLogout={handleLogout}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
                onOpenOnboarding={() => {
                  setOnboardingError(null);
                  setIsManualOnboardingOpen(true);
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {routes.map((route, index) => (
            <Route 
              key={index} 
              index={route.index} 
              path={route.path} 
              element={authSession ? <PermissionGate route={route} session={authSession} /> : null} 
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to={authSession ? "/" : "/login"} replace />} />
      </Routes>
      {authSession && (!authSession.onboardingCompleted || isManualOnboardingOpen) && (
        <OnboardingTour
          userName={authSession.name}
          isCompleting={isCompletingOnboarding}
          error={onboardingError}
          onComplete={handleCompleteOnboarding}
        />
      )}
    </BrowserRouter>
  );
}

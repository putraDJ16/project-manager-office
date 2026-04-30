import { useEffect, useState } from "react";
import { BrowserRouter, Navigate } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { routes } from "./routes";
import { Routes, Route } from "react-router";
import { LoginPage } from "./pages/auth/LoginPage";
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

function PermissionGate({ route, session }: { route: AppRoute; session: AuthSession }) {
  if (route.module && !hasPermission(session, route.module, "view")) {
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
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = loadAuthSession();
    return session ? normalizeSessionPermissions(session) : null;
  });

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
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

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
    </BrowserRouter>
  );
}

import { useState } from "react";
import { BrowserRouter, Navigate } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { routes } from "./routes";
import { Routes, Route } from "react-router";
import { LoginPage } from "./pages/auth/LoginPage";
import type { AppRoute } from "./routes";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type AuthSession
} from "./data/auth";
import { hasPermission, normalizeSessionPermissions } from "./utils/permissions";

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
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = loadAuthSession();
    return session ? normalizeSessionPermissions(session) : null;
  });

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
          element={authSession ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route
          path="/"
          element={authSession ? <AppShell session={authSession} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
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

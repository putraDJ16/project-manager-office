import { useState } from "react";
import { BrowserRouter, Navigate } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { routes } from "./routes";
import { Routes, Route } from "react-router";
import { LoginPage } from "./pages/auth/LoginPage";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type AuthSession
} from "./data/auth";

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());

  const handleLogin = (session: AuthSession) => {
    saveAuthSession(session);
    setAuthSession(session);
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
              element={<route.component />} 
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to={authSession ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

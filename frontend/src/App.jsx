import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import HomePage from "./pages/HomePage";
import ViewPage from "./pages/ViewPage";
import DeletePage from "./pages/DeletePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "./utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function RequireAuth({ token, children }) {
  const location = useLocation();
  if (!token) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}

function AuthRedirect({ token, onAuthenticated }) {
  const location = useLocation();

  if (token) {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    const safeNext = next && next.startsWith("/") ? next : "/";
    return <Navigate to={safeNext} replace />;
  }

  return <AuthPage onAuthenticated={onAuthenticated} />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const initialAuth = useMemo(() => getStoredAuth(), []);
  const [token, setToken] = useState(initialAuth.token);
  const [user, setUser] = useState(initialAuth.user);

  const onAuthenticated = (payload) => {
    const nextAuth = {
      token: payload.token,
      user: payload.user
    };
    setToken(nextAuth.token);
    setUser(nextAuth.user);
    setStoredAuth(nextAuth);
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      clearStoredAuth();
      setToken("");
      setUser(null);
      navigate("/auth", { replace: true });
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  return (
    <div className="lv-app">
      <div className="lv-bg" aria-hidden="true">
        <span className="lv-orb lv-orb-1" />
        <span className="lv-orb lv-orb-2" />
        <span className="lv-orb lv-orb-3" />
        <span className="lv-grid" />
      </div>
      <div className="lv-content">
        {token && user?.email && (
          <div className="mb-4 flex items-center justify-end gap-3 lv-fade-in">
            <span className="lv-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="lv-button lv-button-ghost px-4 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Logout
            </button>
          </div>
        )}
        <Routes>
          <Route
            path="/auth"
            element={<AuthRedirect token={token} onAuthenticated={onAuthenticated} />}
          />
          <Route
            path="/"
            element={
              <RequireAuth token={token}>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/view/:uniqueId"
            element={
              <RequireAuth token={token}>
                <ViewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/delete/:uniqueId/:deleteToken"
            element={
              <RequireAuth token={token}>
                <DeletePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;

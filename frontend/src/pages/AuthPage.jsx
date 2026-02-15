import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AuthPage({ onAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    return next && next.startsWith("/") ? next : "/";
  }, [location.search]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "register" ? "register" : "login";
      const response = await axios.post(`${API_URL}/auth/${endpoint}`, {
        email,
        password,
      });
      onAuthenticated(response.data);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lv-shell space-y-10">
      <header className="text-center lv-fade-in">
        <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
          Account required
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold lv-gradient-text">
          LinkVault Login
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign in to create links and to open shared links.
        </p>
      </header>

      <div className="lv-card rounded-3xl p-6 md:p-8 space-y-6 lv-rise max-w-2xl mx-auto">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`lv-toggle rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${mode === "login" ? "active" : ""}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`lv-toggle rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${mode === "register" ? "active" : ""}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lv-input w-full rounded-xl px-4 py-3 text-base"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lv-input w-full rounded-xl px-4 py-3 text-base"
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
            />
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="lv-button lv-button-primary w-full py-3 text-sm text-slate-900"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create account" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;

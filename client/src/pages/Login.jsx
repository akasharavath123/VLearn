import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { safePost, setStoredAuth } from "../api";
import "../styles/Auth.css";

/* Mock login fallback */
const MOCK_USERS_KEY = "vlearn_mock_users";

function getMockUsers() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function mockLogin(email, password) {
  const user = getMockUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    return { ok: false, data: { message: "Incorrect email or password." } };
  }
  return {
    ok: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role || "student" },
      token: "mock-jwt-token-" + Date.now(),
    },
  };
}

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { ok, data } = await safePost("/api/auth/login", form);

    if (ok && data.user) {
      setStoredAuth(data.user, data.token);
      onLogin(data.user, data.token);
      navigate(data.user.role === "instructor" ? "/instructor" : "/dashboard");
    } else if (
      !ok &&
      (!data ||
        data.message === "Network connection failed" ||
        data.message?.includes("<!DOCTYPE") ||
        data.message?.includes("Cannot reach"))
    ) {
      // Offline fallback
      const mock = mockLogin(form.email, form.password);
      if (mock.ok) {
        setStoredAuth(mock.data.user, mock.data.token);
        onLogin(mock.data.user, mock.data.token);
        navigate(mock.data.user.role === "instructor" ? "/instructor" : "/dashboard");
      } else {
        setError(mock.data.message);
      }
    } else {
      setError(data?.message || "Invalid email or password.");
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <Navbar />

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-label">WELCOME BACK</span>
            <h1>Log in to VLearn</h1>
            <p>Continue your learning journey.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="signup-btn auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?{" "}
            <Link to="/signup">Create one for free</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;

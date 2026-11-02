import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { safePost, setStoredAuth } from "../api";
import "../styles/Auth.css";

/* Mock store fallback if backend is offline */
const MOCK_USERS_KEY = "vlearn_mock_users";

function getMockUsers() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMockUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function mockSignup(name, email, password, role) {
  const users = getMockUsers();
  if (users.find((u) => u.email === email)) {
    return { ok: false, data: { message: "An account with that email already exists." } };
  }
  const newUser = { id: "user_" + Date.now(), name, email, password, role };
  saveMockUsers([...users, newUser]);
  return {
    ok: true,
    data: {
      user: { id: newUser.id, name, email, role },
      token: "mock-jwt-token-" + Date.now(),
    },
  };
}

function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("student"); // 'student' or 'instructor'
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { ok, data } = await safePost("/api/auth/signup", {
      name: form.name,
      email: form.email,
      password: form.password,
      role: role,
    });

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
      // Fallback to local mock
      const mock = mockSignup(form.name, form.email, form.password, role);
      if (mock.ok) {
        setStoredAuth(mock.data.user, mock.data.token);
        onLogin(mock.data.user, mock.data.token);
        navigate(role === "instructor" ? "/instructor" : "/dashboard");
      } else {
        setError(mock.data.message);
      }
    } else {
      setError(data?.message || "Sign up failed. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <Navbar />

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-label">JOIN VLEARN</span>
            <h1>Create your account</h1>
            <p>Select your learning role to get started.</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-tab ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              <span className="role-icon">🎓</span>
              <div>
                <strong>Student</strong>
                <small>Watch classes, take quizzes & pay via RuPay</small>
              </div>
            </button>

            <button
              type="button"
              className={`role-tab ${role === "instructor" ? "active" : ""}`}
              onClick={() => setRole("instructor")}
            >
              <span className="role-icon">👨‍🏫</span>
              <div>
                <strong>Instructor</strong>
                <small>Upload courses, create quizzes & answer doubts</small>
              </div>
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={role === "instructor" ? "Prof. Akash Raj" : "Akash"}
                value={form.name}
                onChange={handleChange}
              />
            </div>

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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="signup-btn auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating account…"
                : `Register as ${role === "instructor" ? "Instructor" : "Student"}`}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Signup;

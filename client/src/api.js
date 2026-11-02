const API_URL = "http://localhost:5000";

// Helper to get token
export function getAuthToken() {
  try {
    return localStorage.getItem("vlearn_token") || "";
  } catch {
    return "";
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("vlearn_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(user, token) {
  try {
    if (user) {
      localStorage.setItem("vlearn_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("vlearn_user");
    }
    if (token) {
      localStorage.setItem("vlearn_token", token);
    } else {
      localStorage.removeItem("vlearn_token");
    }
  } catch (err) {
    console.error("Storage error:", err);
  }
}

/**
 * Generic API request wrapper with auth header
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = res.headers.get("content-type") || "";
    let data = {};
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { message: err.message || "Network connection failed" }
    };
  }
}

export async function safePost(path, body) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

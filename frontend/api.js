// frontend/js/api.js


export const API_BASE_URL = "http://localhost:3000";

// Token helper
export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}


export async function apiRequest(path, { method = "GET", body = null, auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}


export const api = {
  register: (payload) => apiRequest("/api/register", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/api/login", { method: "POST", body: payload }),
  chat: (payload) => apiRequest("/api/chat", { method: "POST", body: payload, auth: true }),
  quizGet: () => apiRequest("/api/quiz", { method: "GET", auth: true }),
  quizSubmit: (payload) => apiRequest("/api/quiz/submit", { method: "POST", body: payload, auth: true }),
  dashboard: () => apiRequest("/api/dashboard", { method: "GET", auth: true }),
  writingSubmit: (payload) => apiRequest("/api/writing/submit", { method: "POST", body: payload, auth: true }),
};

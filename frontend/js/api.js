export const API_URL = "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

export async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle query params for GET requests if username is needed
  let url = API_URL + endpoint;
  if (method === "GET" && auth) {
    const username = localStorage.getItem("username");
    if (username) {
      url += (url.includes("?") ? "&" : "?") + "username=" + encodeURIComponent(username);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: (method !== "GET" && body) ? JSON.stringify(body) : null,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// Global API object for app.js
export const API = {
  login: async (username) => {
    const data = await apiRequest("/login", "POST", { username });
    if (data.token) setToken(data.token);
    if (data.user?.username) localStorage.setItem("username", data.user.username);
    return data;
  },
  getProgress: () => apiRequest("/dashboard", "GET", null, true),
  sendMessage: (message, mode) => {
    const username = localStorage.getItem("username");
    return apiRequest("/chat", "POST", { username, message, mode }, true);
  },
  getQuiz: (type) => apiRequest(type ? `/quiz?type=${type}` : "/quiz", "GET", null, true),
  analyzeWriting: (text, type = 'Essay') => apiRequest("/writing/submit", "POST", {
    username: localStorage.getItem("username"),
    text,
    environment: type,
    tone: 'neutral'
  }, true),
  submitQuiz: (results) => apiRequest("/quiz/submit", "POST", {
    username: localStorage.getItem("username"),
    answers: results
  }, true),
};

// Expose to window for app.js (which is not a module)
window.API = API;

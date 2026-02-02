import { apiRequest, setToken } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("auth.js yüklendi");

  // Simple login button handler for the actual login page
  const loginBtn = document.getElementById("login-btn");
  const usernameInput = document.getElementById("username");

  if (loginBtn && usernameInput) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();

      if (!username) {
        alert("Please enter a username");
        return;
      }

      try {
        const data = await apiRequest("/login", "POST", { username });
        if (data?.token) setToken(data.token);
        if (data?.user?.username) localStorage.setItem("username", data.user.username);
        alert("Login successful ✅");
        window.location.href = "dashboard.html";
      } catch (err) {
        alert("Login failed: " + err.message);
        console.error("Login error:", err);
      }
    });

    // Allow Enter key to login
    usernameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        loginBtn.click();
      }
    });
  }

  // Legacy form handlers (if they exist)
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginEmail").value.trim();

    try {
      const data = await apiRequest("/login", "POST", { username });
      if (data?.token) setToken(data.token);
      if (data?.user?.username) localStorage.setItem("username", data.user.username);
      alert("Login successful ✅");
      window.location.href = "dashboard.html";
    } catch (err) {
      alert(err.message);
    }
  });

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regName").value.trim();

    try {
      const data = await apiRequest("/register", "POST", { username });
      if (data?.token) setToken(data.token);
      if (data?.user?.username) localStorage.setItem("username", data.user.username);
      alert("Registration successful ✅");
      window.location.href = "dashboard.html";
    } catch (err) {
      alert(err.message);
    }
  });
});

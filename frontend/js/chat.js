import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("chat.js yüklendi");

  const input = document.getElementById("message");
  const sendBtn = document.getElementById("sendBtn");
  const chatBox = document.getElementById("chatBox");

  if (!sendBtn || !input || !chatBox) {
    console.error("chat.html id'leri eksik: message / sendBtn / chatBox");
    return;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    chatBox.innerHTML += `<p><strong>Sen:</strong> ${message}</p>`;
    input.value = "";

    try {
      const data = await apiRequest("/chat", "POST", { message }, true);
      chatBox.innerHTML += `<p><strong>Bot:</strong> ${data.reply ?? JSON.stringify(data)}</p>`;
    } catch (err) {
      chatBox.innerHTML += `<p style="color:red;"><strong>Hata:</strong> ${err.message}</p>`;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

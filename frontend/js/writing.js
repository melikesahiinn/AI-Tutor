import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("writing.js yüklendi");

  const envGroup = document.getElementById("envGroup");
  const toneGroup = document.getElementById("toneGroup");
  const textEl = document.getElementById("writingText");
  const submitBtn = document.getElementById("submitWriting");
  const statusEl = document.getElementById("writingStatus");
  const feedbackEl = document.getElementById("feedbackBox");

  if (!envGroup || !toneGroup || !textEl || !submitBtn || !statusEl || !feedbackEl) {
    console.error("writing.html id'leri eksik");
    return;
  }

  const username = localStorage.getItem("username") || "User";

  let env = null;
  let tone = null;

  function activate(groupEl, value) {
    groupEl.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    const selected = groupEl.querySelector(`.chip[data-value="${value}"]`);
    selected?.classList.add("active");
  }

  envGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    env = chip.dataset.value;
    activate(envGroup, env);
  });

  toneGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    tone = chip.dataset.value;
    activate(toneGroup, tone);
  });

  submitBtn.addEventListener("click", async () => {
    statusEl.textContent = "";
    feedbackEl.innerHTML = "";

    const text = textEl.value.trim();
    if (!env) return statusEl.textContent = "Please select an environment.";
    if (!tone) return statusEl.textContent = "Please select a tone.";
    if (!text) return statusEl.textContent = "Please write something first.";

    submitBtn.disabled = true;
    statusEl.textContent = "Analyzing your writing...";
    feedbackEl.innerHTML = "<p style='color: #666;'>AI is reviewing your work...</p>";

    try {
      const data = await apiRequest("/writing/submit", "POST", 
        { username, environment: env, tone, text }, true);

      statusEl.textContent = "✅ Analysis complete!";

      const feedback = data?.feedback || {};
      const score = feedback.score || 0;

      // Display formatted feedback
      feedbackEl.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0;">Your Score</h3>
          <div style="font-size: 3rem; font-weight: bold;">${Math.round(score)}/100</div>
        </div>

        ${feedback.overallComment ? `
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af;">${feedback.overallComment}</p>
          </div>
        ` : ''}

        ${feedback.strengths && feedback.strengths.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #10b981; margin-bottom: 10px;">✅ Strengths:</h4>
            <ul style="list-style: none; padding: 0;">
              ${feedback.strengths.map(s => `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ ${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${feedback.improvements && feedback.improvements.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #f59e0b; margin-bottom: 10px;">💡 Areas for Improvement:</h4>
            <ul style="list-style: none; padding: 0;">
              ${feedback.improvements.map(i => `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">→ ${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${feedback.grammarIssues && feedback.grammarIssues.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #ef4444; margin-bottom: 10px;">📝 Grammar Notes:</h4>
            <ul style="list-style: none; padding: 0;">
              ${feedback.grammarIssues.map(g => `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">• ${g}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${feedback.vocabularySuggestions && feedback.vocabularySuggestions.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #8b5cf6; margin-bottom: 10px;">📚 Vocabulary Suggestions:</h4>
            <ul style="list-style: none; padding: 0;">
              ${feedback.vocabularySuggestions.map(v => `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">⭐ ${v}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

    } catch (err) {
      statusEl.textContent = "❌ " + err.message;
      feedbackEl.innerHTML = "<p style='color: red;'>Failed to get feedback. Please try again.</p>";
    } finally {
      submitBtn.disabled = false;
    }
  });
});

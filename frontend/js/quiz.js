import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("quiz.js yüklendi");

  const root = document.getElementById("quizRoot");
  const timerEl = document.getElementById("timer");
  const submitBtn = document.getElementById("submitQuizBtn");
  const statusEl = document.getElementById("submitStatus");

  if (!root || !timerEl || !submitBtn || !statusEl) {
    console.error("quiz.html id'leri eksik: quizRoot/timer/submitQuizBtn/submitStatus");
    return;
  }

  const username = localStorage.getItem("username") || "User";

  let questions = [];
  let idx = 0;
  let selectedIndex = null;
  let userAnswers = []; // Track all answers

  // 5 minutes for quiz
  let remaining = 300;
  let timerId = null;

  function fmt(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startTimer() {
    timerEl.textContent = fmt(remaining);
    timerId = setInterval(async () => {
      remaining--;
      timerEl.textContent = fmt(Math.max(remaining, 0));
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        statusEl.textContent = "Time's up! Submitting quiz...";
        await submitFullQuiz();
      }
    }, 1000);
  }

  function render() {
    const q = questions[idx];
    if (!q) {
      root.innerHTML = "<p>No questions available.</p>";
      submitBtn.disabled = true;
      return;
    }

    selectedIndex = null;
    statusEl.textContent = "";

    const opts = (q.options || []).map((opt, i) =>
      `<div class="option" data-i="${i}">${opt}</div>`
    ).join("");

    root.innerHTML = `
      <h2>Question ${idx + 1} of ${questions.length}</h2>
      <p style="font-size: 1.1rem; margin: 1.5rem 0;">${q.text || q.question || ""}</p>
      <div id="optionsWrap">${opts}</div>
    `;

    // Style options
    root.querySelectorAll(".option").forEach(el => {
      el.style.border = "1px solid #ccc";
      el.style.padding = "15px";
      el.style.margin = "10px 0";
      el.style.borderRadius = "10px";
      el.style.cursor = "pointer";
      el.style.transition = "all 0.2s";
    });
  }

  // Event delegation for option selection
  root.addEventListener("click", (e) => {
    const optEl = e.target.closest(".option");
    if (!optEl) return;

    root.querySelectorAll(".option").forEach(el => {
      el.style.fontWeight = "400";
      el.style.borderColor = "#ccc";
      el.style.background = "white";
    });

    optEl.style.fontWeight = "700";
    optEl.style.borderColor = "#6366f1";
    optEl.style.background = "#f0f0ff";

    selectedIndex = Number(optEl.dataset.i);
  });

  async function submit() {
    const q = questions[idx];
    if (!q) return;

    if (selectedIndex === null) {
      statusEl.textContent = "Please select an option first.";
      return;
    }

    submitBtn.disabled = true;

    // Store answer
    const selectedAnswer = q.options[selectedIndex];
    const isCorrect = selectedAnswer === q.answer;
    
    userAnswers.push({
      questionId: q.id,
      question: q.text || q.question,
      selectedAnswer: selectedAnswer,
      correctAnswer: q.answer,
      correct: isCorrect,
      topic: q.topic || 'general'
    });

    statusEl.textContent = isCorrect ? "✅ Correct!" : "❌ Incorrect";
    await new Promise(resolve => setTimeout(resolve, 1000));

    idx++;

    if (idx >= questions.length) {
      await submitFullQuiz();
      return;
    }

    submitBtn.disabled = false;
    render();
  }

  async function submitFullQuiz() {
    if (timerId) clearInterval(timerId);
    
    try {
      const result = await apiRequest("/quiz/submit", "POST", {
        username,
        answers: userAnswers
      }, true);

      const score = result.score || 0;
      const total = result.totalQuestions || questions.length;
      const accuracy = result.accuracy || 0;

      root.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h2>🎉 Quiz Complete!</h2>
          <div style="font-size: 3rem; font-weight: bold; color: #6366f1; margin: 1rem 0;">
            ${score}/${total}
          </div>
          <div style="font-size: 1.5rem; color: #666; margin-bottom: 2rem;">
            ${accuracy}% Accuracy
          </div>
          <button onclick="window.location.href='dashboard.html'" 
                  style="padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            Back to Dashboard
          </button>
        </div>
      `;
      submitBtn.style.display = 'none';
      statusEl.textContent = "";
      
    } catch (err) {
      statusEl.textContent = "Error submitting quiz: " + err.message;
      submitBtn.disabled = false;
    }
  }

  submitBtn.addEventListener("click", submit);

  try {
    statusEl.textContent = "Loading personalized questions...";
    const data = await apiRequest(`/quiz?username=${username}`, "GET", null, true);
    questions = data.questions || data || [];
    
    if (!Array.isArray(questions) || questions.length === 0) {
      root.innerHTML = "<p>No quiz questions available.</p>";
      statusEl.textContent = "";
      return;
    }
    
    statusEl.textContent = "";
    render();
    startTimer();
  } catch (err) {
    root.innerHTML = `<p style="color:red;">Failed to load quiz: ${err.message}</p>`;
    statusEl.textContent = "";
  }
});

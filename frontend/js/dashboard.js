import { apiRequest, clearToken } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("dashboard.js yüklendi");

  const logoutBtn = document.getElementById("logout-btn");
  const userDisplay = document.getElementById("user-display");
  const avatarInitial = document.getElementById("avatar-initial");

  // Get username from localStorage
  const username = localStorage.getItem("username") || "User";
  
  if (userDisplay) userDisplay.textContent = username;
  if (avatarInitial) avatarInitial.textContent = username.charAt(0).toUpperCase();

  logoutBtn?.addEventListener("click", () => {
    clearToken();
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });

  try {
    const data = await apiRequest(`/dashboard?username=${username}`, "GET", null, true);
    
    // Update KPI values
    document.getElementById("streak-val").textContent = data.streak || 0;
    document.getElementById("xp-val").textContent = data.xp || 0;
    
    // Update level display
    const levelDisplay = document.querySelector('.main-content header div:last-child div:last-child');
    if (levelDisplay) levelDisplay.textContent = data.level || 'Beginner A1';
    
    // Update skill bars
    const skills = data.skills || { grammar: 30, vocabulary: 25, writing: 20, listening: 15 };
    
    const skillBars = document.querySelectorAll('.progress-container');
    if (skillBars.length >= 4) {
      // Grammar
      skillBars[0].querySelector('.progress-label span:last-child').textContent = Math.round(skills.grammar) + '%';
      skillBars[0].querySelector('.progress-bar-fill').style.width = Math.round(skills.grammar) + '%';
      
      // Vocabulary
      skillBars[1].querySelector('.progress-label span:last-child').textContent = Math.round(skills.vocabulary) + '%';
      skillBars[1].querySelector('.progress-bar-fill').style.width = Math.round(skills.vocabulary) + '%';
      
      // Writing
      skillBars[2].querySelector('.progress-label span:last-child').textContent = Math.round(skills.writing) + '%';
      skillBars[2].querySelector('.progress-bar-fill').style.width = Math.round(skills.writing) + '%';
      
      // Listening
      skillBars[3].querySelector('.progress-label span:last-child').textContent = Math.round(skills.listening) + '%';
      skillBars[3].querySelector('.progress-bar-fill').style.width = Math.round(skills.listening) + '%';
    }
    
    // Update total hours
    const hourCards = document.querySelectorAll('.kpi-value');
    if (hourCards.length >= 3) {
      hourCards[2].textContent = (data.totalHours || 0) + 'h';
    }
    
    // Update quiz accuracy
    if (hourCards.length >= 4) {
      hourCards[3].textContent = (data.quizAccuracy || 0) + '%';
    }
    
    // Update recent activity timeline
    const timelineFeed = document.getElementById('timeline-feed');
    if (timelineFeed && data.recentActivity && data.recentActivity.length > 0) {
      timelineFeed.innerHTML = data.recentActivity.map(activity => {
        const date = new Date(activity.date);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h4>${activity.title}</h4>
              <div class="timeline-date">${dateStr}, ${timeStr}</div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Update AI insights with weak areas
    if (data.weakAreas && data.weakAreas.length > 0) {
      const aiPanel = document.querySelector('.ai-panel p');
      if (aiPanel) {
        const weakAreasText = data.weakAreas.join(', ');
        aiPanel.innerHTML = `
          Based on your recent activities, you've made great progress! 
          Keep working on: <strong>${weakAreasText}</strong>. 
          Your current accuracy is <strong>${data.quizAccuracy || 0}%</strong>. 
          Continue practicing to improve further!
        `;
      }
    }
    
  } catch (err) {
    console.error("Dashboard error:", err);
  }
});

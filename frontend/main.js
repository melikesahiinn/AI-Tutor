// Main JS - V2 Enhanced
const API_URL = 'http://localhost:3000/api';

// --- Auth & Layout Logic ---
function handleLogin() {
    const username = document.getElementById('username').value || "Student";

    // Hide Auth, Show App
    document.getElementById('auth-view').style.display = 'none';
    const appLayout = document.getElementById('app-layout');
    appLayout.style.display = 'flex';
    appLayout.classList.add('active'); // Trigger animation if any

    // Set User Info
    document.getElementById('sidebar-user').innerText = username;
    document.getElementById('avatar-initial').innerText = username.charAt(0).toUpperCase();

    // Default to Dashboard
    switchTab('dashboard-view', document.querySelectorAll('.nav-item')[0]);
}

function logout() {
    window.location.reload(); // Simple reload to reset state
}

// --- Navigation Logic ---
function switchTab(viewId, navElement) {
    // 1. Hide all views
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        if (el.id === 'auth-view') el.style.display = 'none';
    });

    // 2. Show target view inside Main Content
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    // 3. Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
}

// --- Chat Logic ---
function handleEnter(event) {
    if (event.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    // 1. Add User Message
    addMessage(message, 'user');
    input.value = '';

    // 2. Show Typing Indicator
    showTypingIndicator();

    // 3. Simulate Network Delay (1.5s)
    setTimeout(() => {
        removeTypingIndicator();
        const response = generateMockAIResponse(message);

        // 4. Stream Response (Typewriter Effect)
        streamMessage(response, 'ai');
    }, 1500);
}

function addMessage(text, type) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    scrollToBottom();
}

// Typing Indicator
function showTypingIndicator() {
    const chatBox = document.getElementById('chat-box');
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.classList.add('message', 'ai', 'typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatBox.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Typewriter Effect for AI
function streamMessage(text, type) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    chatBox.appendChild(msgDiv);

    let i = 0;
    const speed = 30; // ms per char

    function typeWriter() {
        if (i < text.length) {
            msgDiv.textContent += text.charAt(i);
            i++;
            scrollToBottom();
            setTimeout(typeWriter, speed);
        }
    }
    typeWriter();
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Mock AI Logic
function generateMockAIResponse(input) {
    input = input.toLowerCase();

    if (input.includes('hello') || input.includes('hi')) {
        return "Hello! I'm updated with a new v2 interface. Isn't it sleeker?";
    }
    if (input.includes('grammar')) {
        return "Let's focus on grammar. For example: 'She go to school' is incorrect. It should be 'She goes to school'. Try correcting: 'He play soccer'.";
    }
    if (input.includes('play')) {
        return "Correct! 'He plays soccer' is the right form for present simple tense.";
    }
    if (input.includes('thanks') || input.includes('thank you')) {
        return "You're very welcome! Keep up the good work.";
    }

    return "That's an interesting point. Could you elaborate more in English? I'm here to help you practice.";
}

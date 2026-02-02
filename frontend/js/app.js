
const app = {
    state: {
        user: null,
        token: null,
        currentMode: 'practice',
        isLoginMode: true
    },

    init: () => {
        console.log('Langually App Initialized');
    },


    toggleAuth: () => {
        app.state.isLoginMode = !app.state.isLoginMode;
        const isLogin = app.state.isLoginMode;


        document.getElementById('auth-btn-text').innerText = isLogin ? 'Start Learning Journey' : 'Create Account';
        document.getElementById('auth-toggle-text').innerText = isLogin ? "Don't have an account?" : "Already have an account?";
        document.getElementById('auth-toggle-action').innerText = isLogin ? 'Register' : 'Login';


    },

    login: async () => {
        const usernameInput = document.getElementById('username-input');
        const username = usernameInput.value.trim();

        if (!username) {
            alert("Please enter a username to start.");
            return;
        }


        if (!app.state.isLoginMode) {
            console.log("Registering new user:", username);

        }

        try {
            const res = await API.login(username);

            if (res.success) {
                app.state.user = res.user;
                app.state.token = res.token;
                localStorage.setItem('token', res.token);


                document.getElementById('sidebar-username').innerText = res.user.username;
                document.getElementById('sidebar-avatar').innerText = res.user.username.charAt(0).toUpperCase();


                document.getElementById('auth-view').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('auth-view').style.display = 'none';
                    document.getElementById('app-structure').style.display = 'flex';
                    app.nav('dashboard');
                    app.loadDashboardData();
                    app.checkForAssignedQuiz();

                }, 500);
            }
        } catch (err) {
            console.error(err);
            alert("Login failed. Check console.");
        }
    },


    nav: (viewId, param = null) => {

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');

            if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${viewId}'`)) {
                el.classList.add('active');
            }

            if (viewId === 'chat' && el.innerText.includes('AI Tutor')) el.classList.add('active');
        });


        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.opacity = '0';
            setTimeout(() => {
                if (!el.classList.contains('active')) el.style.display = 'none';
            }, 300); // Wait for fade out
        });


        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.style.display = 'block';
            setTimeout(() => target.classList.add('active'), 10);
        }


        if (viewId === 'chat' && param) {
            app.setChatMode(param);
        }
    },


    loadDashboardData: async () => {
        try {
            const stats = await API.getProgress(); // Using the method from api.js
            if (stats) {
                // Update Basic Stats
                const streakEl = document.getElementById('dash-streak');
                const xpEl = document.getElementById('dash-xp');
                if (streakEl) streakEl.innerText = (stats.streak || app.state.user.streak || 0) + ' Days';
                if (xpEl) xpEl.innerText = (stats.xp || app.state.user.xp || 0);

                // Update Dashboard Skill Bars
                const updateBar = (idPrefix, value) => {
                    const bar = document.getElementById(idPrefix + '-bar');
                    const text = document.getElementById(idPrefix + '-text');
                    if (bar) bar.style.width = value + '%';
                    if (text) text.innerText = value + '%';
                };

                const skills = stats.skills || {};
                updateBar('dash-grammar', skills.grammar || 0);
                updateBar('dash-vocab', skills.vocabulary || 0);
                updateBar('dash-speaking', skills.listening || 0); // Mapping listening to conversation
                updateBar('dash-writing', skills.writing || 0);

                // Update Quiz View Bars (if elements exist)
                const quizCourseBar = document.getElementById('quiz-course-bar');
                const quizCourseText = document.getElementById('quiz-course-text');

                if (quizCourseBar && quizCourseText) {
                    // Avg progress
                    const avg = Math.round(((skills.grammar || 0) + (skills.vocabulary || 0) + (skills.listening || 0) + (skills.writing || 0)) / 4);
                    quizCourseBar.style.width = avg + '%';
                    quizCourseText.innerText = avg + '%';
                }

                // Update Quiz Segment Bars
                const updateQuizBar = (id, value) => {
                    const bar = document.getElementById(id);
                    if (bar) bar.style.width = value + '%';
                };

                updateQuizBar('quiz-grammar-bar', skills.grammar || 0);
                updateQuizBar('quiz-vocab-bar', skills.vocabulary || 0);
                updateQuizBar('quiz-listening-bar', skills.listening || 0);
            }
        } catch (e) {
            console.error("Error loading dashboard data:", e);
        }
    },

    checkForAssignedQuiz: async () => {
        try {
            // We reuse /api/quiz which checks for assigned quizzes first
            // But to just peek without starting, we might need a separate call or modify startQuiz logic.
            // Actually, server /api/quiz returns the quiz object. 
            // Let's assume startQuiz fetches it. To SHOW the card, we need to know if one exists.
            // Let's just peek at the active-quizzes endpoint from student side?
            // Or better, let's just make a simple call to get user status.

            // For now, let's hit /api/quiz/check or similar, or just re-use API.getQuiz() but handle it carefully.
            // Wait, previous server logic for getQuiz returns a quiz IMMEDIATELY.
            // Let's try to peek at assigned quizzes specifically.

            // Let's assume startQuiz fetches it. To SHOW the card, we need to know if one exists.
            // Let's just peek at the active-quizzes endpoint from student side?
            // Or better, let's just make a simple call to get user status.

            // For now, let's hit /api/quiz/check or similar, or just re-use API.getQuiz() but handle it carefully.
            // Wait, previous server logic for getQuiz returns a quiz IMMEDIATELY.
            // Let's try to peek at assigned quizzes specifically.

            const res = await fetch('http://localhost:3000/api/admin/active-quizzes'); // Public endpoint for now
            if (res.ok) {
                const quizzes = await res.json();
                const assigned = quizzes.find(q => q.active); // Simple check for any active quiz

                if (assigned) {
                    const card = document.getElementById('assigned-quiz-card');
                    const title = document.getElementById('assigned-quiz-title');
                    const info = document.getElementById('assigned-quiz-info');
                    const defaultCard = document.getElementById('quiz-container').querySelector('.glass-card'); // The 'Daily Challenge' card

                    if (card && title) {
                        card.style.display = 'block';
                        title.textContent = assigned.title;
                        info.innerHTML = `<ion-icon name="person-circle-outline"></ion-icon> Assigned by Teacher • ${assigned.questions.length} Questions`;

                        // Keep the default "Daily Challenge" card visible as well
                        if (defaultCard) {
                            defaultCard.style.display = 'block';
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error checking assigned quizzes:", e);
        }
    },

    setChatMode: (mode) => {
        app.state.currentMode = mode;
        const select = document.getElementById('chat-mode-select');
        if (select) select.value = mode; // Sync UI

        document.getElementById('chat-mode-display').innerText = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';


        app.addChatMessage(`Switched to ${mode} mode.`, 'ai', true);
    },

    sendMessage: async () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;


        app.addChatMessage(text, 'user');
        input.value = '';


        app.showTypingIndicator();


        try {
            const res = await API.sendMessage(text, app.state.currentMode);

            app.removeTypingIndicator();

            if (res.response) {
                app.addChatMessage(res.response, 'ai');
            }
            if (res.corrections && res.corrections.length > 0) {
                app.addChatMessage(`💡 **Tip:** ${res.corrections.join(', ')}`, 'ai');
            }

        } catch (err) {
            console.error('Chat Error:', err);
            app.removeTypingIndicator();
            app.addChatMessage(`Error: ${err.message || "Connecting to tutor failed."}`, 'ai');
        }
    },

    addChatMessage: (text, sender, isSystem = false) => {
        const box = document.getElementById('chat-box');
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        if (isSystem) {
            div.style.background = 'transparent';
            div.style.boxShadow = 'none';
            div.style.padding = '0.5rem';
            div.style.fontStyle = 'italic';
            div.style.color = 'var(--text-muted)';
            div.style.textAlign = 'center';
            div.style.width = '100%';
            div.style.maxWidth = '100%'; // Override .msg limit
            div.style.alignSelf = 'center';
        }

        // Parse Markdown using marked.js if available, otherwise fallback to simple replacement
        if (typeof marked !== 'undefined') {
            div.innerHTML = marked.parse(text);
        } else {
            div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        }

        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    },

    showTypingIndicator: () => {
        const box = document.getElementById('chat-box');
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'msg ai typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    },

    removeTypingIndicator: () => {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    },


    startQuiz: (type) => {
        const container = document.getElementById('quiz-container');
        container.style.display = 'block';
        container.innerHTML = `<div class="glass-card"><p>Generating personalized quiz based on your recent chats...</p></div>`;

        API.getQuiz(type).then(data => {
            if (data && data.questions) {
                app.state.quizQuestions = data.questions;
                app.state.currentQuestionIndex = 0;
                app.state.score = 0;
                app.renderQuestion();
            } else {
                container.innerHTML = `<div class="glass-card"><p>Could not load quiz. Please try again.</p></div>`;
            }
        }).catch(err => {
            container.innerHTML = `<div class="glass-card"><p>Error: ${err.message}</p></div>`;
        });
    },

    renderQuestion: () => {
        const container = document.getElementById('quiz-container');
        const questions = app.state.quizQuestions;
        const index = app.state.currentQuestionIndex;

        if (index >= questions.length) {
            // Quiz Finished
            container.innerHTML = `
                <div class="glass-card" style="text-align: center;">
                    <h3>Quiz Completed! 🎉</h3>
                    <p style="font-size: 2rem; margin: 1rem 0;">Score: ${app.state.score}/${questions.length}</p>
                    <button class="btn btn-primary" onclick="app.startQuiz()">Try Another Quiz</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('quiz-container').style.display='none'">Close</button>
                </div>
            `;
            // Refresh dashboard data to update XP/Level immediately
            app.loadDashboardData();
            return;
        }

        const q = questions[index];
        container.innerHTML = `
            <div class="glass-card" style="text-align: left;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <span style="color:var(--text-muted);">Question ${index + 1}/${questions.length}</span>
                    <span style="color:var(--primary);">Score: ${app.state.score}</span>
                </div>
                <h3 style="margin-bottom: 1rem;">${q.text || q.question}</h3>
                <div style="display: grid; gap: 0.8rem;" id="quiz-options">
                    <!-- Options injected here -->
                </div>
            </div>
        `;

        const optionsContainer = document.getElementById('quiz-options');
        (q.options || []).forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.width = '100%';
            btn.style.justifyContent = 'flex-start';
            btn.style.textAlign = 'left';
            btn.textContent = opt;

            // Explicitly use addEventListener for robustness
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Option clicked:', opt);
                // alert('DEBUG: Clicked ' + opt); // Uncomment if needed for extreme debugging
                app.handleAnswer(opt);
            });

            optionsContainer.appendChild(btn);
        });
    },

    handleAnswer: (selectedOption) => {
        console.log('Handling answer:', selectedOption);
        const questions = app.state.quizQuestions;
        const index = app.state.currentQuestionIndex;
        const q = questions[index];

        const isCorrect = selectedOption === q.answer;
        if (isCorrect) app.state.score++;

        // Track answer for submission
        if (!app.state.quizAnswers) app.state.quizAnswers = [];
        app.state.quizAnswers.push({
            id: q.id,
            text: q.text,
            topic: q.topic,
            selectedOption,
            correct: isCorrect
        });

        // Show feedback (could be improved with a dedicated modal or inline change, but for now simple alert/next)
        // Ideally, user wants to see if they were right. Let's start with auto-advance for now or simple visual cue.
        // Let's re-render with color coding.

        const container = document.getElementById('quiz-container');
        const buttons = container.querySelectorAll('button');

        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText.trim() === q.answer) {
                btn.style.background = 'rgba(16, 185, 129, 0.2)'; // Green
                btn.style.borderColor = 'var(--success)';
            } else if (btn.innerText.trim() === selectedOption && !isCorrect) {
                btn.style.background = 'rgba(239, 68, 68, 0.2)'; // Red
                btn.style.borderColor = 'var(--error)';
            }
        });

        setTimeout(async () => {
            app.state.currentQuestionIndex++;
            if (app.state.currentQuestionIndex < questions.length) {
                app.renderQuestion();
            } else {
                // Quiz Completed
                const container = document.getElementById('quiz-container');
                container.innerHTML = `<div class="glass-card" style="text-align: center;"><h3>Submitting Results...</h3></div>`;

                try {
                    await API.submitQuiz(app.state.quizAnswers);
                    // Clear answers for next time
                    app.state.quizAnswers = [];
                } catch (err) {
                    console.error("Error submitting quiz:", err);
                }

                container.innerHTML = `
                    <div class="glass-card" style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                        <h2 style="color: var(--success); margin-bottom: 1rem;">Quiz Completed!</h2>
                        <p style="font-size: 1.2rem; margin-bottom: 2rem;">
                            Your Score: <span style="font-weight: bold; color: white;">${app.state.score}/${questions.length}</span>
                        </p>
                        <button class="btn btn-primary" onclick="app.startQuiz()" style="margin: 0 auto;">
                            <ion-icon name="refresh"></ion-icon> Start New Quiz
                        </button>
                    </div>
                `;
                app.loadDashboardData(); // Refresh stats
            }
        }, 1500);
    },

    insertMarkdown: (marker) => {
        const input = document.getElementById('writing-input');
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        const selected = text.substring(start, end);

        const replacement = `${marker}${selected}${marker}`;
        input.value = text.substring(0, start) + replacement + text.substring(end);

        input.focus();
        input.selectionStart = start + marker.length;
        input.selectionEnd = end + marker.length;
    },

    setWritingTopic: (topic) => {
        const input = document.getElementById('writing-input');
        if (input) {
            input.value = `Topic: ${topic}\n\n`;
            input.focus();
        }
    },

    submitWriting: () => {
        const text = document.getElementById('writing-input').value;
        const typeSelect = document.getElementById('writing-type-select');
        const type = typeSelect ? typeSelect.value : 'Essay';

        if (!text || text.length < 10) {
            alert("Please write a bit more before submitting!");
            return;
        }

        const feedbackContainer = document.getElementById('writing-feedback-placeholder');
        if (feedbackContainer) {
            feedbackContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: var(--text-muted);">AI is analyzing your ${type}...</p>
                </div>
            `;
        }

        API.analyzeWriting(text).then(res => {
            if (res && res.feedback) {
                const fb = res.feedback;

                // Construct Feedback UI
                let strengthHtml = fb.strengths.map(s => `<li style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.25rem;">✅ ${s}</li>`).join('');
                let improvementHtml = fb.improvements.map(i => `<li style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.25rem;">🔧 ${i}</li>`).join('');

                feedbackContainer.innerHTML = `
                    <div style="animation: fadeIn 0.5s;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--border-light);">
                            <h3 style="font-size:1.1rem;">Analysis</h3>
                            <div style="background: ${fb.score >= 70 ? 'var(--success)' : 'var(--warning)'}; color:#000; padding:0.25rem 0.75rem; border-radius:1rem; font-weight:bold;">
                                ${fb.score}/100
                            </div>
                        </div>
                        
                        <p style="font-size:0.9rem; color:var(--text-muted); font-style:italic; margin-bottom:1rem;">"${fb.overallComment}"</p>
                        
                        <div style="margin-bottom:1rem;">
                            <h4 style="font-size:0.95rem; color:var(--success); margin-bottom:0.5rem;">Strengths</h4>
                            <ul style="list-style:none;">${strengthHtml}</ul>
                        </div>
                        
                        <div>
                            <h4 style="font-size:0.95rem; color:var(--warning); margin-bottom:0.5rem;">Improvements</h4>
                            <ul style="list-style:none;">${improvementHtml}</ul>
                        </div>
                    </div>
                `;

                // Refresh dashboard to show new XP
                app.loadDashboardData();
            }
        }).catch(err => {
            console.error("Writing analysis error:", err);
            if (feedbackContainer) feedbackContainer.innerHTML = `<p style="color:var(--error); text-align:center;">Analysis failed. Please try again.</p>`;
        });
    }
};


// Expose to window for inline event handlers (onclick)
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

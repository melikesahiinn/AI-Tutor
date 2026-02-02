const Admin = {
    state: {
        generatedQuiz: null
    },

    init: () => {
        console.log('Admin Panel Initialized');

        // Load initial data
        Admin.loadActiveQuizzes();

        // Add Enter key support for login
        const passInput = document.getElementById('admin-password');
        if (passInput) {
            passInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    Admin.login();
                }
            });
        }
    },

    login: () => {
        const user = document.getElementById('admin-username').value;
        const pass = document.getElementById('admin-password').value;

        if (user === 'admin' && pass === 'admin123') {
            const overlay = document.getElementById('admin-login-overlay');
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        } else {
            alert('Invalid credentials! Try admin/admin123');
        }
    },

    openModal: (id) => {
        document.getElementById(id).style.display = 'flex';
    },

    closeModal: (id) => {
        document.getElementById(id).style.display = 'none';
    },

    generateQuiz: async () => {
        console.log("Generate button clicked");
        const btn = document.getElementById('generate-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<ion-icon name="sync" class="spin"></ion-icon> Generating...';
        btn.disabled = true;

        const levelInput = document.getElementById('quiz-level');
        const topicInput = document.getElementById('quiz-topic');

        const level = levelInput ? levelInput.value : 'A1';
        const topic = (topicInput && topicInput.value) ? topicInput.value : 'General English';

        console.log(`Requesting quiz for Level: ${level}, Topic: ${topic}`);

        try {
            // Call backend to generate quiz structure
            // We use the existing API helper if available, or fetch directly
            const res = await fetch('http://localhost:3000/api/admin/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, topic })
            });

            const data = await res.json();

            if (data.quiz) {
                Admin.state.generatedQuiz = data.quiz;
                // alert(`Quiz generated successfully with ${data.quiz.length} questions!`);

                // Show Preview
                const previewDiv = document.getElementById('quiz-preview');
                previewDiv.style.display = 'block';
                previewDiv.innerHTML = data.quiz.map((q, i) => `
                    <div style="margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                        <strong>Q${i + 1}:</strong> ${q.text} <br/>
                        <small style="color: var(--success);">Answer: ${q.answer}</small>
                    </div>
                `).join('');

                // Show preview or enable assign button
                const assignBtn = document.getElementById('assign-btn');
                assignBtn.disabled = false;
                assignBtn.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon> Assign Quiz (${data.quiz.length} Qs)`;
            } else {
                alert('Failed to generate quiz.');
            }

        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    assignQuiz: async () => {
        if (!Admin.state.generatedQuiz) {
            alert('Please generate a quiz first!');
            return;
        }

        const title = document.getElementById('quiz-title').value || 'New Quiz';
        const assignTo = document.getElementById('assign-to').value;

        const btn = document.getElementById('assign-btn');
        btn.innerHTML = 'Assigning...';
        btn.disabled = true;

        try {
            const res = await fetch('http://localhost:3000/api/admin/assign-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    questions: Admin.state.generatedQuiz,
                    assignedTo: assignTo
                })
            });

            if (res.ok) {
                alert('Quiz assigned to students successfully!');
                Admin.closeModal('admin-quiz-modal');
                Admin.loadActiveQuizzes(); // Refresh list
            } else {
                alert('Failed to assign quiz.');
            }

        } catch (e) {
            console.error(e);
            alert('Error assigning quiz.');
        } finally {
            btn.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon> Assign Quiz';
            btn.disabled = false;
        }
    },

    loadActiveQuizzes: async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/active-quizzes');
            if (!res.ok) return; // Endpoint might not exist yet

            const quizzes = await res.json();
            const tbody = document.querySelector('.active-quizzes-table tbody'); // Need to ensure class name matches or add ID
            if (!tbody) return;

            tbody.innerHTML = quizzes.map(q => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 1rem;">
                        <input type="checkbox" style="margin-right: 0.5rem; vertical-align: middle;">
                        <span style="font-weight: 500; color: white;">${q.title}</span>
                        <div style="font-size: 0.75rem; color: var(--text-muted); padding-left: 1.5rem;">${new Date(q.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style="padding: 1rem;">
                        <span class="badge" style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; background: rgba(99, 102, 241, 0.2); color: var(--primary);">
                            ${q.questions.length} Qs
                        </span>
                    </td>
                    <td style="padding: 1rem; color: var(--text-secondary);">${q.assignedTo}</td>
                    <td style="padding: 1rem;">
                        <span style="display: inline-flex; align-items: center; gap: 0.3rem; color: var(--success); font-size: 0.9rem;">
                            <div style="width: 6px; height: 6px; background: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success);"></div>
                            Active
                        </span>
                    </td>
                    <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button title="Delete" onclick="Admin.deleteQuiz(${q.id})"
                                style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--error); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                                onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.transform='scale(1.05)'"
                                onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.transform='scale(1)'">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Failed to load active quizzes:', e);
        }
    },

    deleteQuiz: async (id) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;

        try {
            await fetch(`http://localhost:3000/api/admin/quiz/${id}`, { method: 'DELETE' });
            Admin.loadActiveQuizzes();
        } catch (e) {
            alert('Error deleting quiz');
        }
    }
};

window.Admin = Admin;

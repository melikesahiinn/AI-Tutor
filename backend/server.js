import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

/* =========================
   AI INTEGRATION (Pollinations.ai - Truly Free)
========================= */

const AI_API_URL = 'https://text.pollinations.ai/openai';
const AI_MODEL = 'openai'; // Pollinations default or specific models like 'mistral', 'qwen', etc.

async function callAI(messages, temperature = 0.7) {
  console.log('DEBUG: Entering callAI');
  try {
    console.log('Calling AI API (Pollinations)...');

    const response = await fetch(AI_API_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header needed for Pollinations.ai free tier
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000
      })
    });

    console.log('DEBUG: Fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('DEBUG: Fetch data received, keys:', Object.keys(data));

    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      console.log('DEBUG: Returning content length:', content.length);
      return content;
    } else {
      console.error('AI API returned no choices:', data);
      throw new Error('No response choices from AI');
    }
  } catch (error) {
    console.error('AI Error:', error);
    return `I apologize, but I encountered an error: ${error.message || error}. Please try again later.`;
  }
}

/* =========================
   JSON STORAGE (NO DB)
========================= */

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  chatLogs: path.join(DATA_DIR, 'chatLogs.json'),
  quizResults: path.join(DATA_DIR, 'quizResults.json'),
  writingSubmissions: path.join(DATA_DIR, 'writingSubmissions.json')
};

function loadData(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* =========================
   AUTH
========================= */

// REGISTER
app.post('/api/register', (req, res) => {
  const { username } = req.body;
  let users = loadData(FILES.users);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    username,
    level: 'Beginner A1',
    xp: 0,
    streak: 0,
    totalHours: 0,
    quizAccuracy: 0,
    lastLogin: new Date(),
    skills: {
      grammar: 30,
      vocabulary: 25,
      writing: 20,
      listening: 15
    },
    weakAreas: [],
    createdAt: new Date()
  };

  users.push(newUser);
  saveData(FILES.users, users);

  res.json({ success: true, user: newUser });
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  let users = loadData(FILES.users);

  let user = users.find(u => u.username === username);
  if (!user) {
    user = {
      username,
      level: 'Beginner A1',
      xp: 0,
      streak: 0,
      totalHours: 0,
      quizAccuracy: 0,
      lastLogin: new Date(),
      skills: {
        grammar: 30,
        vocabulary: 25,
        writing: 20,
        listening: 15
      },
      weakAreas: [],
      createdAt: new Date()
    };
    users.push(user);
  } else {
    // Update streak
    const lastLogin = new Date(user.lastLogin);
    const now = new Date();
    const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      user.streak = (user.streak || 0) + 1;
    } else if (daysDiff > 1) {
      user.streak = 1;
    }

    user.lastLogin = now;
  }

  saveData(FILES.users, users);

  res.json({
    success: true,
    token: 'mock-jwt-' + Date.now(),
    user
  });
});

/* =========================
   CHAT (REAL AI)
========================= */

app.post('/api/chat', async (req, res) => {
  const { username, message, mode } = req.body;

  if (!username || !message) {
    return res.status(400).json({ error: 'Username and message are required' });
  }

  const logs = loadData(FILES.chatLogs);

  // Get user's conversation history (last 10 messages)
  const userHistory = logs
    .filter(log => log.username === username)
    .slice(-10);

  // Build conversation context
  const conversationMessages = [];

  // System prompt based on mode
  if (mode === 'explanation') {
    conversationMessages.push({
      role: 'system',
      content: 'You are an expert English language tutor. Your role is to explain English grammar, vocabulary, idioms, and usage clearly and concisely. Provide helpful examples. Keep responses friendly and educational.'
    });
  } else if (mode === 'practice') {
    conversationMessages.push({
      role: 'system',
      content: 'You are an English language practice partner. Help users practice their English by engaging in conversation, correcting their mistakes gently, and suggesting improvements. Be encouraging and supportive.'
    });
  } else {
    conversationMessages.push({
      role: 'system',
      content: 'You are a friendly English language tutor. Help users learn English through conversation, explanations, and practice. Be supportive and encouraging.'
    });
  }

  // Add conversation history
  userHistory.forEach(log => {
    conversationMessages.push({ role: 'user', content: log.message });
    if (log.response) {
      conversationMessages.push({ role: 'assistant', content: log.response });
    }
  });

  // Add current message
  conversationMessages.push({ role: 'user', content: message });

  // Get AI response
  const aiResponse = await callAI(conversationMessages);

  // Detect corrections and suggestions
  const corrections = [];
  if (mode === 'practice') {
    // Simple grammar check hints
    if (message.match(/\bi is\b/i)) corrections.push('Check subject-verb agreement');
    if (message.match(/\bhe go\b/i)) corrections.push('Remember to use "goes" with he/she/it');
    if (message.length < 10) corrections.push('Try to write longer sentences for better practice');
  }

  // Save conversation
  logs.push({
    username,
    message,
    response: aiResponse,
    mode,
    corrections,
    date: new Date()
  });
  saveData(FILES.chatLogs, logs);

  // Update user XP and skills
  const users = loadData(FILES.users);
  const user = users.find(u => u.username === username);
  if (user) {
    user.xp = (user.xp || 0) + 5; // 5 XP per message
    user.totalHours = (user.totalHours || 0) + 0.02; // ~1 minute

    // Update skills slightly
    if (mode === 'practice') {
      user.skills.grammar = Math.min(100, (user.skills.grammar || 0) + 0.5);
    } else {
      user.skills.vocabulary = Math.min(100, (user.skills.vocabulary || 0) + 0.3);
    }

    saveData(FILES.users, users);
  }

  res.json({
    reply: aiResponse,
    response: aiResponse,
    corrections
  });
});

/* =========================
   QUIZ (PERSONALIZED)
========================= */

// GET QUIZ - Personalized based on user's weak areas
app.get('/api/quiz', async (req, res) => {
  const { username } = req.query;

  const users = loadData(FILES.users);
  const user = users.find(u => u.username === username);

  // Determine difficulty and topics based on user level and weak areas
  let level = 'beginner';
  let weakTopics = ['grammar', 'vocabulary'];

  if (user) {
    if (user.level.includes('Intermediate')) level = 'intermediate';
    else if (user.level.includes('Advanced')) level = 'advanced';

    // Identify weak areas
    const skills = user.skills || {};
    weakTopics = Object.entries(skills)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([topic]) => topic);
  }

  // Get recent chat history for context
  const chatLogs = loadData(FILES.chatLogs);
  const userChats = chatLogs.filter(log => log.username === username).slice(-10);
  const recentTopics = userChats.map(log => log.message).join('; ');

  // CHECK FOR ASSIGNED QUIZZES FIRST (Unless forced daily)
  // definition of FILES_ADMIN.assignedQuizzes manually here since it was defined locally below effectively
  const assignedDataPath = path.join(DATA_DIR, 'assignedQuizzes.json');
  if (req.query.type !== 'daily' && fs.existsSync(assignedDataPath)) {
    const assignedQuizzes = JSON.parse(fs.readFileSync(assignedDataPath, 'utf-8'));
    // Find active assignment for this user or 'All Students'
    // Taking the most recent one
    const assignment = assignedQuizzes.reverse().find(q => q.active && (q.assignedTo === 'All Students' || q.assignedTo === username));

    if (assignment) {
      console.log(`Serving Assigned Quiz: ${assignment.title} to ${username}`);
      return res.json({
        questions: assignment.questions,
        topic: assignment.title // Pass title as topic for UI display if needed
      });
    }
  }

  // Generate personalized quiz using AI (Fallback/Default)
  const quizPrompt = `Generate 5 English language quiz questions for ${level} level students. 
  ${recentTopics ? `Context based on recent student questions: "${recentTopics}". Focus on these topics.` : `Focus on these topics: ${weakTopics.join(', ')}.`}
  
  Return ONLY a valid JSON array with this exact structure:
  [
    {
      "id": 1,
      "text": "question text here",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option text",
      "topic": "grammar or vocabulary"
    }
  ]
  Make questions challenging but appropriate for ${level} level. Include variety in question types.`;

  const aiResponse = await callAI([
    { role: 'system', content: 'You are an expert English language assessment creator. Return only valid JSON, no other text.' },
    { role: 'user', content: quizPrompt }
  ], 0.8);

  let questions = [];
  try {
    // Try to extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found');
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
    // Fallback questions
    questions = [
      {
        id: 1,
        text: "Which sentence uses the present perfect correctly?",
        options: [
          "I have seen that movie yesterday",
          "I have seen that movie last week",
          "I have seen that movie before",
          "I have saw that movie before"
        ],
        answer: "I have seen that movie before",
        topic: "grammar"
      },
      {
        id: 2,
        text: "What is the past tense of 'go'?",
        options: ["goed", "went", "gone", "going"],
        answer: "went",
        topic: "grammar"
      },
      {
        id: 3,
        text: "Choose the correct word: 'I am interested ___ learning English.'",
        options: ["at", "in", "on", "for"],
        answer: "in",
        topic: "grammar"
      },
      {
        id: 4,
        text: "What does 'piece of cake' mean?",
        options: ["dessert", "very easy", "delicious", "birthday"],
        answer: "very easy",
        topic: "vocabulary"
      },
      {
        id: 5,
        text: "What is the plural of 'child'?",
        options: ["childs", "children", "childes", "child"],
        answer: "children",
        topic: "grammar"
      }
    ];
  }

  res.json({ questions });
});

// SUBMIT QUIZ - Track performance and update user profile
app.post('/api/quiz/submit', (req, res) => {
  const { username, answers, questionId, answerIndex } = req.body;

  const results = loadData(FILES.quizResults);
  const users = loadData(FILES.users);
  const user = users.find(u => u.username === username);

  let score = 0;
  let totalQuestions = 0;
  let weakTopics = [];

  // Handle both single question and full quiz submission
  if (answers && Array.isArray(answers)) {
    // Full quiz submission
    score = answers.filter(a => a.correct).length;
    totalQuestions = answers.length;

    // Identify weak topics
    const incorrectAnswers = answers.filter(a => !a.correct);
    weakTopics = [...new Set(incorrectAnswers.map(a => a.topic).filter(Boolean))];

    results.push({
      username,
      score,
      totalQuestions,
      answers,
      weakTopics,
      date: new Date()
    });
  } else {
    // Single question submission
    results.push({
      username,
      questionId,
      answerIndex,
      date: new Date()
    });
    score = 1;
    totalQuestions = 1;
  }

  saveData(FILES.quizResults, results);

  // Update user stats
  if (user) {
    // Calculate accuracy
    const userResults = results.filter(r => r.username === username && r.totalQuestions);
    const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
    const totalQs = userResults.reduce((sum, r) => sum + r.totalQuestions, 0);

    user.quizAccuracy = totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0;
    user.xp = (user.xp || 0) + (score * 10); // 10 XP per correct answer
    user.totalHours = (user.totalHours || 0) + 0.1; // ~6 minutes for a quiz

    // Update weak areas
    if (weakTopics.length > 0) {
      user.weakAreas = [...new Set([...(user.weakAreas || []), ...weakTopics])].slice(0, 3);
    }

    // Update skill levels based on performance
    if (totalQuestions > 0) {
      const accuracy = score / totalQuestions;
      const improvement = accuracy > 0.7 ? 2 : (accuracy > 0.5 ? 1 : 0.5);

      user.skills.grammar = Math.min(100, (user.skills.grammar || 0) + improvement);
      user.skills.vocabulary = Math.min(100, (user.skills.vocabulary || 0) + improvement * 0.8);
    }

    // Level up system
    const xpThresholds = {
      'Beginner A1': 0,
      'Beginner A2': 500,
      'Intermediate B1': 1500,
      'Intermediate B2': 3000,
      'Advanced C1': 5000,
      'Advanced C2': 8000
    };

    for (const [level, threshold] of Object.entries(xpThresholds).reverse()) {
      if (user.xp >= threshold) {
        user.level = level;
        break;
      }
    }

    saveData(FILES.users, users);
  }

  res.json({
    success: true,
    score,
    totalQuestions,
    accuracy: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  });
});

/* =========================
   DASHBOARD (REAL DATA)
========================= */

app.get('/api/dashboard', (req, res) => {
  const { username } = req.query;

  const users = loadData(FILES.users);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.json({
      xp: 0,
      streak: 0,
      totalHours: 0,
      quizAccuracy: 0,
      level: 'Beginner A1',
      skills: { grammar: 30, vocabulary: 25, writing: 20, listening: 15 },
      weakAreas: []
    });
  }

  // Get recent activity
  const chatLogs = loadData(FILES.chatLogs).filter(log => log.username === username);
  const quizResults = loadData(FILES.quizResults).filter(r => r.username === username);
  const writings = loadData(FILES.writingSubmissions).filter(w => w.username === username);

  const recentActivity = [
    ...chatLogs.slice(-5).map(log => ({
      type: 'chat',
      title: 'AI Tutor Session',
      date: log.date
    })),
    ...quizResults.slice(-5).map(r => ({
      type: 'quiz',
      title: `Quiz Completed (${r.score}/${r.totalQuestions || 'N/A'})`,
      date: r.date
    })),
    ...writings.slice(-5).map(w => ({
      type: 'writing',
      title: 'Writing Submitted',
      date: w.date
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  res.json({
    xp: user.xp || 0,
    streak: user.streak || 0,
    totalHours: (user.totalHours || 0).toFixed(1),
    quizAccuracy: user.quizAccuracy || 0,
    level: user.level || 'Beginner A1',
    skills: user.skills || { grammar: 30, vocabulary: 25, writing: 20, listening: 15 },
    weakAreas: user.weakAreas || [],
    recentActivity
  });
});

/* =========================
   WRITING (REAL AI FEEDBACK)
========================= */

app.post('/api/writing/submit', async (req, res) => {
  const { username, text, environment, tone } = req.body;

  const writings = loadData(FILES.writingSubmissions);

  /*
  // AI INTEGRATION DISABLED AS PER USER REQUEST (MOCK MODE)
  const feedbackPrompt = `You are an expert English writing tutor. Analyze this student's writing and provide detailed feedback.

Context: ${environment || 'General'} writing with ${tone || 'neutral'} tone
Student's text: "${text}"

Provide feedback in the following JSON format:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "grammarIssues": ["issue1", "issue2"],
  "vocabularySuggestions": ["suggestion1", "suggestion2"],
  "overallComment": "brief encouraging comment"
}

Be specific, constructive, and encouraging. Focus on both what they did well and how they can improve.`;

  const aiResponse = await callAI([
    { role: 'system', content: 'You are an expert English writing instructor. Return only valid JSON.' },
    { role: 'user', content: feedbackPrompt }
  ], 0.7);
  */

  // Mock Feedback for UI Testing
  let feedback = {
    score: 88,
    strengths: ['Excellent sentence structure', 'Clear and concise tone', 'Good use of vocabulary'],
    improvements: ['Consider adding more complex compound sentences', 'Expand on the conclusion'],
    grammarIssues: [],
    vocabularySuggestions: ['try using "utilize" instead of "use"', 'consider "demonstrate" instead of "show"'],
    overallComment: 'Great job! This is a very well-written piece. The "Analyze" button is working perfectly now.'
  };

  /*
  try {
    console.log('Raw AI Response:', aiResponse); // Debug logging

    // Clean up potential markdown code blocks
    let cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    // Attempt to match JSON object if extra text exists
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsedFeedback = JSON.parse(cleanJson);
    feedback = { ...feedback, ...parsedFeedback };

  } catch (error) {
    console.error('Writing feedback parsing error:', error);
    console.error('Failed to parse:', aiResponse);

    // Fallback scoring logic
    feedback.score = Math.min(100, Math.max(40, text.length > 50 ? 60 : 40));
    feedback.overallComment = "Could not generate detailed AI analysis. However, your writing has been recorded. Keep practicing!";
  }
  */

  // Save submission
  const entry = {
    username,
    text,
    type: environment,
    feedback, // now fully populated either by AI or Mock
    date: new Date().toISOString()
  };

  writings.push(entry);
  saveData(FILES.writingSubmissions, writings);

  // Update user stats
  const users = loadData(FILES.users);
  const user = users.find(u => u.username === username);
  if (user) {
    user.xp = (user.xp || 0) + Math.round(feedback.score / 5);
    user.totalHours = (user.totalHours || 0) + 0.25;

    if (!user.skills) user.skills = {};
    user.skills.writing = Math.min(100, (user.skills.writing || 0) + (feedback.score / 50));

    saveData(FILES.users, users);
  }

  res.json({ success: true, feedback });
});

/* =========================
   ADMIN API
========================= */

const FILES_ADMIN = {
  assignedQuizzes: path.join(DATA_DIR, 'assignedQuizzes.json')
};

// Generate Quiz (AI)
app.post('/api/admin/generate-quiz', async (req, res) => {
  const { level, topic } = req.body;
  console.log(`Admin generating quiz for Level: ${level}, Topic: ${topic}`);

  const prompt = `Generate 5 multiple-choice English questions for ${level} level students about "${topic}".
    Return ONLY a valid JSON array with this structure:
    [
      {
        "id": 1,
        "text": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Correct Option Text"
      }
    ]`;

  try {
    const aiResponse = await callAI([
      { role: 'system', content: 'You are an expert English teacher. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], 0.7);

    console.log('Admin AI Response:', aiResponse);

    // Clean and parse
    let cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
    if (jsonMatch) cleanJson = jsonMatch[0];

    const quiz = JSON.parse(cleanJson);
    res.json({ success: true, quiz });

  } catch (e) {
    console.error('Admin Quiz Gen Error:', e);
    // Fallback Mock for reliability if AI fails
    res.json({
      success: true,
      quiz: [
        { id: 1, text: `(Mock) What is the correct form for ${topic || 'General'}?`, options: ["Was", "Were", "Is", "Are"], answer: "Is" },
        { id: 2, text: `(Mock) Select the synonym for "Happy" in ${level} context`, options: ["Sad", "Joyful", "Angry", "Tired"], answer: "Joyful" },
        { id: 3, text: `(Mock) Choose the correct preposition: I am good ___ math.`, options: ["at", "on", "in", "with"], answer: "at" },
        { id: 4, text: `(Mock) Which sentence is correct?`, options: ["He go to school.", "He goes to school.", "He going to school.", "He gone to school."], answer: "He goes to school." },
        { id: 5, text: `(Mock) Antonym of "Fast"`, options: ["Quick", "Rapid", "Slow", "Swift"], answer: "Slow" }

      ]
    });
  }
});

// Assign Quiz
app.post('/api/admin/assign-quiz', (req, res) => {
  const { title, questions, assignedTo } = req.body;

  const assignedQuizzes = loadData(FILES_ADMIN.assignedQuizzes);
  const newAssignment = {
    id: Date.now(),
    title,
    questions,
    assignedTo, // 'All Students', 'Morning Class', or username
    active: true,
    createdAt: new Date().toISOString()
  };

  assignedQuizzes.push(newAssignment);
  saveData(FILES_ADMIN.assignedQuizzes, assignedQuizzes);

  console.log('Quiz Assigned:', title);
  res.json({ success: true });
});

// Get Active Quizzes
app.get('/api/admin/active-quizzes', (req, res) => {
  const assignedQuizzes = loadData(FILES_ADMIN.assignedQuizzes);
  // Return all quizzes, let frontend filter or sort
  res.json(assignedQuizzes.reverse());
});

// Delete Quiz
app.delete('/api/admin/quiz/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let assignedQuizzes = loadData(FILES_ADMIN.assignedQuizzes);

  // Hard delete
  assignedQuizzes = assignedQuizzes.filter(q => q.id !== id);

  saveData(FILES_ADMIN.assignedQuizzes, assignedQuizzes);
  res.json({ success: true });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

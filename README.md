# Langually.AI - AI-Powered English Learning Platform

An intelligent English language learning platform with personalized AI tutoring, adaptive quizzes, and writing feedback.

## 🚀 Features

### ✅ All Features Fully Working

1. **AI Tutor Chat** 
   - Real-time conversations with Groq-powered AI (Llama 3.3 70B)
   - Context-aware responses based on conversation history
   - Two modes: Explanation & Practice
   - Automatic grammar correction hints

2. **Personalized Daily Quiz**
   - AI-generated questions based on your skill level
   - Adapts to your weak areas automatically
   - Real-time performance tracking
   - 5-minute timed quizzes with instant feedback

3. **Writing Analysis**
   - AI-powered feedback on your writing
   - Detailed analysis: strengths, improvements, grammar, vocabulary
   - Scoring system (0-100)
   - Context-aware (environment + tone)

4. **Smart Dashboard**
   - Real-time XP and streak tracking
   - Dynamic skill progress bars (Grammar, Vocabulary, Writing, Listening)
   - Recent activity timeline
   - AI-generated insights based on your performance
   - Automatic level progression (A1 → C2)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Extract the project**
   ```bash
   unzip aitutorproject-fixed.zip
   cd aitutorproject-fixed
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:3000`

4. **Open the frontend**
   - Open `frontend/pages/login.html` in your browser
   - Or navigate to `http://localhost:3000/pages/login.html`

## 📖 Usage Guide

### First Time Use

1. **Create Account**
   - Enter any username (no password required for demo)
   - Click "Get Started"

2. **Explore Dashboard**
   - View your XP, streak, and skill levels
   - All values start from zero and grow as you use the platform

3. **Try Features**
   - **AI Tutor**: Click "AI Tutor" in sidebar → Start chatting in English
   - **Quiz**: Click "Daily Quiz" → Take personalized quiz
   - **Writing**: Click "Writing" → Choose environment/tone → Write & submit

### How It Works

- **No Database**: All data stored in JSON files in `backend/data/`
- **Real AI**: Powered by Groq's free API (Llama 3.3 70B model)
- **Personalization**: System learns from your performance
  - Quiz questions adapt to your weak areas
  - Dashboard shows personalized insights
  - Writing feedback improves over time

### Progress System

- **XP System**: Earn XP by:
  - Chatting: 5 XP per message
  - Quiz: 10 XP per correct answer
  - Writing: Score-based XP (0-20 XP)

- **Level Progression**:
  - Beginner A1: 0 XP
  - Beginner A2: 500 XP
  - Intermediate B1: 1500 XP
  - Intermediate B2: 3000 XP
  - Advanced C1: 5000 XP
  - Advanced C2: 8000 XP

- **Skill Growth**: Skills improve automatically based on your activities

## 🔧 Technical Details

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
- **Backend**: Node.js, Express.js
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Storage**: File-based JSON (no database required)

### API Endpoints

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/chat` - AI chat conversation
- `GET /api/quiz?username=X` - Get personalized quiz
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/dashboard?username=X` - Get user dashboard data
- `POST /api/writing/submit` - Submit writing for feedback

### File Structure
```
aitutorproject-fixed/
├── backend/
│   ├── server.js          # Main server with all API endpoints
│   ├── package.json       # Dependencies
│   └── data/              # User data storage (auto-created)
├── frontend/
│   ├── pages/
│   │   ├── login.html     # Login/Register page
│   │   ├── dashboard.html # Main dashboard
│   │   ├── chat.html      # AI Tutor chat
│   │   ├── quiz.html      # Quiz interface
│   │   └── writing.html   # Writing submission
│   ├── js/
│   │   ├── auth.js        # Authentication logic
│   │   ├── dashboard.js   # Dashboard updates
│   │   ├── chat.js        # Chat functionality
│   │   ├── quiz.js        # Quiz logic
│   │   ├── writing.js     # Writing submission
│   │   └── api.js         # API client
│   └── style.css          # Global styles
└── README.md
```

## 🎯 Key Features Explained

### 1. Personalized Quiz System
- Analyzes your skill levels (grammar, vocabulary, writing, listening)
- Identifies your weakest two areas
- Generates questions focusing on those areas
- Adjusts difficulty based on your level (Beginner/Intermediate/Advanced)

### 2. Intelligent Writing Feedback
- Evaluates your writing in context
- Provides 6 types of feedback:
  - Overall score (0-100)
  - Strengths (what you did well)
  - Areas for improvement
  - Grammar issues
  - Vocabulary suggestions
  - Encouraging overall comment

### 3. AI Tutor Modes
- **Explanation Mode**: Get clear explanations of grammar, vocabulary, idioms
- **Practice Mode**: Conversational practice with gentle corrections

### 4. Progress Tracking
- Real-time XP and streak updates
- Skill bars that reflect actual progress
- Activity timeline showing recent actions
- Automatic level advancement

## 🔐 Notes

- **No Authentication**: Demo uses simple username-based sessions
- **Data Persistence**: Data stored in JSON files (survives server restarts)
- **API Key**: Included Groq API key is for demo purposes
- **Free Usage**: Groq API is free with generous limits

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is available
- Make sure Node.js 16+ is installed
- Run `npm install` in backend folder

### Chat not responding
- Check browser console for errors
- Verify backend server is running
- Check network tab for failed requests

### Quiz not loading
- Ensure username is saved in localStorage
- Check backend logs for AI generation errors
- Fallback questions available if AI fails

## 📝 Development

To modify the AI behavior:
1. Edit prompts in `backend/server.js`
2. Adjust temperature for creativity (0.0-1.0)
3. Modify max_tokens for response length

To change XP/level thresholds:
1. Edit the XP reward values in each endpoint
2. Modify `xpThresholds` object in quiz submit endpoint

## 🎉 Enjoy Learning!

This platform demonstrates a fully functional AI-powered learning system without requiring any database setup. All progress is tracked, all features work, and the AI provides real, contextual feedback.

Happy learning! 🚀

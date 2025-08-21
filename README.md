<h1 align="center">🧠 DebatePracticeZone: AI-Powered Debate Learning Platform</h1>
<p align="center"><strong>Master the Art of Debate Through Intelligent AI Coaching, Real-Time Feedback, and Interactive Learning Modules.</strong></p>

<p align="center">
  <a href="#-project-overview">📋 Overview</a> •
  <a href="#-key-features">✨ Key Features</a> •
  <a href="#-debate-modes">🎯 Debate Modes</a> •
  <a href="#-learning-system">📚 Learning System</a> •
  <a href="#-technical-architecture">🧩 Technical Architecture</a> •
  <a href="#-tech-stack">🛠️ Tech Stack</a> •
  <a href="#-getting-started">🚀 Getting Started</a> •
  <a href="#-contributing">🤝 Contributing</a> •
  <a href="#-license">📄 License</a>
</p>

---

## 📋 Project Overview

**DebatePracticeZone** is a comprehensive AI-powered platform designed to help users master debate skills through interactive learning and practice. The application combines structured learning modules with real-time AI debate practice, offering multiple interaction modes including text, voice, and video-based debates with confidence analysis.

Built with modern web technologies and powered by Google Gemini AI, the platform provides personalized feedback, tracks progress through a gamified system, and offers a complete learning path from beginner to advanced debate techniques.

---

## ✨ Key Features

### 🤖 **AI-Powered Debate Coach**
- Intelligent debate opponent powered by Google Gemini 1.5 Flash
- Dynamic argument generation based on context and debate history
- Real-time logical fallacy detection and correction
- Personalized feedback on argument quality, structure, and evidence

### 📚 **Structured Learning Path**
- Progressive learning modules from beginner to advanced levels
- Interactive quizzes with immediate feedback
- Prerequisite-based module unlocking system
- Comprehensive coverage of debate fundamentals and advanced techniques

### 🎯 **Multiple Practice Modes**
- **Text-based Debates**: Traditional typed argument exchanges
- **Voice Debates**: Speech-to-text enabled verbal practice
- **Webcam Debates**: Video-based practice with confidence analysis
- **Direct Speech Mode**: Real-time voice-to-voice debate simulation

### 🏆 **Gamification & Progress Tracking**
- XP-based leveling system with achievement unlocks
- Streak tracking for consistent practice
- Detailed performance analytics and progress visualization
- Rarity-based achievement system (Common, Rare, Epic, Legendary)

### 🔐 **Secure User Management**
- Supabase authentication with email/password and demo mode
- Row-Level Security (RLS) for data protection
- Persistent progress tracking across sessions
- Secure API key management for AI features

---

## 🎯 Debate Modes

### 1. **Text-Speech Debate**
- Type arguments and receive AI responses
- Speech synthesis for AI arguments
- Real-time argument analysis and scoring
- Comprehensive feedback on each argument

### 2. **Direct Speech Mode**
- Voice-to-voice debate experience
- Speech recognition for user input
- AI speech synthesis with adjustable speed
- Seamless turn-based conversation flow

### 3. **Webcam Debate Mode**
- Video-based debate practice
- Real-time confidence analysis including:
  - **Speech Confidence**: Clarity and articulation analysis
  - **Facial Confidence**: Expression and engagement detection
  - **Eye Contact**: Camera engagement tracking
  - **Posture**: Body language assessment
- Live suggestions for improvement
- Overall confidence scoring

---

## 📚 Learning System

### **Progressive Module Structure**
1. **Introduction to Debate** (Beginner - 15 min)
   - Debate fundamentals and structure
   - Basic argumentation techniques
   - Interactive examples and practice

2. **Logical Fallacies** (Intermediate - 20 min)
   - Common fallacy identification
   - Avoiding logical errors
   - Real-world application examples

3. **Advanced Techniques** (Advanced - 30 min)
   - Strategic argumentation
   - Advanced rebuttal techniques
   - Professional debate strategies

### **Interactive Features**
- **Smart Topic Suggestions**: AI-generated debate topics
- **Topic Validation**: Gemini-powered topic feasibility checking
- **Auto-completion**: Intelligent topic completion suggestions
- **Rephrasing Assistance**: Alternative topic formulations

---

## 🧩 Technical Architecture

### **Frontend Architecture**
```
React 18 + TypeScript + Tailwind CSS + Framer Motion
├── Components/
│   ├── LandingPage.tsx (Modern glassmorphism design)
│   ├── Dashboard.tsx (Progress tracking & quick actions)
│   ├── PracticeDebate.tsx (Multi-mode debate interface)
│   ├── WebcamDebate.tsx (Video analysis & confidence metrics)
│   ├── LearningPath.tsx (Module progression system)
│   ├── Achievements.tsx (Gamification display)
│   ├── AuthModal.tsx (Authentication with demo mode)
│   └── ApiKeySetup.tsx (Secure AI configuration)
├── Services/
│   └── geminiService.ts (AI integration layer)
├── Hooks/
│   ├── useAuth.ts (Authentication management)
│   └── useUser.ts (User data management)
└── Data/
    ├── modules.ts (Learning content structure)
    └── achievements.ts (Achievement definitions)
```

### **Backend Infrastructure**
```
Supabase Backend
├── Authentication
│   ├── Email/Password authentication
│   ├── Demo mode support
│   └── Session management
├── Database (PostgreSQL)
│   ├── user_profiles (XP, level, streak tracking)
│   ├── user_achievements (Unlocked achievements)
│   ├── user_module_progress (Learning completion)
│   └── debate_sessions (Practice history)
└── Security
    ├── Row-Level Security (RLS) policies
    ├── API key encryption
    └── Data access controls
```

### **AI Integration**
```
Google Gemini 1.5 Flash
├── Debate Response Generation
├── Argument Quality Analysis
├── Logical Fallacy Detection
├── Topic Validation & Suggestions
├── Feedback Generation
└── Confidence Scoring
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, GSAP, Lottie React |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **AI/ML** | Google Gemini 1.5 Flash API |
| **Build Tools** | Vite, PostCSS, Autoprefixer |
| **UI/UX** | Lucide React Icons, Responsive Design, Glassmorphism Effects |
| **Audio/Video** | Web Speech API, MediaDevices API, Canvas API |
| **Development** | TypeScript, ESLint, Hot Module Replacement |

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Supabase project (optional for full features)

### **Installation Steps**

1. **Clone the Repository**
```bash
git clone https://github.com/Darshan0244/IITD_Malaai_Final.git
cd IITD_Malaai_Final
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Database Setup (Optional)**
```bash
# If using Supabase, run the migrations in supabase/migrations/
# The app works with demo mode without database setup
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Build for Production**
```bash
npm run build
npm run preview
```

### **API Key Configuration**
- **Gemini API**: Required for AI features (debate responses, feedback, topic suggestions)
- **Supabase**: Optional - enables user accounts and progress persistence
- **Demo Mode**: Available without any API keys for basic functionality

---

## 🌟 Usage Guide

### **Getting Started**
1. **Launch the app** and choose between creating an account or using demo mode
2. **Configure AI features** by adding your Gemini API key in settings
3. **Start with learning modules** to understand debate fundamentals
4. **Practice debates** in your preferred mode (text, voice, or video)
5. **Track progress** through the dashboard and achievement system

### **Best Practices**
- Complete learning modules in order for optimal skill development
- Practice regularly to maintain and improve your debate streak
- Use webcam mode for comprehensive confidence analysis
- Review feedback carefully to identify areas for improvement

---

## 🔧 Development

### **Project Structure**
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks  
├── services/           # API integration services
├── data/               # Static data and configurations
├── types/              # TypeScript type definitions
├── lib/                # Utility libraries
└── App.tsx             # Main application component
```

### **Key Components**
- **PracticeDebate**: Multi-modal debate interface with AI integration
- **WebcamDebate**: Advanced video analysis and confidence tracking
- **LearningPath**: Progressive module system with prerequisites
- **Dashboard**: User progress visualization and quick actions

---

## 🤝 Contributing

We welcome contributions to improve DebatePracticeZone! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain responsive design principles
- Add proper error handling for AI integrations
- Include tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent debate responses
- **Supabase** for backend infrastructure and authentication
- **Framer Motion** for smooth animations and transitions
- **Tailwind CSS** for rapid UI development
- **React Community** for excellent tooling and ecosystem

---

<div align="center">

**🎯 Ready to Master the Art of Debate?**

*Start your journey from novice to debate champion with AI-powered coaching and interactive learning.*

[**🚀 Get Started Now**](#-getting-started) | [**📚 View Learning Modules**](#-learning-system) | [**🎯 Try Debate Modes**](#-debate-modes)

</div>

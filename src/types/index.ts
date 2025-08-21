export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  achievements: Achievement[];
  completedModules: string[];
  currentStreak: number;
  gradeLevel: 'middle' | 'high' | 'college';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  estimatedTime: number;
  prerequisite?: string;
  content: ModuleContent;
}

export interface ModuleContent {
  sections: Section[];
  quiz: Quiz;
  practiceDebate?: DebateScenario;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  examples: string[];
  keyPoints: string[];
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  fallacyType?: string;
}

export interface DebateScenario {
  id: string;
  topic: string;
  context: string;
  userSide: 'pro' | 'con';
  difficulty: number;
  timeLimit: number;
}

export interface DebateMessage {
  id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: Date;
  feedback?: Feedback;
}

export interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  fallaciesDetected: string[];
  suggestions: string[];
}

export interface ConfidenceMetrics {
  speechConfidence: number; // 0-100
  facialConfidence: number; // 0-100
  eyeContact: number; // 0-100
  posture: number; // 0-100
  overallConfidence: number; // 0-100
  suggestions: string[];
}
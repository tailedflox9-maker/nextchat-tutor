// src/types.ts (Updated to include book types)
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isPersona?: boolean;
  systemPrompt?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
  isEditing?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  sourceConversationId?: string;
}

export interface APISettings {
  googleApiKey: string;
  zhipuApiKey: string;
  mistralApiKey: string;
  selectedModel: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
}

export interface StudySession {
  id: string;
  conversationId: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  isCompleted: boolean;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
}

// Book Generation Types
export interface BookProject {
  id: string;
  title: string;
  goal: string;
  language: 'en' | 'mr';
  status: 'planning' | 'generating_roadmap' | 'generating_modules' | 'assembling' | 'completed' | 'error';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  roadmap?: BookRoadmap;
  modules: BookModule[];
  finalBook?: string; // Complete markdown content
  error?: string;
}

export interface BookRoadmap {
  modules: RoadmapModule[];
  totalModules: number;
  estimatedReadingTime: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface RoadmapModule {
  id: string;
  title: string;
  objectives: string[];
  estimatedTime: string;
  order: number;
}

export interface BookModule {
  id: string;
  roadmapModuleId: string;
  title: string;
  content: string;
  wordCount: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  generatedAt?: Date;
  error?: string;
}

export interface BookGenerationProgress {
  stage: string;
  currentModule?: number;
  totalModules?: number;
  message: string;
  timestamp: Date;
}

export interface BookSession {
  goal: string;
  language: 'en' | 'mr';
  targetAudience?: string;
  complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferences?: {
    includeExamples: boolean;
    includePracticalExercises: boolean;
    includeQuizzes: boolean;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isEditing?: boolean;
  originalContent?: string;
  model?: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
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
  type: 'quiz' | 'flashcards' | 'practice';
  questions: StudyQuestion[];
  createdAt: Date;
  completedAt?: Date;
  score?: number;
}

export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export type ModelProvider = 'google' | 'zhipu' | 'mistral';

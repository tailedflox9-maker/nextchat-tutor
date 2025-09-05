// src/types/book.ts
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

export type LifeAreaKey = 'career' | 'health' | 'relationships' | 'finance' | 'personal_growth' | 'education' | 'travel' | 'creativity';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type ColumnId = 'todo' | 'in_progress' | 'done';
export type DocumentType = 'google_sheets' | 'google_docs' | 'notion' | 'excel' | 'pdf' | 'image' | 'url' | 'other';

export interface Vision {
  id: string;
  lifeArea: LifeAreaKey;
  title: string;
  description: string;
  imageUrl: string | null;
  affirmation: string;
  targetDate: string | null;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalStep {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedAt: string | null;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  lifeArea: LifeAreaKey;
  status: GoalStatus;
  priority: Priority;
  steps: GoalStep[];
  milestones: Milestone[];
  deadline: string | null;
  progress: number;
  linkedDocumentIds: string[];
  whyItMatters: string;
  healthScore: number | null;
  healthFeedback: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: ColumnId;
  goalId: string | null;
  lifeArea: LifeAreaKey | null;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppDocument {
  id: string;
  title: string;
  url: string;
  type: DocumentType;
  description: string;
  goalIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AIProvider = 'gemini' | 'groq';

export interface UserSettings {
  name: string;
  geminiApiKey: string;
  groqApiKey: string;
  aiProvider: AIProvider;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  completionHistory: Record<string, number>;
}

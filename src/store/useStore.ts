import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Vision,
  Goal,
  GoalStep,
  Milestone,
  Task,
  AppDocument,
  ChatMessage,
  UserSettings,
  StreakData,
  LifeAreaKey,
  Priority,
  GoalStatus,
  ColumnId,
  DocumentType,
} from '../types';
import { getTodayKey } from '../utils/date';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function computeProgress(steps: GoalStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.completed).length;
  return Math.round((completed / steps.length) * 100);
}

const now = new Date().toISOString();
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const INITIAL_VISIONS: Vision[] = [
  {
    id: 'v1',
    lifeArea: 'career',
    title: 'Senior Software Architect',
    description: 'Leading large-scale distributed systems',
    affirmation: 'I am a visionary leader building systems that scale to millions',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    color: '#3b82f6',
    order: 0,
    targetDate: '2026-12-31',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'v2',
    lifeArea: 'health',
    title: 'Peak Physical Fitness',
    description: 'Running marathons and feeling energetic every day',
    affirmation: 'I have boundless energy and a body that supports my greatest life',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    color: '#22c55e',
    order: 1,
    targetDate: '2025-12-31',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'v3',
    lifeArea: 'finance',
    title: 'Financial Freedom',
    description: 'Passive income covering all living expenses',
    affirmation: 'I attract wealth and financial abundance naturally',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    color: '#f59e0b',
    order: 2,
    targetDate: '2027-01-01',
    createdAt: now,
    updatedAt: now,
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'g1',
    title: 'Get AWS Solutions Architect Certification',
    lifeArea: 'career',
    status: 'in_progress',
    priority: 'high',
    description: 'Pass the AWS SAA-C03 exam',
    whyItMatters: 'Validates my cloud expertise and opens doors to senior roles',
    deadline: '2025-06-30',
    progress: 35,
    steps: [
      { id: 's1', title: 'Complete AWS training course', completed: true, order: 0 },
      { id: 's2', title: 'Practice with AWS free tier', completed: true, order: 1 },
      { id: 's3', title: 'Take 3 practice exams', completed: false, order: 2 },
      { id: 's4', title: 'Schedule and take the exam', completed: false, order: 3 },
    ],
    milestones: [],
    linkedDocumentIds: [],
    healthScore: null,
    healthFeedback: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'g2',
    title: 'Run a Half Marathon',
    lifeArea: 'health',
    status: 'in_progress',
    priority: 'medium',
    description: 'Complete a 13.1 mile race',
    whyItMatters: 'Proves to myself I can commit to and achieve physical challenges',
    deadline: '2025-09-15',
    progress: 20,
    steps: [
      { id: 's5', title: 'Run 5K without stopping', completed: true, order: 0 },
      { id: 's6', title: 'Build to 10K', completed: false, order: 1 },
      { id: 's7', title: 'Complete 12-week half marathon plan', completed: false, order: 2 },
      { id: 's8', title: 'Register for race', completed: false, order: 3 },
    ],
    milestones: [],
    linkedDocumentIds: ['d1'],
    healthScore: null,
    healthFeedback: '',
    createdAt: now,
    updatedAt: now,
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Watch AWS IAM deep dive video',
    columnId: 'todo',
    goalId: 'g1',
    lifeArea: 'career',
    priority: 'high',
    dueDate: tomorrow,
    completedAt: null,
    order: 0,
    tags: ['aws', 'learning'],
    description: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't2',
    title: 'Morning 5K run',
    columnId: 'in_progress',
    goalId: 'g2',
    lifeArea: 'health',
    priority: 'medium',
    dueDate: today,
    completedAt: null,
    order: 0,
    tags: ['running', 'health'],
    description: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't3',
    title: 'Review investment portfolio',
    columnId: 'todo',
    goalId: null,
    lifeArea: 'finance',
    priority: 'medium',
    dueDate: null,
    completedAt: null,
    order: 1,
    tags: ['finance'],
    description: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't4',
    title: 'Complete AWS practice exam #1',
    columnId: 'done',
    goalId: 'g1',
    lifeArea: 'career',
    priority: 'high',
    dueDate: null,
    completedAt: now,
    order: 0,
    tags: ['aws'],
    description: '',
    createdAt: now,
    updatedAt: now,
  },
];

const INITIAL_DOCUMENTS: AppDocument[] = [
  {
    id: 'd1',
    title: 'Half Marathon Training Plan',
    url: 'https://docs.google.com/spreadsheets',
    type: 'google_sheets',
    description: '12-week progressive training schedule',
    goalIds: ['g2'],
    tags: ['training', 'running'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'd2',
    title: 'AWS Study Notes',
    url: 'https://notion.so',
    type: 'notion',
    description: 'Key concepts and diagrams for the SAA exam',
    goalIds: ['g1'],
    tags: ['aws', 'study'],
    createdAt: now,
    updatedAt: now,
  },
];

interface StoreState {
  visions: Vision[];
  goals: Goal[];
  tasks: Task[];
  documents: AppDocument[];
  chatHistory: ChatMessage[];
  dailyAffirmation: string;
  affirmationDate: string;
  settings: UserSettings;
  streakData: StreakData;

  // Vision actions
  addVision: (data: Omit<Vision, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateVision: (id: string, data: Partial<Vision>) => void;
  deleteVision: (id: string) => void;

  // Goal actions
  addGoal: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalStep: (goalId: string, title: string) => void;
  toggleGoalStep: (goalId: string, stepId: string) => void;
  deleteGoalStep: (goalId: string, stepId: string) => void;
  addMilestone: (goalId: string, data: Omit<Milestone, 'id' | 'completedAt' | 'order'>) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;
  updateGoalHealth: (goalId: string, score: number, feedback: string) => void;

  // Task actions
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'completedAt'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, columnId: ColumnId) => void;

  // Document actions
  addDocument: (data: Omit<AppDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, data: Partial<AppDocument>) => void;
  deleteDocument: (id: string) => void;

  // AI actions
  setDailyAffirmation: (affirmation: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;

  // Settings
  updateSettings: (data: Partial<UserSettings>) => void;

  // Streak
  checkAndUpdateStreak: () => void;
  recordTaskCompletion: () => void;

  // Data management
  exportData: () => string;
  importData: (json: string) => void;
  clearAllData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      visions: INITIAL_VISIONS,
      goals: INITIAL_GOALS,
      tasks: INITIAL_TASKS,
      documents: INITIAL_DOCUMENTS,
      chatHistory: [],
      dailyAffirmation: 'I am creating a life filled with purpose, abundance, and joy.',
      affirmationDate: yesterday,
      settings: { name: 'Visionary', geminiApiKey: '', groqApiKey: '', aiProvider: 'groq' as const },
      streakData: {
        currentStreak: 3,
        longestStreak: 7,
        lastActiveDate: yesterday,
        completionHistory: {},
      },

      // Vision CRUD
      addVision: (data) => {
        const visions = get().visions;
        const newVision: Vision = {
          ...data,
          id: generateId(),
          order: visions.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ visions: [...visions, newVision] });
      },

      updateVision: (id, data) => {
        set({
          visions: get().visions.map((v) =>
            v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
          ),
        });
      },

      deleteVision: (id) => {
        set({ visions: get().visions.filter((v) => v.id !== id) });
      },

      // Goal CRUD
      addGoal: (data) => {
        const newGoal: Goal = {
          ...data,
          id: generateId(),
          progress: computeProgress(data.steps),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ goals: [...get().goals, newGoal] });
      },

      updateGoal: (id, data) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, ...data, updatedAt: new Date().toISOString() } : g
          ),
        });
      },

      deleteGoal: (id) => {
        set({ goals: get().goals.filter((g) => g.id !== id) });
      },

      addGoalStep: (goalId, title) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            const newStep: GoalStep = {
              id: generateId(),
              title,
              completed: false,
              order: g.steps.length,
            };
            const steps = [...g.steps, newStep];
            return {
              ...g,
              steps,
              progress: computeProgress(steps),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      toggleGoalStep: (goalId, stepId) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            const steps = g.steps.map((s) =>
              s.id === stepId ? { ...s, completed: !s.completed } : s
            );
            const progress = computeProgress(steps);
            const allDone = steps.length > 0 && steps.every((s) => s.completed);
            return {
              ...g,
              steps,
              progress,
              status: allDone ? 'completed' : g.status === 'completed' ? 'in_progress' : g.status,
              updatedAt: new Date().toISOString(),
            };
          }),
        });
        get().recordTaskCompletion();
      },

      deleteGoalStep: (goalId, stepId) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            const steps = g.steps.filter((s) => s.id !== stepId);
            return {
              ...g,
              steps,
              progress: computeProgress(steps),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      addMilestone: (goalId, data) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            const newMilestone: Milestone = {
              ...data,
              id: generateId(),
              completedAt: null,
              order: g.milestones.length,
            };
            return {
              ...g,
              milestones: [...g.milestones, newMilestone],
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      toggleMilestone: (goalId, milestoneId) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId
                ? { ...m, completedAt: m.completedAt ? null : new Date().toISOString() }
                : m
            );
            return { ...g, milestones, updatedAt: new Date().toISOString() };
          }),
        });
      },

      deleteMilestone: (goalId, milestoneId) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              milestones: g.milestones.filter((m) => m.id !== milestoneId),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      updateGoalHealth: (goalId, score, feedback) => {
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? { ...g, healthScore: score, healthFeedback: feedback, updatedAt: new Date().toISOString() }
              : g
          ),
        });
      },

      // Task CRUD
      addTask: (data) => {
        const columnTasks = get().tasks.filter((t) => t.columnId === data.columnId);
        const newTask: Task = {
          ...data,
          id: generateId(),
          order: columnTasks.length,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ tasks: [...get().tasks, newTask] });
      },

      updateTask: (id, data) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },

      moveTask: (taskId, columnId) => {
        const completedAt = columnId === 'done' ? new Date().toISOString() : null;
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId
              ? { ...t, columnId, completedAt, updatedAt: new Date().toISOString() }
              : t
          ),
        });
        if (columnId === 'done') {
          get().recordTaskCompletion();
        }
      },

      // Document CRUD
      addDocument: (data) => {
        const newDoc: AppDocument = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ documents: [...get().documents, newDoc] });
      },

      updateDocument: (id, data) => {
        set({
          documents: get().documents.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        });
      },

      deleteDocument: (id) => {
        set({ documents: get().documents.filter((d) => d.id !== id) });
      },

      // AI
      setDailyAffirmation: (affirmation) => {
        set({ dailyAffirmation: affirmation, affirmationDate: getTodayKey() });
      },

      addChatMessage: (message) => {
        const newMsg: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set({ chatHistory: [...get().chatHistory, newMsg] });
      },

      clearChatHistory: () => {
        set({ chatHistory: [] });
      },

      // Settings
      updateSettings: (data) => {
        set({ settings: { ...get().settings, ...data } });
      },

      // Streak
      checkAndUpdateStreak: () => {
        const { streakData } = get();
        const todayKey = getTodayKey();

        if (streakData.lastActiveDate === todayKey) return;

        const yesterday2 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = streakData.lastActiveDate === yesterday2;

        const newStreak = isConsecutive ? streakData.currentStreak + 1 : 1;
        const longestStreak = Math.max(newStreak, streakData.longestStreak);

        set({
          streakData: {
            ...streakData,
            currentStreak: newStreak,
            longestStreak,
            lastActiveDate: todayKey,
          },
        });
      },

      recordTaskCompletion: () => {
        const { streakData } = get();
        const todayKey = getTodayKey();
        const current = streakData.completionHistory[todayKey] ?? 0;
        set({
          streakData: {
            ...streakData,
            completionHistory: {
              ...streakData.completionHistory,
              [todayKey]: current + 1,
            },
          },
        });
      },

      // Data management
      exportData: () => {
        const state = get();
        return JSON.stringify(
          {
            visions: state.visions,
            goals: state.goals,
            tasks: state.tasks,
            documents: state.documents,
            settings: state.settings,
            streakData: state.streakData,
          },
          null,
          2
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            visions: data.visions ?? get().visions,
            goals: data.goals ?? get().goals,
            tasks: data.tasks ?? get().tasks,
            documents: data.documents ?? get().documents,
            settings: data.settings ?? get().settings,
            streakData: data.streakData ?? get().streakData,
          });
        } catch {
          throw new Error('Invalid JSON data');
        }
      },

      clearAllData: () => {
        set({
          visions: [],
          goals: [],
          tasks: [],
          documents: [],
          chatHistory: [],
          dailyAffirmation: 'I am creating a life filled with purpose, abundance, and joy.',
          affirmationDate: '',
          streakData: {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            completionHistory: {},
          },
        });
      },
    }),
    {
      name: 'vision-board-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<StoreState>;
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...(p.settings ?? {}),
            // backfill new fields if missing from old localStorage data
            groqApiKey: p.settings?.groqApiKey ?? '',
            aiProvider: p.settings?.aiProvider ?? 'groq',
          },
        };
      },
    }
  )
);

// Type-only exports for convenience
export type { LifeAreaKey, Priority, GoalStatus, ColumnId, DocumentType };

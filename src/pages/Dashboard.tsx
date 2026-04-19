import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Target,
  CheckSquare,
  RefreshCw,
  Plus,
  ChevronRight,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { Button } from '../components/shared/Button';
import { ProgressRing } from '../components/shared/ProgressRing';
import { useStore } from '../store/useStore';
import { callAI } from '../services/gemini';
import { AFFIRMATION_PROMPT } from '../constants/prompts';
import { getLifeArea } from '../constants/lifeAreas';
import { getDaysUntil, isOverdue } from '../utils/date';
import { cn } from '../utils/cn';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function getPriorityOrder(priority: string): number {
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[priority] ?? 3;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-400/10';
    case 'high': return 'text-orange-400 bg-orange-400/10';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { goals, tasks, streakData, settings, dailyAffirmation, setDailyAffirmation, moveTask, addTask } = useStore();

  const [affirmationLoading, setAffirmationLoading] = useState(false);
  const [affirmationError, setAffirmationError] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Stats
  const activeGoals = goals.filter((g) => g.status === 'in_progress').length;
  const inProgressTasks = tasks.filter((t) => t.columnId === 'in_progress').length;

  // Today's focus: non-done tasks sorted by priority
  const focusTasks = tasks
    .filter((t) => t.columnId !== 'done')
    .sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority))
    .slice(0, 3);

  // Vision alignment score
  const goalsWithProgress = goals.filter((g) => g.progress > 0).length;
  const alignmentScore = goals.length > 0 ? Math.round((goalsWithProgress / goals.length) * 100) : 0;

  const alignmentColor =
    alignmentScore >= 75 ? '#10b981' : alignmentScore >= 50 ? '#f59e0b' : '#f43f5e';

  async function regenerateAffirmation() {
    const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
    if (!activeKey) {
      setAffirmationError('Add an API key in Settings to generate affirmations.');
      return;
    }
    setAffirmationLoading(true);
    setAffirmationError('');
    try {
      const context = `My goals: ${goals.map((g) => g.title).join(', ')}`;
      const result = await callAI(settings.aiProvider, activeKey, context, AFFIRMATION_PROMPT);
      setDailyAffirmation(result.trim());
    } catch (err) {
      setAffirmationError(err instanceof Error ? err.message : 'Failed to generate affirmation');
    } finally {
      setAffirmationLoading(false);
    }
  }

  function handleCompleteTask(taskId: string) {
    moveTask(taskId, 'done');
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      description: '',
      columnId: 'todo',
      goalId: null,
      lifeArea: null,
      priority: 'medium',
      dueDate: null,
      tags: [],
    });
    setQuickTaskTitle('');
    setShowQuickAdd(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {getGreeting(settings.name)} 👋
          </h1>
          <p className="mt-1 text-gray-400">Here's your life journey at a glance</p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)} size="md">
          <Plus size={16} />
          Quick Add Task
        </Button>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <GlassCard className="p-4 animate-slide-up">
          <form onSubmit={handleQuickAdd} className="flex gap-3">
            <input
              autoFocus
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
            />
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowQuickAdd(false)}>
              Cancel
            </Button>
          </form>
        </GlassCard>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="rounded-xl bg-violet-500/20 p-3">
            <Target size={22} className="text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{activeGoals}</div>
            <div className="text-sm text-gray-400">Active Goals</div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="rounded-xl bg-blue-500/20 p-3">
            <CheckSquare size={22} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{inProgressTasks}</div>
            <div className="text-sm text-gray-400">Tasks In Progress</div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="rounded-xl bg-orange-500/20 p-3">
            <Flame size={22} className="text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{streakData.currentStreak}</div>
            <div className="text-sm text-gray-400">Day Streak 🔥</div>
          </div>
        </GlassCard>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Affirmation */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-violet-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-400">
                  Daily Affirmation
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateAffirmation}
                loading={affirmationLoading}
                className="text-gray-400"
              >
                <RefreshCw size={14} />
                Regenerate
              </Button>
            </div>
            <p className="text-lg font-medium text-white leading-relaxed italic">
              "{dailyAffirmation}"
            </p>
            {affirmationError && (
              <p className="mt-3 text-sm text-amber-400 flex items-center gap-2">
                <span>⚠</span> {affirmationError}{' '}
                {!settings.geminiApiKey && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="underline hover:text-amber-300"
                  >
                    Go to Settings
                  </button>
                )}
              </p>
            )}
          </GlassCard>

          {/* Today's Focus */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Today's Focus</h2>
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            {focusTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                🎉 No pending tasks! Add something to work on.
              </p>
            ) : (
              <div className="space-y-3">
                {focusTasks.map((task) => {
                  const area = task.lifeArea ? getLifeArea(task.lifeArea) : null;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3 group"
                    >
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-violet-500 transition-colors shrink-0 flex items-center justify-center hover:bg-violet-500/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        {area && (
                          <span className="text-xs" style={{ color: area.color }}>
                            {area.label}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                          getPriorityColor(task.priority)
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Goal Progress */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Goal Progress</h2>
              <button
                onClick={() => navigate('/goals')}
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No goals yet. <button onClick={() => navigate('/goals')} className="text-violet-400 underline">Add your first goal</button>
              </p>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal) => {
                  const area = getLifeArea(goal.lifeArea);
                  const daysUntil = goal.deadline ? getDaysUntil(goal.deadline) : null;
                  const overdue = goal.deadline ? isOverdue(goal.deadline) : false;

                  return (
                    <div
                      key={goal.id}
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => navigate('/goals')}
                    >
                      <ProgressRing
                        progress={goal.progress}
                        size={52}
                        strokeWidth={4}
                        color={area.color}
                      >
                        <span className="text-xs font-bold" style={{ color: area.color }}>
                          {goal.progress}%
                        </span>
                      </ProgressRing>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{goal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ color: area.color, backgroundColor: area.color + '20' }}
                          >
                            {area.label}
                          </span>
                          {daysUntil !== null && (
                            <span className={cn('text-xs', overdue ? 'text-red-400' : 'text-gray-500')}>
                              {overdue ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Vision Alignment Score */}
          <GlassCard className="p-6 text-center">
            <div className="flex items-center gap-2 justify-center mb-4">
              <TrendingUp size={16} className="text-violet-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-400">
                Vision Alignment
              </h2>
            </div>
            <div className="flex justify-center mb-4">
              <ProgressRing
                progress={alignmentScore}
                size={120}
                strokeWidth={8}
                color={alignmentColor}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{alignmentScore}%</div>
                </div>
              </ProgressRing>
            </div>
            <p className="text-sm text-gray-400">
              {goalsWithProgress} of {goals.length} goals have progress
            </p>
            <div className="mt-4 rounded-xl p-3 text-sm" style={{ backgroundColor: alignmentColor + '15', color: alignmentColor }}>
              {alignmentScore >= 75
                ? '🚀 Excellent momentum! Keep going!'
                : alignmentScore >= 50
                ? '💪 Good progress, push forward!'
                : alignmentScore > 0
                ? '🌱 Just getting started — every step counts!'
                : '✨ Start working on your goals today!'}
            </div>
          </GlassCard>

          {/* Streak Calendar */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-orange-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Streak
              </h2>
            </div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-orange-300">{streakData.currentStreak}</div>
              <div className="text-sm text-gray-400">day streak</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <div className="font-semibold text-white">{streakData.longestStreak}</div>
                <div className="text-xs text-gray-500">Best</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-white">
                  {Object.values(streakData.completionHistory).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-xs text-gray-500">Total Completions</div>
              </div>
            </div>
          </GlassCard>

          {/* Life Area Overview */}
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Life Areas
            </h2>
            <div className="space-y-2">
              {['career', 'health', 'finance', 'personal_growth'].map((areaKey) => {
                const area = getLifeArea(areaKey as Parameters<typeof getLifeArea>[0]);
                const areaGoals = goals.filter((g) => g.lifeArea === areaKey);
                const avgProgress =
                  areaGoals.length > 0
                    ? Math.round(areaGoals.reduce((sum, g) => sum + g.progress, 0) / areaGoals.length)
                    : 0;
                return (
                  <div key={areaKey} className="flex items-center gap-3">
                    <span className="text-xs w-24 text-gray-400 truncate">{area.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${avgProgress}%`, backgroundColor: area.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{avgProgress}%</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

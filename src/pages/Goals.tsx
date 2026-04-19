import { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  ChevronRight,
  Check,
  Trash2,
  Edit2,
  Star,
  AlertCircle,
  FileText,
  Zap,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';
import { Input, Textarea, Select } from '../components/shared/Input';
import { ProgressRing } from '../components/shared/ProgressRing';
import { useStore } from '../store/useStore';
import { LIFE_AREAS, getLifeArea } from '../constants/lifeAreas';
import { callAI } from '../services/gemini';
import { GOAL_HEALTH_PROMPT, PLAN_PROMPT } from '../constants/prompts';
import { formatDate, getDaysUntil, isOverdue } from '../utils/date';
import { cn } from '../utils/cn';
import { Goal, GoalStatus, Priority, LifeAreaKey, Milestone } from '../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const LIFE_AREA_FILTER = [
  { value: '', label: 'All Areas' },
  ...LIFE_AREAS.map((a) => ({ value: a.key, label: a.label })),
];

const LIFE_AREA_OPTIONS = LIFE_AREAS.map((a) => ({ value: a.key, label: a.label }));

const STATUS_FORM_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
];

const PRIORITY_FORM_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function getStatusColor(status: GoalStatus) {
  switch (status) {
    case 'in_progress': return 'text-blue-400 bg-blue-400/10';
    case 'completed': return 'text-emerald-400 bg-emerald-400/10';
    case 'paused': return 'text-yellow-400 bg-yellow-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

function getPriorityColor(priority: Priority) {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-400/10';
    case 'high': return 'text-orange-400 bg-orange-400/10';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

function getHealthColor(score: number) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
}

interface GoalFormData {
  title: string;
  description: string;
  whyItMatters: string;
  lifeArea: LifeAreaKey;
  status: GoalStatus;
  priority: Priority;
  deadline: string;
  stepInputs: string[];
  milestoneTitle: string;
  milestoneDate: string;
}

const defaultForm: GoalFormData = {
  title: '',
  description: '',
  whyItMatters: '',
  lifeArea: 'career',
  status: 'not_started',
  priority: 'medium',
  deadline: '',
  stepInputs: [''],
  milestoneTitle: '',
  milestoneDate: '',
};

export default function Goals() {
  const {
    goals, documents, settings,
    addGoal, updateGoal, deleteGoal,
    addGoalStep, toggleGoalStep, deleteGoalStep,
    addMilestone, toggleMilestone, deleteMilestone,
    updateGoalHealth,
  } = useStore();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalFormData>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;

  const filtered = useMemo(() => {
    let result = goals;
    if (filterStatus) result = result.filter((g) => g.status === filterStatus);
    if (filterArea) result = result.filter((g) => g.lifeArea === filterArea);
    if (filterPriority) result = result.filter((g) => g.priority === filterPriority);
    if (search) result = result.filter((g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    );
    switch (sortBy) {
      case 'deadline':
        result = [...result].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        });
        break;
      case 'priority': {
        const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        result = [...result].sort((a, b) => order[a.priority] - order[b.priority]);
        break;
      }
      case 'progress':
        result = [...result].sort((a, b) => b.progress - a.progress);
        break;
      default:
        result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return result;
  }, [goals, filterStatus, filterArea, filterPriority, search, sortBy]);

  function openAdd() {
    setEditingGoal(null);
    setForm(defaultForm);
    setShowModal(true);
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description,
      whyItMatters: goal.whyItMatters,
      lifeArea: goal.lifeArea,
      status: goal.status,
      priority: goal.priority,
      deadline: goal.deadline ?? '',
      stepInputs: goal.steps.map((s) => s.title),
      milestoneTitle: '',
      milestoneDate: '',
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const steps = form.stepInputs
      .filter((s) => s.trim())
      .map((title, i) => ({ id: `step-${i}-${Date.now()}`, title: title.trim(), completed: false, order: i }));

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      whyItMatters: form.whyItMatters.trim(),
      lifeArea: form.lifeArea,
      status: form.status,
      priority: form.priority,
      deadline: form.deadline || null,
      steps,
      milestones: editingGoal?.milestones ?? [],
      linkedDocumentIds: editingGoal?.linkedDocumentIds ?? [],
      healthScore: editingGoal?.healthScore ?? null,
      healthFeedback: editingGoal?.healthFeedback ?? '',
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    setShowModal(false);
  }

  async function handleGetHealthScore(goal: Goal) {
    if (!settings.geminiApiKey) {
      setAiError('Add your API key in Settings to use AI features.');
      return;
    }
    setHealthLoading(true);
    setAiError('');
    try {
      const prompt = `Goal: "${goal.title}"\nDescription: ${goal.description}\nWhy it matters: ${goal.whyItMatters}\nSteps completed: ${goal.steps.filter((s) => s.completed).length}/${goal.steps.length}\nDeadline: ${goal.deadline ?? 'none'}\nPriority: ${goal.priority}`;
      const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
      const result = await callAI(settings.aiProvider, activeKey, prompt, GOAL_HEALTH_PROMPT);
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      updateGoalHealth(goal.id, parsed.score, parsed.feedback);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to analyze goal');
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleGeneratePlan() {
    if (!settings.geminiApiKey) {
      setAiError('Add your API key in Settings to use AI features.');
      return;
    }
    if (!form.title.trim()) return;
    setPlanLoading(true);
    setAiError('');
    try {
      const prompt = `Goal: "${form.title}"\nDescription: ${form.description}\nWhy it matters: ${form.whyItMatters}\nDeadline: ${form.deadline || 'none'}`;
      const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
      const result = await callAI(settings.aiProvider, activeKey, prompt, PLAN_PROMPT);
      const steps = result
        .split('\n')
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);
      if (steps.length > 0) {
        setForm({ ...form, stepInputs: steps });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setPlanLoading(false);
    }
  }

  function handleAddStep() {
    if (!newStepText.trim() || !selectedGoalId) return;
    addGoalStep(selectedGoalId, newStepText.trim());
    setNewStepText('');
  }

  function handleAddMilestone() {
    if (!newMilestoneTitle.trim() || !newMilestoneDate || !selectedGoalId) return;
    addMilestone(selectedGoalId, {
      title: newMilestoneTitle.trim(),
      description: '',
      targetDate: newMilestoneDate,
    });
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="text-violet-400" size={24} />
            Goals
          </h1>
          <p className="text-gray-400 mt-1">Track and achieve your life goals</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} />
          Add Goal
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals..."
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none w-48"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {LIFE_AREA_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            <option value="created">Sort: Recent</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="progress">Sort: Progress</option>
          </select>
        </div>
      </GlassCard>

      {/* Main layout */}
      <div className={cn('grid gap-6', selectedGoal ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
        {/* Goal cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Target size={48} className="text-violet-400/40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No goals found</h3>
              <p className="text-gray-500 mb-6">Start by adding a goal you want to achieve.</p>
              <Button onClick={openAdd}><Plus size={16} /> Add Goal</Button>
            </div>
          ) : (
            filtered.map((goal) => {
              const area = getLifeArea(goal.lifeArea);
              const daysUntil = goal.deadline ? getDaysUntil(goal.deadline) : null;
              const overdue = goal.deadline ? isOverdue(goal.deadline + 'T23:59:59') : false;
              const completedSteps = goal.steps.filter((s) => s.completed).length;

              return (
                <GlassCard
                  key={goal.id}
                  hover
                  onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
                  className={cn(
                    'p-5 cursor-pointer',
                    selectedGoalId === goal.id && 'border-violet-500/40 bg-violet-500/5'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <ProgressRing progress={goal.progress} size={52} strokeWidth={4} color={area.color}>
                      <span className="text-xs font-bold" style={{ color: area.color }}>
                        {goal.progress}%
                      </span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white leading-tight">{goal.title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(goal); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(goal.id); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ color: area.color, backgroundColor: area.color + '20' }}
                        >
                          {area.label}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(goal.status))}>
                          {goal.status.replace('_', ' ')}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(goal.priority))}>
                          {goal.priority}
                        </span>
                        {goal.healthScore !== null && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ color: getHealthColor(goal.healthScore), backgroundColor: getHealthColor(goal.healthScore) + '20' }}
                          >
                            ❤ {goal.healthScore}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {goal.steps.length > 0 && (
                          <span>{completedSteps}/{goal.steps.length} steps</span>
                        )}
                        {daysUntil !== null && (
                          <span className={overdue ? 'text-red-400' : ''}>
                            {overdue ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={cn('text-gray-500 shrink-0 transition-transform', selectedGoalId === goal.id && 'rotate-90')}
                    />
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>

        {/* Goal detail panel */}
        {selectedGoal && (
          <GlassCard className="p-6 h-fit sticky top-6 animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-white leading-tight pr-4">{selectedGoal.title}</h2>
              <button
                onClick={() => setSelectedGoalId(null)}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {selectedGoal.description && (
              <p className="text-sm text-gray-400 mb-4">{selectedGoal.description}</p>
            )}

            {selectedGoal.whyItMatters && (
              <div className="mb-4 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
                <p className="text-xs text-violet-400 font-medium mb-1">Why it matters</p>
                <p className="text-sm text-gray-300">{selectedGoal.whyItMatters}</p>
              </div>
            )}

            {/* Steps */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Steps</h3>
              <div className="space-y-2">
                {selectedGoal.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2.5 group">
                    <button
                      onClick={() => toggleGoalStep(selectedGoal.id, step.id)}
                      className={cn(
                        'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                        step.completed
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-white/30 hover:border-violet-400'
                      )}
                      style={{ width: 18, height: 18 }}
                    >
                      {step.completed && <Check size={10} className="text-white" />}
                    </button>
                    <span className={cn('text-sm flex-1', step.completed ? 'line-through text-gray-500' : 'text-gray-200')}>
                      {step.title}
                    </span>
                    <button
                      onClick={() => deleteGoalStep(selectedGoal.id, step.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                  placeholder="Add a step..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none"
                />
                <button
                  onClick={handleAddStep}
                  className="px-2 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors text-xs"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Milestones */}
            {selectedGoal.milestones.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Milestones</h3>
                <div className="space-y-2">
                  {selectedGoal.milestones.map((m: Milestone) => (
                    <div key={m.id} className="flex items-center gap-2.5 group">
                      <button
                        onClick={() => toggleMilestone(selectedGoal.id, m.id)}
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          m.completedAt ? 'border-emerald-500 bg-emerald-500' : 'border-white/30 hover:border-violet-400'
                        )}
                      >
                        {m.completedAt && <Check size={10} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs', m.completedAt ? 'line-through text-gray-500' : 'text-gray-200')}>
                          {m.title}
                        </p>
                        <p className="text-xs text-gray-600">{formatDate(m.targetDate)}</p>
                      </div>
                      <button
                        onClick={() => deleteMilestone(selectedGoal.id, m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <input
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Milestone..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none"
              />
              <input
                type="date"
                value={newMilestoneDate}
                onChange={(e) => setNewMilestoneDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1.5 text-xs text-white focus:outline-none"
              />
              <button onClick={handleAddMilestone} className="px-2 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs">
                <Plus size={12} />
              </button>
            </div>

            {/* Linked docs */}
            {selectedGoal.linkedDocumentIds.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Linked Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGoal.linkedDocumentIds.map((docId) => {
                    const doc = documents.find((d) => d.id === docId);
                    if (!doc) return null;
                    return (
                      <a
                        key={docId}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <FileText size={11} /> {doc.title}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Health Score */}
            <div className="border-t border-white/10 pt-4">
              {selectedGoal.healthScore !== null && (
                <div className="mb-3 rounded-xl p-3 border" style={{
                  backgroundColor: getHealthColor(selectedGoal.healthScore) + '10',
                  borderColor: getHealthColor(selectedGoal.healthScore) + '30',
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} style={{ color: getHealthColor(selectedGoal.healthScore) }} />
                    <span className="text-sm font-semibold" style={{ color: getHealthColor(selectedGoal.healthScore) }}>
                      Health Score: {selectedGoal.healthScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{selectedGoal.healthFeedback}</p>
                </div>
              )}
              {aiError && (
                <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {aiError}
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                loading={healthLoading}
                onClick={() => handleGetHealthScore(selectedGoal)}
                className="w-full"
              >
                <Zap size={14} />
                {selectedGoal.healthScore !== null ? 'Refresh' : 'Get'} AI Health Score
              </Button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGoal ? 'Edit Goal' : 'New Goal'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Goal Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What do you want to achieve?"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your goal in detail..."
            rows={2}
          />
          <Textarea
            label="Why It Matters"
            value={form.whyItMatters}
            onChange={(e) => setForm({ ...form, whyItMatters: e.target.value })}
            placeholder="What's your deeper motivation?"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Life Area"
              value={form.lifeArea}
              onChange={(e) => setForm({ ...form, lifeArea: e.target.value as LifeAreaKey })}
              options={LIFE_AREA_OPTIONS}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              options={PRIORITY_FORM_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })}
              options={STATUS_FORM_OPTIONS}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Steps</label>
              <Button
                variant="ghost"
                size="sm"
                loading={planLoading}
                onClick={handleGeneratePlan}
                className="text-violet-400 text-xs"
              >
                <Zap size={12} />
                Generate with AI
              </Button>
            </div>
            {aiError && <p className="text-xs text-red-400 mb-2">{aiError}</p>}
            <div className="space-y-2">
              {form.stepInputs.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={step}
                    onChange={(e) => {
                      const updated = [...form.stepInputs];
                      updated[i] = e.target.value;
                      setForm({ ...form, stepInputs: updated });
                    }}
                    placeholder={`Step ${i + 1}...`}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const updated = form.stepInputs.filter((_, idx) => idx !== i);
                      setForm({ ...form, stepInputs: updated.length ? updated : [''] });
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm({ ...form, stepInputs: [...form.stepInputs, ''] })}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Plus size={14} /> Add Step
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editingGoal ? 'Save Changes' : 'Add Goal'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Goal" size="sm">
        <p className="text-gray-300 mb-6">Delete this goal? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => { if (deleteConfirmId) { deleteGoal(deleteConfirmId); setDeleteConfirmId(null); if (selectedGoalId === deleteConfirmId) setSelectedGoalId(null); } }} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

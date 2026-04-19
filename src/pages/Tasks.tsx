import React, { useState, useRef } from 'react';
import { CheckSquare, Plus, Trash2, Edit2, Calendar, Tag, X } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';
import { Input, Textarea, Select } from '../components/shared/Input';
import { useStore } from '../store/useStore';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { getLifeArea } from '../constants/lifeAreas';
import { formatDate, isOverdue } from '../utils/date';
import { cn } from '../utils/cn';
import { Task, ColumnId, Priority, LifeAreaKey } from '../types';

const COLUMNS: { id: ColumnId; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'text-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400' },
  { id: 'done', label: 'Done', color: 'text-emerald-400' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const LIFE_AREA_OPTIONS = [
  { value: '', label: 'No Area' },
  ...LIFE_AREAS.map((a) => ({ value: a.key, label: a.label })),
];

function getPriorityColor(priority: Priority) {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

interface TaskFormData {
  title: string;
  description: string;
  columnId: ColumnId;
  goalId: string;
  lifeArea: string;
  priority: Priority;
  dueDate: string;
  tags: string;
}

const defaultForm = (columnId: ColumnId = 'todo'): TaskFormData => ({
  title: '',
  description: '',
  columnId,
  goalId: '',
  lifeArea: '',
  priority: 'medium',
  dueDate: '',
  tags: '',
});

function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}) {
  const { goals } = useStore();
  const linkedGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;
  const area = task.lifeArea ? getLifeArea(task.lifeArea) : null;
  const overdue = task.dueDate ? isOverdue(task.dueDate + 'T23:59:59') : false;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={cn(
        'group rounded-xl border border-white/8 bg-white/4 p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-white/15 hover:bg-white/7',
        task.columnId === 'done' && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn('text-sm font-medium text-white leading-snug', task.columnId === 'done' && 'line-through text-gray-400')}>
          {task.title}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn('rounded-full border px-1.5 py-0.5 text-xs', getPriorityColor(task.priority))}>
          {task.priority}
        </span>
        {area && (
          <span
            className="rounded-full px-1.5 py-0.5 text-xs"
            style={{ color: area.color, backgroundColor: area.color + '20' }}
          >
            {area.label}
          </span>
        )}
        {linkedGoal && (
          <span className="rounded-full px-1.5 py-0.5 text-xs text-violet-400 bg-violet-400/10">
            {linkedGoal.title.slice(0, 20)}{linkedGoal.title.length > 20 ? '…' : ''}
          </span>
        )}
        {task.dueDate && (
          <span className={cn('flex items-center gap-0.5 text-xs', overdue ? 'text-red-400' : 'text-gray-500')}>
            <Calendar size={10} />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs text-gray-500 bg-white/5">
            <Tag size={9} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, goals, addTask, updateTask, deleteTask, moveTask } = useStore();
  const [filterGoal, setFilterGoal] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormData>(defaultForm());
  const [inlineAdd, setInlineAdd] = useState<ColumnId | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dragTaskId = useRef<string | null>(null);

  const goalOptions = [
    { value: '', label: 'No Goal' },
    ...goals.map((g) => ({ value: g.id, label: g.title })),
  ];

  const areaOptions = [
    { value: '', label: 'All Areas' },
    ...LIFE_AREAS.map((a) => ({ value: a.key, label: a.label })),
  ];

  function getColumnTasks(columnId: ColumnId) {
    let result = tasks.filter((t) => t.columnId === columnId);
    if (filterGoal) result = result.filter((t) => t.goalId === filterGoal);
    if (filterArea) result = result.filter((t) => t.lifeArea === filterArea);
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority);
    return result.sort((a, b) => a.order - b.order);
  }

  function openAdd(columnId: ColumnId) {
    setEditingTask(null);
    setForm(defaultForm(columnId));
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      columnId: task.columnId,
      goalId: task.goalId ?? '',
      lifeArea: task.lifeArea ?? '',
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      tags: task.tags.join(', '),
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      columnId: form.columnId,
      goalId: form.goalId || null,
      lifeArea: (form.lifeArea as LifeAreaKey) || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags,
    };
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setShowModal(false);
  }

  function handleInlineAdd(columnId: ColumnId) {
    if (!inlineTitle.trim()) { setInlineAdd(null); return; }
    addTask({
      title: inlineTitle.trim(),
      description: '',
      columnId,
      goalId: null,
      lifeArea: null,
      priority: 'medium',
      dueDate: null,
      tags: [],
    });
    setInlineTitle('');
    setInlineAdd(null);
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, columnId: ColumnId) {
    e.preventDefault();
    if (dragTaskId.current) {
      moveTask(dragTaskId.current, columnId);
      dragTaskId.current = null;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-violet-400" size={24} />
            Tasks
          </h1>
          <p className="text-gray-400 mt-1">Manage your daily tasks with Kanban</p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {goalOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {areaOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </GlassCard>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col gap-3 min-h-[200px] rounded-2xl border border-white/5 bg-white/2 p-3 transition-all"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn('text-sm font-semibold', col.color)}>{col.label}</h3>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium bg-white/10', col.color)}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openAdd(col.id)}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2 flex-1">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onDragStart={handleDragStart}
                  />
                ))}

                {/* Inline add */}
                {inlineAdd === col.id ? (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-2">
                    <input
                      autoFocus
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineAdd(col.id);
                        if (e.key === 'Escape') { setInlineAdd(null); setInlineTitle(''); }
                      }}
                      placeholder="Task title..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none mb-2"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleInlineAdd(col.id)}
                        className="px-2 py-1 rounded-lg bg-violet-500 text-white text-xs hover:bg-violet-600 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setInlineAdd(null); setInlineTitle(''); }}
                        className="p-1 rounded-lg text-gray-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setInlineAdd(col.id); setInlineTitle(''); }}
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/10 p-2 text-xs text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors"
                  >
                    <Plus size={12} /> Add task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Task Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to be done?"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Column"
              value={form.columnId}
              onChange={(e) => setForm({ ...form, columnId: e.target.value as ColumnId })}
              options={COLUMNS.map((c) => ({ value: c.id, label: c.label }))}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              options={PRIORITY_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Linked Goal"
              value={form.goalId}
              onChange={(e) => setForm({ ...form, goalId: e.target.value })}
              options={goalOptions}
            />
            <Select
              label="Life Area"
              value={form.lifeArea}
              onChange={(e) => setForm({ ...form, lifeArea: e.target.value })}
              options={LIFE_AREA_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="aws, learning, health"
              hint="Comma separated"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Task" size="sm">
        <p className="text-gray-300 mb-6">Delete this task? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => { if (deleteConfirmId) { deleteTask(deleteConfirmId); setDeleteConfirmId(null); } }} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

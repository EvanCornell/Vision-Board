import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Sparkles } from 'lucide-react';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';
import { Input, Textarea, Select } from '../components/shared/Input';
import { useStore } from '../store/useStore';
import { LIFE_AREAS, getLifeArea } from '../constants/lifeAreas';
import { formatDate } from '../utils/date';
import { cn } from '../utils/cn';
import { Vision, LifeAreaKey } from '../types';

const AREA_OPTIONS = [
  { value: '', label: 'All Areas' },
  ...LIFE_AREAS.map((a) => ({ value: a.key, label: a.label })),
];

const LIFE_AREA_OPTIONS = LIFE_AREAS.map((a) => ({ value: a.key, label: a.label }));

interface VisionFormData {
  title: string;
  description: string;
  affirmation: string;
  lifeArea: LifeAreaKey;
  imageUrl: string;
  targetDate: string;
  color: string;
}

const defaultForm: VisionFormData = {
  title: '',
  description: '',
  affirmation: '',
  lifeArea: 'career',
  imageUrl: '',
  targetDate: '',
  color: '#8b5cf6',
};

function VisionCard({
  vision,
  onEdit,
  onDelete,
}: {
  vision: Vision;
  onEdit: (v: Vision) => void;
  onDelete: (id: string) => void;
}) {
  const area = getLifeArea(vision.lifeArea);
  const { goals } = useStore();
  const linkedGoals = goals.filter((g) => g.lifeArea === vision.lifeArea);

  return (
    <div className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer">
      {/* Background */}
      {vision.imageUrl ? (
        <img
          src={vision.imageUrl}
          alt={vision.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className={cn('absolute inset-0 bg-gradient-to-br', area.gradient)}
          style={{ opacity: 0.8 }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: area.color + '30', color: area.color, border: `1px solid ${area.color}40` }}
          >
            {area.label}
          </span>
          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(vision); }}
              className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <Edit2 size={14} className="text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(vision.id); }}
              className="rounded-lg bg-red-500/30 p-1.5 backdrop-blur-sm hover:bg-red-500/50 transition-colors"
            >
              <Trash2 size={14} className="text-white" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-1 leading-tight">{vision.title}</h3>
          {vision.affirmation && (
            <p className="text-sm text-gray-200 italic leading-snug mb-3 line-clamp-2">
              "{vision.affirmation}"
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-300">
            {linkedGoals.length > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {linkedGoals.length} goal{linkedGoals.length !== 1 ? 's' : ''}
              </span>
            )}
            {vision.targetDate && (
              <span>Target: {formatDate(vision.targetDate)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisionBoard() {
  const { visions, addVision, updateVision, deleteVision } = useStore();
  const [filterArea, setFilterArea] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVision, setEditingVision] = useState<Vision | null>(null);
  const [form, setForm] = useState<VisionFormData>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = filterArea
    ? visions.filter((v) => v.lifeArea === filterArea)
    : visions;

  function openAdd() {
    setEditingVision(null);
    setForm(defaultForm);
    setShowModal(true);
  }

  function openEdit(vision: Vision) {
    setEditingVision(vision);
    setForm({
      title: vision.title,
      description: vision.description,
      affirmation: vision.affirmation,
      lifeArea: vision.lifeArea,
      imageUrl: vision.imageUrl ?? '',
      targetDate: vision.targetDate ?? '',
      color: vision.color,
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      affirmation: form.affirmation.trim(),
      lifeArea: form.lifeArea,
      imageUrl: form.imageUrl.trim() || null,
      targetDate: form.targetDate || null,
      color: form.color,
    };
    if (editingVision) {
      updateVision(editingVision.id, data);
    } else {
      addVision(data);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteVision(id);
    setDeleteConfirmId(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-violet-400" size={24} />
            Vision Board
          </h1>
          <p className="text-gray-400 mt-1">Visualize and manifest your ideal future</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} />
          Add Vision
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {AREA_OPTIONS.map((opt) => {
          const area = opt.value ? getLifeArea(opt.value as LifeAreaKey) : null;
          return (
            <button
              key={opt.value}
              onClick={() => setFilterArea(opt.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                filterArea === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              )}
              style={
                filterArea === opt.value && area
                  ? { backgroundColor: area.color + 'aa', color: 'white' }
                  : {}
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Vision grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles size={48} className="text-violet-400/40 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No visions yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Your vision board is empty. Start by adding a vision that inspires and motivates you.
          </p>
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add Your First Vision
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vision) => (
            <VisionCard
              key={vision.id}
              vision={vision}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingVision ? 'Edit Vision' : 'Add New Vision'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Vision Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Senior Software Architect"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your vision in detail..."
            rows={3}
          />
          <Textarea
            label="Affirmation"
            value={form.affirmation}
            onChange={(e) => setForm({ ...form, affirmation: e.target.value })}
            placeholder="I am a visionary leader who..."
            rows={2}
          />
          <Select
            label="Life Area"
            value={form.lifeArea}
            onChange={(e) => setForm({ ...form, lifeArea: e.target.value as LifeAreaKey })}
            options={LIFE_AREA_OPTIONS}
          />
          <Input
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            hint="Use an Unsplash URL or any image URL"
          />
          <Input
            label="Target Date"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editingVision ? 'Save Changes' : 'Add Vision'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Vision"
        size="sm"
      >
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete this vision? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

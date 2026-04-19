import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  Globe,
  File,
  Image,
  BookOpen,
  FileCode,
  Layers,
} from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';
import { Input, Textarea, Select } from '../components/shared/Input';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { AppDocument, DocumentType } from '../types';

const TYPE_OPTIONS: { value: DocumentType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'google_sheets', label: 'Google Sheets' },
  { value: 'google_docs', label: 'Google Docs' },
  { value: 'notion', label: 'Notion' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'url', label: 'URL' },
  { value: 'other', label: 'Other' },
];

const TYPE_FORM_OPTIONS = TYPE_OPTIONS.filter((o) => o.value !== '');

function getDocTypeIcon(type: DocumentType) {
  switch (type) {
    case 'google_sheets': return FileSpreadsheet;
    case 'google_docs': return FileText;
    case 'notion': return BookOpen;
    case 'excel': return FileSpreadsheet;
    case 'pdf': return File;
    case 'image': return Image;
    case 'url': return Globe;
    default: return FileCode;
  }
}

function getDocTypeColor(type: DocumentType): string {
  switch (type) {
    case 'google_sheets': return '#10b981';
    case 'google_docs': return '#3b82f6';
    case 'notion': return '#6366f1';
    case 'excel': return '#16a34a';
    case 'pdf': return '#ef4444';
    case 'image': return '#f59e0b';
    case 'url': return '#8b5cf6';
    default: return '#6b7280';
  }
}

function detectDocType(url: string): DocumentType {
  if (!url) return 'other';
  const lower = url.toLowerCase();
  if (lower.includes('docs.google.com/spreadsheets') || lower.includes('sheets.google')) return 'google_sheets';
  if (lower.includes('docs.google.com/document')) return 'google_docs';
  if (lower.includes('notion.so') || lower.includes('notion.site')) return 'notion';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.includes('excel')) return 'excel';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  return 'url';
}

interface DocFormData {
  title: string;
  url: string;
  type: DocumentType;
  description: string;
  goalIds: string[];
  tags: string;
}

const defaultForm: DocFormData = {
  title: '',
  url: '',
  type: 'url',
  description: '',
  goalIds: [],
  tags: '',
};

function DocumentCard({
  doc,
  goalMap,
  onEdit,
  onDelete,
}: {
  doc: AppDocument;
  goalMap: Record<string, string>;
  onEdit: (d: AppDocument) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = getDocTypeIcon(doc.type);
  const color = getDocTypeColor(doc.type);

  return (
    <GlassCard className="p-5 group hover:border-white/20 transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-xl p-2.5 shrink-0" style={{ backgroundColor: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{doc.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{doc.type.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(doc)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {doc.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{doc.description}</p>
      )}

      {doc.goalIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {doc.goalIds.map((gid) => (
            <span key={gid} className="rounded-full px-2 py-0.5 text-xs text-violet-400 bg-violet-400/10">
              {goalMap[gid] ?? 'Unknown goal'}
            </span>
          ))}
        </div>
      )}

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.map((tag) => (
            <span key={tag} className="rounded-full px-1.5 py-0.5 text-xs text-gray-500 bg-white/5">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color }}
      >
        <ExternalLink size={12} />
        Open Document
      </a>
    </GlassCard>
  );
}

export default function Documents() {
  const { documents, goals, addDocument, updateDocument, deleteDocument } = useStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [groupByGoal, setGroupByGoal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [form, setForm] = useState<DocFormData>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const goalMap = useMemo(() => {
    const map: Record<string, string> = {};
    goals.forEach((g) => { map[g.id] = g.title; });
    return map;
  }, [goals]);

  const filtered = useMemo(() => {
    let result = documents;
    if (search) result = result.filter((d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
    if (filterType) result = result.filter((d) => d.type === filterType);
    return result;
  }, [documents, search, filterType]);

  function openAdd() {
    setEditingDoc(null);
    setForm(defaultForm);
    setShowModal(true);
  }

  function openEdit(doc: AppDocument) {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      url: doc.url,
      type: doc.type,
      description: doc.description,
      goalIds: doc.goalIds,
      tags: doc.tags.join(', '),
    });
    setShowModal(true);
  }

  function handleUrlChange(url: string) {
    const detectedType = detectDocType(url);
    setForm({ ...form, url, type: detectedType });
  }

  function handleSave() {
    if (!form.title.trim() || !form.url.trim()) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const data = {
      title: form.title.trim(),
      url: form.url.trim(),
      type: form.type,
      description: form.description.trim(),
      goalIds: form.goalIds,
      tags,
    };
    if (editingDoc) {
      updateDocument(editingDoc.id, data);
    } else {
      addDocument(data);
    }
    setShowModal(false);
  }

  function toggleGoalId(id: string) {
    setForm((prev) => ({
      ...prev,
      goalIds: prev.goalIds.includes(id)
        ? prev.goalIds.filter((g) => g !== id)
        : [...prev.goalIds, id],
    }));
  }

  // Group by goal view
  const groupedByGoal = useMemo(() => {
    const groups: { goal: { id: string; title: string } | null; docs: AppDocument[] }[] = [];
    const goalDocs: Record<string, AppDocument[]> = {};
    const ungrouped: AppDocument[] = [];

    filtered.forEach((doc) => {
      if (doc.goalIds.length === 0) {
        ungrouped.push(doc);
      } else {
        doc.goalIds.forEach((gid) => {
          if (!goalDocs[gid]) goalDocs[gid] = [];
          if (!goalDocs[gid].includes(doc)) goalDocs[gid].push(doc);
        });
      }
    });

    goals.forEach((g) => {
      if (goalDocs[g.id]?.length) {
        groups.push({ goal: g, docs: goalDocs[g.id] });
      }
    });

    if (ungrouped.length > 0) {
      groups.push({ goal: null, docs: ungrouped });
    }

    return groups;
  }, [filtered, goals]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-violet-400" size={24} />
            Documents
          </h1>
          <p className="text-gray-400 mt-1">Your resource hub for goals and learning</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} />
          Add Document
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none w-48"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setGroupByGoal((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
              groupByGoal
                ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
            )}
          >
            <Layers size={14} />
            Group by Goal
          </button>
        </div>
      </GlassCard>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={48} className="text-violet-400/40 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6">Add links to your Google Docs, Notion pages, PDFs, and more.</p>
          <Button onClick={openAdd}><Plus size={16} /> Add Document</Button>
        </div>
      ) : groupByGoal ? (
        <div className="space-y-8">
          {groupedByGoal.map(({ goal, docs }) => (
            <div key={goal?.id ?? 'ungrouped'}>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                {goal?.title ?? 'Unlinked Documents'}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    goalMap={goalMap}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteConfirmId(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              goalMap={goalMap}
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
        title={editingDoc ? 'Edit Document' : 'Add Document'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Document name"
          />
          <Input
            label="URL *"
            value={form.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://..."
            hint="Type is auto-detected from URL"
          />
          <Select
            label="Document Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}
            options={TYPE_FORM_OPTIONS}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this document about?"
            rows={2}
          />
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Link to Goals</label>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoalId(g.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    form.goalIds.includes(g.id)
                      ? 'bg-violet-600/40 border-violet-500/60 text-violet-200'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  )}
                >
                  {g.title.slice(0, 30)}{g.title.length > 30 ? '…' : ''}
                </button>
              ))}
              {goals.length === 0 && (
                <p className="text-xs text-gray-500">No goals yet. Add goals first.</p>
              )}
            </div>
          </div>
          <Input
            label="Tags"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="study, reference, template"
            hint="Comma separated"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editingDoc ? 'Save Changes' : 'Add Document'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Document" size="sm">
        <p className="text-gray-300 mb-6">Delete this document link? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => { if (deleteConfirmId) { deleteDocument(deleteConfirmId); setDeleteConfirmId(null); } }} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

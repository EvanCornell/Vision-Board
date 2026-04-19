import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  User,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useStore } from '../store/useStore';
import { callAI } from '../services/gemini';
import { AIProvider } from '../types';

export default function Settings() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useStore();

  const [name, setName] = useState(settings.name);
  const [provider, setProvider] = useState<AIProvider>(settings.aiProvider);
  const [groqKey, setGroqKey] = useState(settings.groqApiKey);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSaveName() {
    updateSettings({ name: name.trim() || 'Visionary' });
  }

  function handleSaveProvider(p: AIProvider) {
    setProvider(p);
    updateSettings({ aiProvider: p });
    setTestStatus('idle');
  }

  function handleSaveGroqKey() {
    updateSettings({ groqApiKey: groqKey.trim() });
    setTestStatus('idle');
  }

  function handleSaveGeminiKey() {
    updateSettings({ geminiApiKey: geminiKey.trim() });
    setTestStatus('idle');
  }

  async function handleTestConnection() {
    const key = provider === 'groq' ? groqKey.trim() : geminiKey.trim();
    if (!key) return;
    setTestStatus('testing');
    setTestError('');
    try {
      await callAI(provider, key, 'Say "Connection successful!" in exactly those words.');
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Connection failed');
    }
  }

  function handleExport() {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-board-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        importData(json);
        setImportSuccess(true);
        setImportError('');
        setTimeout(() => setImportSuccess(false), 3000);
      } catch {
        setImportError('Invalid file format. Please use a valid Vision Board backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearAll() {
    clearAllData();
    setShowClearConfirm(false);
  }

  const activeKey = provider === 'groq' ? groqKey.trim() : geminiKey.trim();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-violet-400" size={24} />
          Settings
        </h1>
        <p className="text-gray-400 mt-1">Configure your Vision Board experience</p>
      </div>

      {/* Profile */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-500/20 p-2.5">
            <User size={18} className="text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Profile</h2>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              hint="Used in your dashboard greeting"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSaveName} variant="secondary">Save</Button>
          </div>
        </div>
      </GlassCard>

      {/* AI Provider */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-500/20 p-2.5">
            <Key size={18} className="text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">AI Provider</h2>
        </div>

        {/* Provider toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleSaveProvider('groq')}
            className={`rounded-xl border p-4 text-left transition-all ${
              provider === 'groq'
                ? 'border-violet-500/60 bg-violet-500/15'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className={provider === 'groq' ? 'text-violet-400' : 'text-gray-400'} />
              <span className="font-semibold text-white text-sm">Groq</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-medium">Recommended</span>
            </div>
            <p className="text-xs text-gray-400">100% free, no billing ever. Fast Llama 3.3 model.</p>
          </button>

          <button
            onClick={() => handleSaveProvider('gemini')}
            className={`rounded-xl border p-4 text-left transition-all ${
              provider === 'gemini'
                ? 'border-violet-500/60 bg-violet-500/15'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className={provider === 'gemini' ? 'text-violet-400' : 'text-gray-400'} />
              <span className="font-semibold text-white text-sm">Gemini</span>
            </div>
            <p className="text-xs text-gray-400">Google's Gemini 2.0 Flash. Requires free-tier quota.</p>
          </button>
        </div>

        {/* Groq key */}
        {provider === 'groq' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <p className="text-sm text-emerald-300 font-medium mb-2">Get your free Groq API key:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline inline-flex items-center gap-1">console.groq.com <ExternalLink size={11} /></a></li>
                <li>Sign up (free, no credit card needed)</li>
                <li>Click "API Keys" → "Create API Key"</li>
                <li>Paste it below and click Save</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => { setGroqKey(e.target.value); setTestStatus('idle'); }}
                  placeholder="gsk_..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
                />
                <button type="button" onClick={() => setShowGroqKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button onClick={handleSaveGroqKey} variant="secondary">Save</Button>
            </div>
            {settings.groqApiKey && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={14} /> Groq key configured
              </div>
            )}
          </div>
        )}

        {/* Gemini key */}
        {provider === 'gemini' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
              <p className="text-sm text-violet-300 font-medium mb-2">Get your Gemini API key:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline inline-flex items-center gap-1">aistudio.google.com <ExternalLink size={11} /></a></li>
                <li>Sign in and click "Get API Key"</li>
                <li>Create a key in a new project</li>
                <li>Paste it below and click Save</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => { setGeminiKey(e.target.value); setTestStatus('idle'); }}
                  placeholder="AIza..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
                />
                <button type="button" onClick={() => setShowGeminiKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button onClick={handleSaveGeminiKey} variant="secondary">Save</Button>
            </div>
            {settings.geminiApiKey && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={14} /> Gemini key configured
              </div>
            )}
          </div>
        )}

        {/* Test connection */}
        <div className="flex items-center gap-3 mt-4">
          <Button
            onClick={handleTestConnection}
            variant="ghost"
            size="sm"
            loading={testStatus === 'testing'}
            disabled={!activeKey}
            className="text-gray-400"
          >
            Test Connection
          </Button>
          {testStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <CheckCircle size={16} /> Connected successfully!
            </div>
          )}
          {testStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-400 text-sm max-w-sm">
              <XCircle size={16} className="shrink-0" />
              <span className="text-xs">{testError}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-500/20 p-2.5">
            <Download size={18} className="text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Data Management</h2>
        </div>

        <div className="space-y-3">
          {importSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              <CheckCircle size={16} /> Data imported successfully!
            </div>
          )}
          {importError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              <XCircle size={16} /> {importError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button onClick={handleExport} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 hover:border-white/20 transition-all group">
              <div className="rounded-lg bg-emerald-500/20 p-2 group-hover:bg-emerald-500/30 transition-colors">
                <Download size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Export Data</p>
                <p className="text-xs text-gray-500 mt-0.5">Download all data as JSON</p>
              </div>
            </button>

            <button onClick={handleImportClick} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 hover:border-white/20 transition-all group">
              <div className="rounded-lg bg-blue-500/20 p-2 group-hover:bg-blue-500/30 transition-colors">
                <Upload size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Import Data</p>
                <p className="text-xs text-gray-500 mt-0.5">Restore from a backup file</p>
              </div>
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-3 w-full rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left hover:bg-red-500/10 hover:border-red-500/30 transition-all group">
            <div className="rounded-lg bg-red-500/20 p-2 group-hover:bg-red-500/30 transition-colors">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Clear All Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Delete all visions, goals, tasks, and documents</p>
            </div>
          </button>
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-violet-500/20 p-2.5">
            <Info size={18} className="text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">About Vision Board</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Vision Board is your personal manifestation and goal-achievement platform. Combine the power of visualization with structured goal tracking and AI coaching to manifest the life you desire.
        </p>
        <div className="space-y-2">
          {[
            'Vision Board — visualize your ideal future',
            'Goal tracking with AI health scores',
            'Kanban task management',
            'Document hub for resources',
            'AI-powered coaching and affirmations',
            'Manifestation mode for daily visualization',
            'Streak tracking to build consistent habits',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600">Version 1.0.0 — Built with React, Zustand, Groq & Gemini AI</div>
      </GlassCard>

      {/* Clear confirm modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-300 font-medium mb-1">This action cannot be undone!</p>
            <p className="text-sm text-gray-400">All your visions, goals, tasks, documents, and history will be permanently deleted.</p>
          </div>
          <p className="text-sm text-gray-400">We recommend exporting your data first as a backup before clearing.</p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleClearAll} className="flex-1">Yes, Clear Everything</Button>
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

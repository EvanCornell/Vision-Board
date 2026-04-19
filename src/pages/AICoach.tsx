import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Settings as SettingsIcon,
  Sparkles,
  BarChart2,
  MessageCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/shared/GlassCard';
import { Button } from '../components/shared/Button';
import { useStore } from '../store/useStore';
import { Goal, Vision } from '../types';
import { callAI } from '../services/gemini';
import { GENERAL_SYSTEM_PROMPT, AFFIRMATION_PROMPT, GOAL_HEALTH_PROMPT } from '../constants/prompts';
import { cn } from '../utils/cn';

type CoachMode = 'general' | 'planning' | 'affirmation' | 'analysis';

const MODES: { id: CoachMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'general', label: 'General', icon: MessageCircle, description: 'Get life coaching advice' },
  { id: 'planning', label: 'Planning', icon: Calendar, description: 'Break down your goals' },
  { id: 'affirmation', label: 'Affirmation', icon: Sparkles, description: 'Generate affirmations' },
  { id: 'analysis', label: 'Analysis', icon: BarChart2, description: 'Analyze your progress' },
];

const QUICK_PROMPTS: Record<CoachMode, string[]> = {
  general: [
    "Help me stay motivated when things get hard",
    "What habits should I build for success?",
    "How do I overcome procrastination?",
    "Give me a morning routine for productivity",
  ],
  planning: [
    "Help me plan my top goal",
    "Break down my career goal into 90-day sprints",
    "What should I focus on this week?",
    "Create a weekly schedule for my goals",
  ],
  affirmation: [
    "Generate an affirmation for my career",
    "Create a health and wellness affirmation",
    "Generate an abundance affirmation",
    "Write a confidence affirmation",
  ],
  analysis: [
    "Analyze my current goals",
    "What patterns do you see in my progress?",
    "Where am I strongest and weakest?",
    "What's holding me back from my goals?",
  ],
};

function buildContext(
  mode: CoachMode,
  goals: Goal[],
  visions: Vision[]
): string {
  const goalSummary = goals
    .map((g) => `- ${g.title} (${g.status}, ${g.progress}% done, ${g.lifeArea})`)
    .join('\n');
  const visionSummary = visions
    .map((v) => `- ${v.title} (${v.lifeArea}): ${v.affirmation}`)
    .join('\n');

  switch (mode) {
    case 'planning':
      return `\n\nContext about my goals:\n${goalSummary}\n\nMy visions:\n${visionSummary}\n\nUser request: `;
    case 'affirmation':
      return `\n\nMy goals and visions for context:\n${goalSummary}\n${visionSummary}\n\nUser request: `;
    case 'analysis':
      return `\n\nMy current goals:\n${goalSummary}\n\nMy visions:\n${visionSummary}\n\nPlease analyze: `;
    default:
      return '\n\nUser: ';
  }
}

function getSystemPrompt(mode: CoachMode): string {
  switch (mode) {
    case 'affirmation': return AFFIRMATION_PROMPT;
    case 'analysis': return GOAL_HEALTH_PROMPT;
    default: return GENERAL_SYSTEM_PROMPT;
  }
}

export default function AICoach() {
  const navigate = useNavigate();
  const { chatHistory, settings, goals, visions, addChatMessage, clearChatHistory, setDailyAffirmation } = useStore();
  const [mode, setMode] = useState<CoachMode>('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  async function sendMessage(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;
    const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
    if (!activeKey) {
      setError('Please add your API key in Settings to use AI Coach.');
      return;
    }

    setInput('');
    setError('');
    setLoading(true);

    // Add user message
    addChatMessage({ role: 'user', content: text });

    try {
      const context = buildContext(mode, goals, visions);
      const fullPrompt = context + text;
      const systemPrompt = getSystemPrompt(mode);
      const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;

      const responseText = await callAI(settings.aiProvider, activeKey, fullPrompt, systemPrompt);
      addChatMessage({ role: 'assistant', content: responseText });

      // If affirmation mode, save to daily affirmation
      if (mode === 'affirmation') {
        setDailyAffirmation(responseText.replace(/^["']|["']$/g, '').trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeKey = settings.aiProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
  if (!activeKey) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-violet-400" size={24} />
            AI Coach
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <GlassCard className="p-8 max-w-md text-center">
            <Bot size={48} className="text-violet-400/60 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-3">Set Up Your AI Coach</h2>
            <p className="text-gray-400 mb-6">
              Add a free Groq API key in Settings to unlock AI coaching. Groq is completely free — no billing required.
            </p>
            <Button onClick={() => navigate('/settings')} className="w-full">
              <SettingsIcon size={16} />
              Go to Settings
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Get your free key at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                console.groq.com
              </a>
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-violet-400" size={24} />
            AI Coach
          </h1>
          <p className="text-gray-400 mt-1">Your personal life strategy advisor</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChatHistory} className="text-gray-500">
          <Trash2 size={14} />
          Clear Chat
        </Button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200',
              mode === m.id
                ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20'
            )}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {QUICK_PROMPTS[mode].map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <GlassCard className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot size={40} className="text-violet-400/40 mb-3" />
            <p className="text-gray-500 text-sm">
              Start a conversation with your AI life coach. Ask anything about your goals, plans, or mindset.
            </p>
          </div>
        )}

        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="mr-3 mt-1 rounded-full bg-violet-500/20 p-1.5 h-fit shrink-0">
                <Bot size={14} className="text-violet-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white/8 border border-white/10 text-gray-200 rounded-tl-sm'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={cn('text-xs mt-1', message.role === 'user' ? 'text-violet-200' : 'text-gray-500')}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="ml-3 mt-1 rounded-full bg-violet-600/30 p-1.5 h-fit shrink-0">
                <span className="text-xs text-violet-300 font-bold">You</span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="mr-3 rounded-full bg-violet-500/20 p-1.5 h-fit">
              <Bot size={14} className="text-violet-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </GlassCard>

      {/* Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask your AI coach... (${MODES.find((m2) => m2.id === mode)?.description})`}
            rows={1}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none resize-none"
            style={{ maxHeight: 120 }}
          />
        </div>
        <Button
          onClick={() => sendMessage()}
          loading={loading}
          disabled={!input.trim()}
          size="lg"
          className="rounded-2xl"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

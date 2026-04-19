import { AIProvider } from '../types';

// ── Gemini ────────────────────────────────────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{ content: { parts: { text: string }[] } }>;
  error?: { code: number; message: string; status: string };
}

async function callGemini(apiKey: string, prompt: string, systemPrompt?: string): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: GeminiResponse = await res.json();

  if (!res.ok && data.error) {
    const { code, status, message } = data.error;
    if (code === 400 || status === 'INVALID_ARGUMENT') throw new Error('Invalid Gemini API key.');
    if (code === 403 || status === 'PERMISSION_DENIED') throw new Error('Gemini API key lacks permission. Enable the Generative Language API in Google Cloud.');
    if (code === 429 || status === 'RESOURCE_EXHAUSTED') throw new Error(`Gemini quota exceeded: ${message}`);
    throw new Error(`Gemini error (${code}): ${message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!text) throw new Error('Empty response from Gemini.');
  return text;
}

// ── Groq ──────────────────────────────────────────────────────────────────────

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqResponse {
  choices?: Array<{ message: { content: string } }>;
  error?: { message: string; type: string; code?: string };
}

async function callGroq(apiKey: string, prompt: string, systemPrompt?: string): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 1024 }),
  });

  const data: GroqResponse = await res.json();

  if (!res.ok && data.error) {
    if (res.status === 401) throw new Error('Invalid Groq API key. Check your key at console.groq.com.');
    if (res.status === 429) throw new Error('Groq rate limit hit. Wait a moment and try again.');
    throw new Error(`Groq error: ${data.error.message}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq.');
  return text;
}

// ── Unified entry point ────────────────────────────────────────────────────────

export async function callAI(
  provider: AIProvider,
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!apiKey?.trim()) {
    throw new Error(
      provider === 'groq'
        ? 'No Groq API key. Get a free key at console.groq.com and add it in Settings.'
        : 'No Gemini API key. Add it in Settings.'
    );
  }
  return provider === 'groq'
    ? callGroq(apiKey, prompt, systemPrompt)
    : callGemini(apiKey, prompt, systemPrompt);
}

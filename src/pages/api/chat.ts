import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from '../../lib/system-prompt';
import { retrieve } from '../../lib/retriever';

const API_KEYS = [
  import.meta.env.GROQ_API_KEY_1,
  import.meta.env.GROQ_API_KEY_2,
  import.meta.env.GROQ_API_KEY_3,
  import.meta.env.GROQ_API_KEY_4,
].filter(Boolean);

function buildPrompt(userMessage: string): string {
  const matches = retrieve(userMessage, 3);

  if (matches.length === 0) return SYSTEM_PROMPT;

  const context = matches
    .map((m) => `Q: ${m.question}\nAli's real answer: ${m.answer}`)
    .join('\n\n');

  return `${SYSTEM_PROMPT}

REFERENCE — Ali has answered similar questions before. Use these as ground truth for facts and tone, but do NOT copy them word-for-word. Rephrase naturally and keep your response short:

${context}`;
}

async function callWithRotation(
  messages: { role: string; content: string }[],
  systemPrompt: string,
): Promise<string> {
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const groq = new Groq({ apiKey: API_KEYS[i] });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 256,
      });
      return completion.choices[0]?.message?.content ?? '';
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Error && (err.message.includes('rate_limit') || err.message.includes('Rate limit'));
      if (isRateLimit && i < API_KEYS.length - 1) {
        console.log(`Key ${i + 1} rate-limited, rotating to key ${i + 2}`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All API keys exhausted');
}

const ALLOWED_ORIGINS = [
  'https://sudoali.dev',
  'http://sudoali.dev',
  'http://localhost:4322',
  'http://localhost:4321',
];

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
};

export const POST: APIRoute = async ({ request }) => {
  const headers = getCorsHeaders(request);
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400, headers,
      });
    }

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const systemPrompt = buildPrompt(lastUserMsg?.content ?? '');

    const reply = await callWithRotation(messages, systemPrompt);

    return new Response(JSON.stringify({ reply }), {
      status: 200, headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Groq API error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers,
    });
  }
};

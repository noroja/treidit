/**
 * CAMADA DE API DE IA — provedores desacoplados (FASE 7/§12)
 * ---------------------------------------------------------
 * A chave NUNCA chega ao navegador: tudo roda no Express, por env vars.
 * Prioridade: Groq (GROQ_API_KEY) → Gemini (GEMINI_API_KEY) → nenhum
 * (endpoints usam os stubs determinísticos locais, o app nunca para).
 *
 * Groq (recomendada): chave gratuita permanente em console.groq.com/api/keys
 * sem cartão. Tier free 2026 tem por modelo: 30 req/min, 1.000 req/dia,
 * 200K tokens/dia (gpt-oss-120b). Llama virou Enterprise ("contact sales")
 * — o default self-serve é openai/gpt-oss-120b (assoc. OpenAI-compatible).
 *
 * Contrato: a IA NUNCA escreve metas críticas — saída em JSON é validada
 * pelo backend antes de qualquer persistência (§13). Timeout e 1 retentativa
 * em 429/5xx; falha ≠ invenção: erro volta legível ao cliente.
 */

import { GoogleGenAI } from '@google/genai';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompleteOptions {
  system: string;
  messages: AiMessage[];
  temperature: number;
  /** Força saída em objeto JSON (quando o provedor suporta). */
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface AiProvider {
  readonly name: 'groq' | 'gemini';
  complete(options: AiCompleteOptions): Promise<string>;
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

const DEFAULT_TIMEOUT_MS = 25_000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Default self-serve do tier gratuito 2026 (verificar modelos em console.groq.com/docs/models). */
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

// ---------------------------------------------------------------------------
// Groq — API OpenAI-compatible (chat/completions)
// ---------------------------------------------------------------------------

export function createGroqProvider(apiKey: string, model: string): AiProvider {
  return {
    name: 'groq',
    async complete({ system, messages, temperature, jsonMode, timeoutMs }) {
      const body: Record<string, unknown> = {
        model,
        temperature,
        messages: [
          { role: 'system', content: system },
          // Contexto mínimo: só as últimas interações — nunca o histórico todo (§12).
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_completion_tokens: 2048,
      };
      if (jsonMode) body.response_format = { type: 'json_object' };

      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);
        try {
          const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = (await res.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const text = data.choices?.[0]?.message?.content ?? '';
            if (!text) throw new AiUnavailableError('resposta da Groq sem conteúdo');
            return text;
          }

          // 429/5xx: uma retentativa única, curta e segura.
          if ((res.status === 429 || res.status >= 500) && attempt === 0) {
            lastError = new AiUnavailableError(`Groq HTTP ${res.status}`);
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }

          const detail = await res.text().catch(() => '');
          if (res.status === 401) {
            throw new AiUnavailableError('chave GROQ_API_KEY inválida (HTTP 401)');
          }
          throw new AiUnavailableError(`Groq HTTP ${res.status}: ${detail.slice(0, 200)}`);
        } catch (err) {
          clearTimeout(timer);
          if (err instanceof AiUnavailableError) throw err;
          if (err instanceof Error && err.name === 'AbortError') {
            if (attempt === 0) {
              lastError = err;
              continue;
            }
            throw new AiUnavailableError('Groq estourou o timeout (25s)');
          }
          throw new AiUnavailableError(`falha de rede na Groq: ${String(err).slice(0, 160)}`);
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new AiUnavailableError('Groq indisponível após retentativa');
    },
  };
}

// ---------------------------------------------------------------------------
// Gemini — SDK official (mantido como fallback)
// ---------------------------------------------------------------------------

export function createGeminiProvider(apiKey: string): AiProvider {
  const ai = new GoogleGenAI({ apiKey });
  const MODEL = 'gemini-3.8-flash';

  return {
    name: 'gemini',
    async complete({ system, messages, temperature, jsonMode, timeoutMs }) {
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: system,
          temperature,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });
      const text = response.text ?? '';
      if (!text) throw new AiUnavailableError('resposta do Gemini sem conteúdo');
      return text;
    },
  };
}

// ---------------------------------------------------------------------------
// Resolução por env — chamada APÓS dotenv.config() no server
// ---------------------------------------------------------------------------

export function resolveAiProvider(env: NodeJS.ProcessEnv): AiProvider | null {
  if (env.GROQ_API_KEY) {
    return createGroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL || DEFAULT_GROQ_MODEL);
  }
  if (env.GEMINI_API_KEY) {
    return createGeminiProvider(env.GEMINI_API_KEY);
  }
  return null;
}

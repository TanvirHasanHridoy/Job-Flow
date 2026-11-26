/**
 * AI provider configuration with automatic fallback (v2 Phase 7.5).
 *
 * All providers speak the OpenAI chat-completions format. Configure them in .env:
 *
 *   AI_PROVIDERS=deepseek,gemini          # order to try (optional; default below)
 *   GEMINI_API_KEY=...      GEMINI_MODEL=gemini-3.5-flash
 *   DEEPSEEK_API_KEY=...    DEEPSEEK_MODEL=deepseek-v4-flash
 *   GROQ_API_KEY=...        GROQ_MODEL=openai/gpt-oss-120b
 *   OPENROUTER_API_KEY=...  OPENROUTER_MODEL=<model id, required for OpenRouter>
 *   GEMINI_REASONING_EFFORT=low           # optional: faster Gemini "thinking" models
 *   <NAME>_API_URL=...                    # optional endpoint override (proxies, tests)
 *
 * Without AI_PROVIDERS, every provider that has a key is used in the order
 * gemini, deepseek, groq, openrouter. When a provider fails (quota, outage,
 * bad key, request too large) the next one is tried; a rate-limited provider is
 * skipped for a few minutes.
 */

export interface AiProvider {
  id: 'gemini' | 'deepseek' | 'groq' | 'openrouter';
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  extraBody?: Record<string, unknown>;
}

const DEFINITIONS: Array<{ id: AiProvider['id']; name: string; url: string; defaultModel: string | null }> = [
  { id: 'gemini', name: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', defaultModel: 'gemini-3.5-flash' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-v4-flash' },
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'openai/gpt-oss-120b' },
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: null },
];

export function getAiProviders(env: NodeJS.ProcessEnv = process.env): AiProvider[] {
  const available: AiProvider[] = [];
  for (const def of DEFINITIONS) {
    const prefix = def.id.toUpperCase();
    const apiKey = env[`${prefix}_API_KEY`]?.trim();
    const model = env[`${prefix}_MODEL`]?.trim() || def.defaultModel;
    if (!apiKey || !model) continue;
    const extraBody: Record<string, unknown> = {};
    if (def.id === 'gemini' && env.GEMINI_REASONING_EFFORT) extraBody.reasoning_effort = env.GEMINI_REASONING_EFFORT;
    available.push({ id: def.id, name: def.name, apiUrl: env[`${prefix}_API_URL`]?.trim() || def.url, apiKey, model, extraBody });
  }

  const order = (env.AI_PROVIDERS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (order.length === 0) return available;
  return order
    .map(id => available.find(p => p.id === id))
    .filter((p): p is AiProvider => !!p);
}

/** First configured provider (kept for existing callers that log the provider name or check the key). */
export function getAiConfig() {
  const first = getAiProviders()[0];
  if (first) return { apiUrl: first.apiUrl, apiKey: first.apiKey, model: first.model, provider: first.name };
  return { apiUrl: '', apiKey: '', model: '', provider: 'AI' };
}

/* ------------------------------------------------------------------ */
/* Request with fallback                                               */
/* ------------------------------------------------------------------ */

// Providers that just returned 429 are skipped until this time (per server instance)
const coolingDown = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;

export interface AiFetchResult {
  response: Response;
  provider: AiProvider;
}

/**
 * POSTs a chat-completions payload to the first provider that answers OK, falling
 * back through the configured providers. The payload's `model` is replaced per
 * provider. Returns the last failed response if every provider fails; throws only
 * if none could be reached at all (network errors) or none is configured.
 */
export async function aiFetch(payload: Record<string, unknown>, init: { signal?: AbortSignal } = {}): Promise<Response> {
  const { response } = await aiFetchWithProvider(payload, init);
  return response;
}

export async function aiFetchWithProvider(payload: Record<string, unknown>, init: { signal?: AbortSignal } = {}): Promise<AiFetchResult> {
  const providers = getAiProviders();
  if (providers.length === 0) throw new Error('No AI provider is configured (set GEMINI_API_KEY, DEEPSEEK_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY).');

  const now = Date.now();
  const ready = providers.filter(p => (coolingDown.get(p.id) ?? 0) <= now);
  // If everything is cooling down, still try them all rather than failing outright
  const candidates = ready.length > 0 ? ready : providers;

  let lastResult: AiFetchResult | null = null;
  let lastError: unknown = null;

  for (const provider of candidates) {
    try {
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ ...payload, model: provider.model, ...(provider.extraBody || {}) }),
        signal: init.signal,
      });
      if (response.ok) {
        coolingDown.delete(provider.id);
        return { response, provider };
      }
      if (response.status === 429) coolingDown.set(provider.id, Date.now() + RATE_LIMIT_COOLDOWN_MS);
      const detail = await response.clone().text().catch(() => '');
      console.warn(`[ai] ${provider.name} returned ${response.status}${candidates.length > 1 ? ', trying next provider' : ''}: ${detail.slice(0, 200)}`);
      lastResult = { response, provider };
    } catch (err) {
      if (init.signal?.aborted) throw err;
      console.warn(`[ai] ${provider.name} request failed${candidates.length > 1 ? ', trying next provider' : ''}:`, (err as Error).message);
      lastError = err;
    }
  }

  if (lastResult) return lastResult;
  throw lastError instanceof Error ? lastError : new Error('All AI providers failed');
}

/** Test helper: clears the rate-limit cooldowns. */
export function resetAiCooldowns(): void {
  coolingDown.clear();
}

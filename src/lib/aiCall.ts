import { getAiConfig } from './ai';

type AiConfig = ReturnType<typeof getAiConfig>;
type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export class AiCallError extends Error {
  constructor(message: string, public readonly upstreamStatus?: number) {
    super(message);
    this.name = 'AiCallError';
  }
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * Calls the configured chat-completions provider expecting a JSON object back.
 * Retries transient failures (429/5xx/network) with backoff. Throws AiCallError
 * on failure; callers decide on refunds and user-facing messages.
 */
export async function callAiJson<T = any>(
  aiConfig: AiConfig,
  messages: Message[],
  opts: { temperature?: number; timeoutMs?: number; maxRetries?: number } = {}
): Promise<{ data: T; raw: string }> {
  const { temperature = 0.1, timeoutMs = 120000, maxRetries = 2 } = opts;
  const payload = {
    model: aiConfig.model,
    messages,
    response_format: { type: 'json_object' },
    temperature,
  };

  let response: Response | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt === 1 ? 1200 : 2500));
    try {
      response = await fetch(aiConfig.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiConfig.apiKey}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) break;
      if (!RETRYABLE.has(response.status)) break;
    } catch (err) {
      lastError = err;
      response = null;
    }
  }

  if (!response) {
    throw new AiCallError(`AI request failed: ${(lastError as Error)?.message || 'network error'}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AiCallError(`AI provider returned ${response.status}: ${body.slice(0, 500)}`, response.status);
  }

  let raw = '';
  try {
    const json = await response.json();
    raw = json.choices?.[0]?.message?.content || '';
  } catch {
    throw new AiCallError('AI provider returned an unreadable response');
  }
  if (!raw.trim()) throw new AiCallError('AI returned an empty response');

  try {
    return { data: JSON.parse(raw) as T, raw };
  } catch {
    throw new AiCallError('AI returned invalid JSON');
  }
}

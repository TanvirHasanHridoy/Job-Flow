// === Gemini API (Google AI Studio) Configuration ===
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
export const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
// export const DEEPSEEK_DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

export function getAiConfig() {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return {
      apiUrl: GEMINI_API_URL,
      apiKey: geminiKey,
      model: GEMINI_DEFAULT_MODEL,
      provider: 'Gemini'
    };
  }

  // Fallback to DeepSeek if GEMINI_API_KEY is not set
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  return {
    apiUrl: 'https://api.deepseek.com/chat/completions',
    apiKey: deepseekKey || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    provider: 'DeepSeek'
  };
}

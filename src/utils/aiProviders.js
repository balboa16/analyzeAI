import { buildPrompt, normalizeAnalysis, safeParseJson } from "./analysisEngine";

export const DEFAULT_OPENROUTER_MODEL = "xiaomi/mimo-v2-flash:free";

const systemMessage =
  "Ты клинический ассистент. Отвечай структурированно и безопасно, без диагнозов. Формат строго JSON.";

const buildMessages = (text) => [
  { role: "system", content: systemMessage },
  { role: "user", content: buildPrompt(text) }
];

const parseOpenRouterError = async (response) => {
  const raw = await response.text();
  let message = `OpenRouter недоступен (HTTP ${response.status})`;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      message =
        parsed?.error?.message ||
        parsed?.message ||
        parsed?.error ||
        message;
    } catch {
      message = raw;
    }
  }

  const error = new Error(message);
  error.status = response.status;
  error.raw = raw;
  return error;
};

export const analyzeWithOpenRouter = async ({ text, model, apiKey, signal }) => {
  if (!apiKey) {
    throw new Error("Нужен API ключ OpenRouter");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "AnalizAI"
    },
    body: JSON.stringify({
      model: model || DEFAULT_OPENROUTER_MODEL,
      messages: buildMessages(text),
      temperature: 0.2
    }),
    signal
  });

  if (!response.ok) {
    throw await parseOpenRouterError(response);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = safeParseJson(content);

  if (!parsed) {
    throw new Error("Ответ модели не распознан");
  }

  return normalizeAnalysis(parsed, { provider: "OpenRouter", model: model || DEFAULT_OPENROUTER_MODEL });
};

export const chatWithOpenRouter = async ({ messages, model, apiKey, signal }) => {
  if (!apiKey) {
    throw new Error("Нужен API ключ OpenRouter");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "AnalizAI"
    },
    body: JSON.stringify({
      model: model || DEFAULT_OPENROUTER_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 700
    }),
    signal
  });

  if (!response.ok) {
    throw await parseOpenRouterError(response);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
};

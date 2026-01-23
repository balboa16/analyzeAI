import { buildPrompt, normalizeAnalysis, safeParseJson } from "./analysisEngine";

export const DEFAULT_OPENROUTER_MODEL = "qwen/qwen-2.5-7b-instruct:free";

const systemMessage =
  "Ты клинический ассистент. Отвечай структурированно и безопасно, без диагнозов. Формат строго JSON.";
const strictSystemMessage =
  `${systemMessage} Возвращай только один JSON-объект без текста до или после.`;

const buildMessages = (text, strict = false) => [
  { role: "system", content: strict ? strictSystemMessage : systemMessage },
  { role: "user", content: buildPrompt(text) }
];

const parseApiError = async (response) => {
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

const callOpenRouterApi = async ({ messages, model, temperature, maxTokens, signal }) => {
  const response = await fetch("/api/openrouter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      model,
      temperature,
      max_tokens: maxTokens
    }),
    signal
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const data = await response.json();
  return data?.content || "";
};

export const analyzeWithOpenRouter = async ({ text, model, signal, strict = false }) => {
  const content = await callOpenRouterApi({
    messages: buildMessages(text, strict),
    model,
    temperature: 0.2,
    maxTokens: 900,
    signal
  });

  const parsed = safeParseJson(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const error = new Error("Ответ модели не распознан");
    error.code = "INVALID_JSON";
    error.content = content;
    throw error;
  }

  return normalizeAnalysis(parsed, {
    provider: "OpenRouter",
    model: model || DEFAULT_OPENROUTER_MODEL
  });
};

export const chatWithOpenRouter = async ({ messages, model, signal }) => {
  const content = await callOpenRouterApi({
    messages,
    model,
    temperature: 0.3,
    maxTokens: 700,
    signal
  });

  if (!content) {
    throw new Error("Пустой ответ модели");
  }

  return content;
};

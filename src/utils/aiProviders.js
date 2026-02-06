import {
  buildPrompt,
  normalizeAnalysis,
  safeParseJson,
} from "./analysisEngine";

export const DEFAULT_MODEL = "gpt-5-mini";

const systemMessage =
  "Ты медицинский аналитик. Отвечай структурированно и по существу, без диагнозов. Выдавай только JSON.";
const strictSystemMessage = `${systemMessage} Результат должен быть JSON-объект без текста до или после него.`;

const buildMessages = (text, strict = false) => [
  { role: "system", content: strict ? strictSystemMessage : systemMessage },
  { role: "user", content: buildPrompt(text) },
];

const parseApiError = async (response) => {
  const raw = await response.text();
  let message = `AI-сервис недоступен (HTTP ${response.status})`;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      message =
        parsed?.error?.message || parsed?.message || parsed?.error || message;
    } catch {
      message = raw;
    }
  }

  const error = new Error(message);
  error.status = response.status;
  error.raw = raw;
  return error;
};

const callApi = async ({ messages, model, signal }) => {
  const response = await fetch("/api/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model,
    }),
    signal,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const data = await response.json();
  return data?.content || "";
};

export const analyzeWithAI = async ({
  text,
  model,
  signal,
  strict = false,
}) => {
  const content = await callApi({
    messages: buildMessages(text, strict),
    model,
    signal,
  });

  const parsed = safeParseJson(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const error = new Error("Ответ модели не распознан");
    error.code = "INVALID_JSON";
    error.content = content;
    throw error;
  }

  return normalizeAnalysis(parsed, {
    provider: "OpenAI",
    model: model || DEFAULT_MODEL,
  });
};

export const chatWithAI = async ({ messages, model, signal }) => {
  const content = await callApi({
    messages,
    model,
    signal,
  });

  if (!content) {
    throw new Error("Пустой ответ модели");
  }

  return content;
};

import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import { chatWithOpenRouter, DEFAULT_OPENROUTER_MODEL } from "../utils/aiProviders";

const SYSTEM_PROMPT =
  "Ты медицинский консультант. Отвечай спокойно, без диагнозов и назначений. " +
  "Если данных мало — задавай уточняющие вопросы. Используй простой русский язык.";

const LEGACY_MODELS = ["meta-llama/llama-3.1-8b-instruct:free"];

const resolveStoredModel = (envModel) => {
  if (typeof window === "undefined") {
    return envModel;
  }

  const stored = window.localStorage.getItem("analizai_openrouter_model");
  if (!stored || LEGACY_MODELS.includes(stored)) {
    return envModel;
  }

  return stored;
};

const resolveStoredKey = (envKey) => {
  if (typeof window === "undefined") {
    return envKey;
  }

  if (envKey) {
    return envKey;
  }

  return window.localStorage.getItem("analizai_openrouter_key") || "";
};

export default function ChatBot() {
  const envOpenRouterKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_OPENROUTER_API_KEY || ""
      : "";
  const envOpenRouterModel =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
      : DEFAULT_OPENROUTER_MODEL;

  const [openRouterKey, setOpenRouterKey] = useState(() => resolveStoredKey(envOpenRouterKey));
  const [openRouterModel, setOpenRouterModel] = useState(() =>
    resolveStoredModel(envOpenRouterModel)
  );
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Здравствуйте! Я могу помочь разобраться с результатами анализов. Напишите, что вас беспокоит или какие показатели хотите обсудить."
    }
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("analizai_openrouter_key", openRouterKey);
  }, [openRouterKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("analizai_openrouter_model", openRouterModel);
  }, [openRouterModel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatOpenRouterError = (err) => {
    if (err?.status === 401 || err?.status === 403) {
      return "Неверный или заблокированный API ключ OpenRouter.";
    }
    if (err?.status === 429) {
      return "Превышен лимит запросов OpenRouter. Попробуйте позже.";
    }
    if (err?.status === 404) {
      return `Модель OpenRouter недоступна: ${openRouterModel}. Попробуйте другую модель.`;
    }
    return err?.message || "Ошибка запроса";
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) {
      return;
    }

    if (!openRouterKey) {
      setError("Добавьте API ключ OpenRouter, чтобы чат работал.");
      return;
    }

    setError("");
    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSending(true);

    try {
      const reply = await chatWithOpenRouter({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...nextMessages],
        model: openRouterModel,
        apiKey: openRouterKey,
        signal: controller.signal
      });

      if (!reply) {
        throw new Error("Пустой ответ модели");
      }

      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(`${formatOpenRouterError(err)} Попробуйте еще раз.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="section-pad" id="chat">
      <div className="container grid gap-10 lg:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Чат-консультант"
            title="Проверьте работу AI в простом чате"
            subtitle="Напишите вопрос о вашем самочувствии или уточните показатели — бот ответит на человеческом языке."
          />
          <div className="rounded-3xl border border-stroke bg-white/80 p-6">
            <p className="text-sm font-semibold text-ink">Настройки OpenRouter</p>
            <label className="mt-4 grid gap-2 text-xs font-semibold text-ink" htmlFor="chat-openrouter-key">
              API ключ OpenRouter
              <input
                id="chat-openrouter-key"
                type="password"
                className="rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink"
                value={openRouterKey}
                onChange={(event) => setOpenRouterKey(event.target.value)}
                placeholder="sk-or-..."
              />
            </label>
            <details className="mt-4 rounded-2xl border border-stroke bg-white px-4 py-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">Модель</summary>
              <label className="mt-3 grid gap-2 text-xs font-semibold text-ink" htmlFor="chat-openrouter-model">
                Модель OpenRouter
                <input
                  id="chat-openrouter-model"
                  className="rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink"
                  value={openRouterModel}
                  onChange={(event) => setOpenRouterModel(event.target.value)}
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>Текущая модель: {openRouterModel}</span>
                {envOpenRouterModel ? (
                  <button
                    type="button"
                    className="rounded-full border border-stroke px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setOpenRouterModel(envOpenRouterModel)}
                  >
                    Сбросить на {envOpenRouterModel}
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Можно задать через `VITE_OPENROUTER_MODEL` в `.env.local`.
              </p>
            </details>
            <p className="mt-3 text-xs text-muted">
              Советы носят информационный характер и не заменяют консультацию врача.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-stroke bg-white/90 p-6 shadow-soft">
          <div
            ref={scrollRef}
            className="max-h-[420px] space-y-4 overflow-y-auto rounded-2xl bg-bg/40 p-4"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-soft ${
                    msg.role === "user"
                      ? "bg-ink text-white"
                      : "bg-white text-ink border border-stroke"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <textarea
              className="min-h-[90px] rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink"
              placeholder="Например: Я загрузил анализы, холестерин 5.9 — что это значит?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">Shift + Enter для новой строки</p>
              <Button type="button" onClick={handleSend} disabled={isSending}>
                {isSending ? "Отправляем..." : "Отправить"}
              </Button>
            </div>
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

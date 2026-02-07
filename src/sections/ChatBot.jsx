import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import { chatWithAI } from "../utils/aiProviders";

const SYSTEM_PROMPT =
  "Ты медицинский консультант. Отвечай спокойно, без диагнозов и назначений. " +
  "Если данных мало — задавай уточняющие вопросы. Используй простой русский язык.";

const quickChips = [
  "Холестерин 5.9 — это опасно?",
  "Что значит витамин D 22?",
  "Мой гемоглобин 110",
  "Повышен АСТ, что делать?",
];

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Здравствуйте! Я могу помочь разобраться с результатами анализов. Напишите, что вас беспокоит или какие показатели хотите обсудить.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatAIError = (err) => {
    if (err?.status === 401 || err?.status === 403) {
      return "Ключ AI не настроен или недействителен.";
    }
    if (err?.status === 429) {
      return "AI-консультант временно недоступен из-за высокой нагрузки. Попробуйте через 10–15 минут или используйте расшифровку анализов выше.";
    }
    if (err?.status === 404) {
      return "Модель AI недоступна. Попробуйте позже.";
    }
    if (err?.message?.includes("not configured")) {
      return "Ключ AI не задан на сервере. Проверьте переменные окружения.";
    }
    return err?.message || "Ошибка запроса";
  };

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message || isSending) return;

    setError("");
    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSending(true);

    try {
      const reply = await chatWithAI({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...nextMessages],
        signal: controller.signal,
      });
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(`${formatAIError(err)} Попробуйте еще раз.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="section-pad" id="chat">
      <div className="container grid gap-8 lg:grid-cols-[1fr,1fr] lg:gap-10">
        <div className="flex flex-col gap-5">
          <SectionHeading
            eyebrow="Чат-консультант"
            title="Проверьте работу AI в простом чате"
            subtitle="Напишите вопрос о вашем самочувствии или уточните показатели — бот ответит на человеческом языке."
          />
          <p className="text-xs text-muted">
            AI отвечает автоматически и простым языком. Советы носят
            информационный характер и не заменяют консультацию врача.
          </p>
        </div>

        <div className="rounded-[16px] border border-stroke bg-white p-4 shadow-soft sm:p-6">
          {/* Chat messages */}
          <div
            ref={scrollRef}
            className="max-h-[360px] space-y-4 overflow-y-auto rounded-[12px] bg-[var(--bg-softer)] p-3 sm:max-h-[400px] sm:p-4 md:max-h-[440px]"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[12px] px-4 py-3 text-sm shadow-soft sm:max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-ink text-white"
                      : "border border-stroke bg-white text-ink"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[12px] border border-stroke bg-white px-4 py-3 shadow-soft">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          {messages.length <= 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-stroke bg-[var(--bg-soft)] px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
                  onClick={() => sendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="mt-3 flex items-end gap-2">
            <textarea
              className="min-h-[44px] flex-1 resize-none rounded-[12px] border border-stroke bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              placeholder="Введите вопрос..."
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="shrink-0 !px-3 !py-3"
              aria-label="Отправить"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </Button>
          </div>
          <p className="mt-2 hidden text-xs text-muted sm:block">
            Shift + Enter для новой строки
          </p>
          {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

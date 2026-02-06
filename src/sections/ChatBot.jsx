import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import { chatWithOpenRouter } from "../utils/aiProviders";

const SYSTEM_PROMPT =
  "Ты медицинский консультант. Отвечай спокойно, без диагнозов и назначений. " +
  "Если данных мало — задавай уточняющие вопросы. Используй простой русский язык.";

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

  const formatOpenRouterError = (err) => {
    if (err?.status === 401 || err?.status === 403) {
      return "Ключ OpenRouter не настроен или недействителен.";
    }
    if (err?.status === 429) {
      return "AI-консультант временно недоступен из-за высокой нагрузки. Попробуйте через 10–15 минут или используйте расшифровку анализов выше.";
    }
    if (err?.status === 404) {
      return "Модель OpenRouter недоступна. Попробуйте другую модель или позже.";
    }
    if (err?.message?.includes("not configured")) {
      return "Ключ OpenRouter не задан на сервере. Проверьте переменные окружения.";
    }
    return err?.message || "Ошибка запроса";
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) {
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
        signal: controller.signal,
      });

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
          <p className="text-xs text-muted">
            AI отвечает автоматически и простым языком. Советы носят
            информационный характер и не заменяют консультацию врача.
          </p>
        </div>

        <div className="rounded-[16px] border border-stroke bg-white p-6 shadow-soft">
          <div
            ref={scrollRef}
            className="max-h-[320px] space-y-4 overflow-y-auto rounded-[12px] bg-[var(--bg-softer)] p-4 sm:max-h-[360px] md:max-h-[420px]"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[12px] px-4 py-3 text-sm shadow-soft ${
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
              className="min-h-[90px] rounded-[12px] border border-stroke bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              placeholder="Например: Я загрузил анализы, холестерин 5.9 — что это значит?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Shift + Enter для новой строки
              </p>
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="w-full sm:w-auto"
              >
                {isSending ? "Отправляем..." : "Отправить"}
              </Button>
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

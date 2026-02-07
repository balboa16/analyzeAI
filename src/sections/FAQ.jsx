import { useState } from "react";
import SectionHeading from "../components/SectionHeading";

const faqs = [
  {
    question: "Нужно ли идти к врачу после расшифровки?",
    answer:
      "Если есть отклонения или жалобы — да. Мы показываем, какие шаги лучше обсудить с врачом.",
  },
  {
    question: "Какие анализы поддерживаются?",
    answer:
      "Биохимия, общий анализ крови, гормоны, витамины, липидный профиль, железо и другие.",
  },
  {
    question: "Как быстро приходит результат?",
    answer: "Обычно 1–3 минуты. В демо-режиме — за секунды.",
  },
  {
    question: "Безопасно ли загружать анализы?",
    answer:
      "Мы используем защищенное хранение и не передаем данные третьим лицам без согласия.",
  },
  {
    question: "Это бесплатно?",
    answer:
      "Расшифровка бесплатна в бета-режиме. Дополнительные услуги — консультации, чекапы — платные.",
  },
];

function FAQItem({ faq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`rounded-[12px] border bg-white px-5 py-4 transition-colors sm:px-6 ${
        isOpen ? "border-accent/40" : "border-stroke"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-ink">{faq.question}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-sm text-muted">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="section-pad" id="faq">
      <div className="container flex flex-col gap-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Частые вопросы"
          subtitle="Коротко отвечаем на главные сомнения перед загрузкой анализов."
        />
        <div className="mx-auto grid w-full max-w-2xl gap-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

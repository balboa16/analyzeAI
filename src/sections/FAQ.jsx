import SectionHeading from "../components/SectionHeading";

const faqs = [
  {
    question: "Нужно ли идти к врачу после расшифровки?",
    answer:
      "Если есть отклонения или жалобы — да. Мы показываем, какие шаги лучше обсудить с врачом."
  },
  {
    question: "Какие анализы поддерживаются?",
    answer:
      "Биохимия, общий анализ крови, гормоны, витамины, липидный профиль, железо и другие."
  },
  {
    question: "Как быстро приходит результат?",
    answer: "Обычно 1–3 минуты. В демо-режиме — за секунды."
  },
  {
    question: "Безопасно ли загружать анализы?",
    answer:
      "Мы используем защищенное хранение и не передаем данные третьим лицам без согласия."
  }
];

export default function FAQ() {
  return (
    <section className="section-pad" id="faq">
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="FAQ"
          title="Частые вопросы"
          subtitle="Коротко отвечаем на главные сомнения перед загрузкой анализов."
        />
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-2xl border border-stroke bg-white/90 px-6 py-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

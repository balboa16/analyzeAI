import SectionHeading from "../components/SectionHeading";

const icons = {
  upload: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  ),
  report: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  next: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M11 8l4 4-4 4" />
    </svg>
  ),
};

const steps = [
  {
    icon: "upload",
    title: "Загрузите анализы",
    text: "Фото, PDF или ручной ввод — все форматы в одном месте.",
  },
  {
    icon: "report",
    title: "Получите понятный разбор",
    text: "Понятные объяснения каждого показателя без медицинского жаргона.",
  },
  {
    icon: "next",
    title: "Выберите следующий шаг",
    text: "Рекомендации, чек-ап или консультация — без лишних переходов.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-pad" id="how">
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="Всего 3 шага"
          title="Как это работает"
          subtitle="Мы собрали путь в три простых действия, чтобы вы не тратили время на поиски по форумам."
        />
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="card flex h-full flex-col gap-3 bg-white animate-fade-up sm:gap-4"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--success-soft)] text-accent sm:h-11 sm:w-11">
                {icons[step.icon]}
              </div>
              <h3 className="text-xl text-ink sm:text-2xl">{step.title}</h3>
              <p className="text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import SectionHeading from "../components/SectionHeading";

const items = [
  {
    title: "Питание",
    description: "Сценарии меню на неделю, список покупок и локальные продукты.",
    highlight: "Привычная кухня Кыргызстана"
  },
  {
    title: "Витамины",
    description: "Точные дозировки, длительность курса и напоминания.",
    highlight: "Без лишних добавок"
  },
  {
    title: "Образ жизни",
    description: "Сон, стресс, движение и чек-листы для результата.",
    highlight: "Легко соблюдать"
  }
];

export default function Recommendations() {
  return (
    <section className="section-pad" id="recommendations">
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="Персональный план"
          title="Рекомендации, которые реально выполнять"
          subtitle="Мы даем конкретные шаги: что есть, как двигаться и какие привычки усилят эффект лечения."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="card relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--success-soft)] blur-2xl" />
              <p className="text-xs uppercase tracking-[0.25em] text-muted">{item.highlight}</p>
              <h3 className="mt-3 text-2xl text-ink">{item.title}</h3>
              <p className="mt-3 text-sm text-muted">{item.description}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted">
                <span className="pill">Под ваши анализы</span>
                <span className="pill">Без перегруза</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

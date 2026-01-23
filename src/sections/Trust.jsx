import SectionHeading from "../components/SectionHeading";

const testimonials = [
  {
    name: "Нурлан, 34",
    text:
      "Понял, почему постоянно устал. Получил рекомендации и записался к врачу за 5 минут."
  },
  {
    name: "Айжамал, 42",
    text:
      "Все объяснили простыми словами, даже маме стало понятно. Теперь наблюдаемся вместе."
  },
  {
    name: "Руслан, 29",
    text:
      "Удобно, что сразу предложили чекап. Никакой путаницы с анализами."
  }
];

const certificates = ["ISO 15189", "Минздрав КР", "KDL Partner", "HIPAA-ready"];

export default function Trust() {
  return (
    <section className="section-pad" id="trust">
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="Доверие"
          title="От врачей клиники и пациентов"
          subtitle="Мы работаем вместе с клиницистами, поэтому рекомендации опираются на реальные протоколы."
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <div key={item.name} className="card h-full">
                <p className="text-sm text-muted">“{item.text}”</p>
                <p className="mt-4 text-xs font-semibold text-ink">{item.name}</p>
              </div>
            ))}
          </div>
          <div className="card flex flex-col gap-6 bg-white/95">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Сертификаты</p>
              <h3 className="mt-3 text-2xl text-ink">Прозрачность и контроль качества</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {certificates.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center rounded-2xl border border-stroke bg-bg/70 px-3 py-4 text-xs font-semibold text-muted"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-stroke bg-white px-4 py-4 text-xs text-muted">
              Врач проверяет все рекомендации перед отправкой пользователю.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

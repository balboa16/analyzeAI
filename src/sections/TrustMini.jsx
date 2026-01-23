const items = [
  "Сервис SAPATLAB",
  "Данные не сохраняются без согласия",
  "Результат носит информационный характер"
];

export default function TrustMini() {
  return (
    <section className="section-pad" id="safety">
      <div className="container">
        <div className="card grid gap-6 md:grid-cols-[0.7fr,1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Безопасность
            </p>
            <h3 className="mt-3 text-2xl text-ink">Безопасно и официально</h3>
            <p className="mt-2 text-sm text-muted">
              Работаем по медицинским стандартам и прозрачным правилам.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-muted">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

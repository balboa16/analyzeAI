import Badge from "../components/Badge";
import SectionHeading from "../components/SectionHeading";

const reportMetrics = [
  {
    name: "Гемоглобин",
    value: "126 г/л",
    note: "Норма",
    tone: "success",
  },
  {
    name: "Холестерин",
    value: "5.9 ммоль/л",
    note: "Выше нормы",
    tone: "danger",
  },
  {
    name: "Витамин D",
    value: "22 нг/мл",
    note: "Ниже нормы",
    tone: "warning",
  },
];

const bullets = [
  "Итог по здоровью без диагнозов",
  "Показатели по группам и статусам",
  "Рекомендации по питанию и привычкам",
  "Следующий шаг: досдать или выбрать пакет",
];

export default function ReportExample() {
  return (
    <section className="section-pad" id="report">
      <div className="container grid gap-10 lg:grid-cols-[1fr,1fr] lg:items-center">
        <div className="card flex flex-col gap-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Отчёт SAPATLAB
              </p>
              <h3 className="mt-2 text-xl text-ink sm:text-2xl">
                Как выглядит отчёт
              </h3>
            </div>
            <span className="pill">PDF</span>
          </div>
          <div className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-3">
            <p className="text-xs text-muted">Итог</p>
            <p className="text-sm font-semibold text-ink">
              Основная картина стабильна, есть 2 показателя вне нормы.
            </p>
          </div>
          <div className="grid gap-3">
            {reportMetrics.map((metric) => (
              <div
                key={metric.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-stroke bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {metric.name}
                  </p>
                  <p className="text-xs text-muted">{metric.value}</p>
                </div>
                <Badge label={metric.note} tone={metric.tone} />
              </div>
            ))}
          </div>
          <div className="rounded-[12px] border border-stroke bg-white px-4 py-4">
            <p className="text-sm font-semibold text-ink">Рекомендации</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>• Добавить витамин D по схеме врача</li>
              <li>• Контроль липидов через 4 недели</li>
              <li>• Уточнить питание и режим сна</li>
            </ul>
          </div>
          <p className="text-xs text-muted">
            Информация носит справочный характер и не заменяет консультацию
            врача.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Пример отчёта"
            title="Что вы получите на выходе"
            subtitle="Отчёт оформлен так, чтобы его можно было показать врачу или сохранить для себя."
          />
          <ul className="grid gap-3 text-sm text-muted">
            {bullets.map((item) => (
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

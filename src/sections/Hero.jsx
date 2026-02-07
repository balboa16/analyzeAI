import Button from "../components/Button";
import Badge from "../components/Badge";

const stats = [
  { value: "10+", label: "типов анализов" },
  { value: "2 мин", label: "время анализа" },
  { value: "24/7", label: "доступность" },
];

const heroBadges = ["Конфиденциально", "Понятно пациенту", "PDF для врача"];

const previewMetrics = [
  { name: "Витамин D", value: "22 нг/мл", note: "Ниже нормы", tone: "warning" },
  { name: "Глюкоза", value: "5.1 ммоль/л", note: "В норме", tone: "success" },
  { name: "АСТ", value: "42 ЕД/л", note: "Выше нормы", tone: "danger" },
];

export default function Hero() {
  return (
    <section className="section-pad pt-16 sm:pt-20 md:pt-24" id="top">
      <div className="container grid gap-8 sm:gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
        <div className="flex flex-col gap-5 sm:gap-6">
          <span
            className="pill animate-fade-up self-start"
            style={{ animationDelay: "0ms" }}
          >
            Официальный сервис SAPATLAB
          </span>
          <h1
            className="text-3xl font-semibold text-ink sm:text-4xl md:text-5xl lg:text-6xl text-balance animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Расшифровка анализов от SAPATLAB за 1–2 минуты
          </h1>
          <p
            className="text-base text-muted md:text-lg animate-fade-up"
            style={{ animationDelay: "140ms" }}
          >
            Загрузите PDF или фото результатов. Получите понятный вывод и
            рекомендации, что делать дальше.
          </p>
          <div
            className="flex flex-wrap gap-2 animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            {heroBadges.map((item) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>
          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            <Button as="a" href="#demo" className="w-full sm:w-auto pulse-cta">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 15V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M4 20h16" />
              </svg>
              Загрузить анализы
            </Button>
            <Button
              as="a"
              href="#report"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Посмотреть пример отчёта
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className="rounded-2xl border border-stroke bg-white px-3 py-2.5 sm:px-4 sm:py-3 animate-fade-up"
                style={{ animationDelay: `${260 + index * 80}ms` }}
              >
                <p className="text-lg font-semibold text-ink sm:text-xl">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden sm:block">
          <div className="absolute -top-8 left-8 hidden h-24 w-24 rounded-full floating-orb opacity-50 blur-xl lg:block" />
          <div className="absolute -bottom-8 right-6 hidden h-20 w-20 rounded-full floating-orb opacity-50 blur-xl lg:block" />
          <div className="relative rounded-[16px] border border-stroke bg-white p-5 shadow-soft sm:p-6">
            <div className="hero-gradient rounded-[12px] border border-stroke/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Пример отчёта
                  </p>
                  <h3 className="text-xl text-ink sm:text-2xl">
                    Итог по анализам
                  </h3>
                </div>
                <span className="pill">Информационный</span>
              </div>
              <div className="mt-4 rounded-[12px] border border-stroke bg-white px-4 py-3">
                <p className="text-xs text-muted">Итог</p>
                <p className="text-sm font-semibold text-ink">
                  Основные показатели в норме, есть 2 отклонения.
                </p>
              </div>
              <div className="mt-3 grid gap-2.5">
                {previewMetrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-stroke bg-white px-4 py-2.5"
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
              <div className="mt-3 rounded-[12px] border border-stroke bg-white px-4 py-3">
                <p className="text-sm font-semibold text-ink">Рекомендации</p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  <li>• Добавить витамин D по схеме врача</li>
                  <li>• Повторить АСТ через 3–4 недели</li>
                  <li>• Поддерживать питьевой режим</li>
                </ul>
              </div>
              <p className="mt-3 text-[11px] text-muted">
                Отчёт не является диагнозом и не заменяет консультацию врача.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

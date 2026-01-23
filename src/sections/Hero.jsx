import Button from "../components/Button";

const stats = [
  { value: "120K+", label: "пользователей по Кыргызстану" },
  { value: "2 мин", label: "среднее время анализа" },
  { value: "24/7", label: "доступность сервиса" }
];

export default function Hero() {
  return (
    <section className="section-pad pt-20 md:pt-24" id="top">
      <div className="container grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <span className="pill animate-fade-up" style={{ animationDelay: "0ms" }}>
            От врачей клиники в Бишкеке
          </span>
          <h1
            className="text-4xl font-semibold text-ink md:text-5xl lg:text-6xl text-balance animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Пойми свои анализы за 2 минуты
          </h1>
          <p
            className="text-base text-muted md:text-lg animate-fade-up"
            style={{ animationDelay: "140ms" }}
          >
            Без медицинских терминов. С понятными рекомендациями врача, питанием и образом жизни —
            сразу в телефоне.
          </p>
          <div
            className="flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <Button as="a" href="#demo">
              Загрузить анализы
            </Button>
            <Button as="a" href="#how" variant="secondary">
              Как это работает
            </Button>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className="rounded-2xl border border-stroke bg-white px-4 py-3 animate-fade-up"
                style={{ animationDelay: `${260 + index * 80}ms` }}
              >
                <p className="text-xl font-semibold text-ink">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-8 left-8 hidden h-24 w-24 rounded-full floating-orb opacity-50 blur-xl lg:block" />
          <div className="absolute -bottom-8 right-6 hidden h-20 w-20 rounded-full floating-orb opacity-50 blur-xl lg:block" />
          <div className="relative rounded-[16px] border border-stroke bg-white p-6 shadow-soft">
            <div className="hero-gradient rounded-[12px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Экспресс-разбор
                  </p>
                  <h3 className="text-2xl text-ink">Ваши анализы понятны</h3>
                </div>
                <span className="pill">AI + врач</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <p className="text-xs text-muted">Витамин D</p>
                  <p className="text-lg font-semibold text-ink">22 нг/мл</p>
                  <p className="text-xs text-warning">Ниже нормы</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <p className="text-xs text-muted">Глюкоза</p>
                  <p className="text-lg font-semibold text-ink">5.1 ммоль/л</p>
                  <p className="text-xs text-success">В норме</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Диета",
                  "Движение",
                  "Витамины",
                  "Чекап",
                  "Консультация"
                ].map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[16px]">
                <img
                  src="https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=900&q=80"
                  alt="Врач"
                  className="h-48 w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="overflow-hidden rounded-[16px]">
                <img
                  src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80"
                  alt="Пациент"
                  className="h-48 w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Проверено врачом и клиническими алгоритмами
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

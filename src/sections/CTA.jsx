import Button from "../components/Button";

export default function CTA() {
  return (
    <section className="section-pad" id="cta">
      <div className="container">
        <div className="relative overflow-hidden rounded-[40px] border border-stroke bg-ink px-8 py-12 text-white shadow-soft">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-accent2/30 blur-2xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                Бесплатный старт
              </p>
              <h2 className="mt-4 text-3xl md:text-4xl">Получить расшифровку бесплатно</h2>
              <p className="mt-3 text-sm text-white/80">
                Попробуйте демо-анализ уже сегодня и получите первую подборку рекомендаций.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button as="a" href="#demo" className="w-full sm:w-auto">
                Загрузить анализы
              </Button>
              <Button as="a" href="#products" variant="secondary" className="w-full sm:w-auto">
                Записаться в клинику
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

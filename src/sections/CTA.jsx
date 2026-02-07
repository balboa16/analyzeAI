import Button from "../components/Button";

export default function CTA() {
  return (
    <section className="section-pad" id="cta">
      <div className="container">
        <div className="relative overflow-hidden rounded-[16px] border border-stroke bg-accent px-6 py-10 text-white shadow-soft sm:px-8 sm:py-12">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">
              Бесплатный старт
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl">
              Получить расшифровку бесплатно
            </h2>
            <p className="max-w-md text-sm text-white/80">
              Загрузите PDF или фото анализов и получите отчёт с понятными
              рекомендациями за 1–2 минуты.
            </p>
            <Button
              as="a"
              href="#demo"
              variant="secondary"
              className="w-full text-accent sm:w-auto"
            >
              Загрузить анализы
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

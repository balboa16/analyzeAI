import Button from "../components/Button";

export default function PreProductsCTA() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="card flex flex-col gap-6 bg-[var(--bg-soft)] md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl text-ink">Готовы перейти к следующему шагу?</h3>
            <p className="mt-2 text-sm text-muted">
              Получите разбор или выберите подходящий пакет анализов.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button as="a" href="#demo" className="w-full sm:w-auto">
              Получить разбор
            </Button>
            <Button as="a" href="#products" variant="secondary" className="w-full sm:w-auto">
              Смотреть пакеты
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

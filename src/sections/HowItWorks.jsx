import SectionHeading from "../components/SectionHeading";

const steps = [
  {
    number: "01",
    title: "Загрузите анализы",
    text: "Фото, PDF или ручной ввод — все форматы в одном месте."
  },
  {
    number: "02",
    title: "Получите расшифровку",
    text: "Понятные объяснения каждого показателя без медицинского жаргона."
  },
  {
    number: "03",
    title: "Получите план",
    text: "Питание, витамины, образ жизни и быстрый доступ к врачу."
  }
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
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="card flex h-full flex-col gap-4 bg-white animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="text-sm font-semibold text-muted">{step.number}</div>
              <h3 className="text-2xl text-ink">{step.title}</h3>
              <p className="text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

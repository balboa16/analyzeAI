import { useState } from "react";
import Button from "../components/Button";
import InputField from "../components/InputField";
import SectionHeading from "../components/SectionHeading";

const products = [
  {
    title: "Онлайн консультация врача",
    price: "от 990 сом",
    description: "15–20 минут с врачом, который объяснит план и ответит на вопросы.",
    bullets: ["Разбор анализов в чате", "Рекомендации по лечению", "Ответы на вопросы"],
    tag: "Популярно"
  },
  {
    title: "Полный чекап",
    price: "от 6 900 сом",
    description: "Комплекс обследований под ваш возраст и симптомы.",
    bullets: ["25+ показателей", "Локальные клиники SAPAT", "Сопровождение администратора"],
    tag: "Лучший старт"
  },
  {
    title: "Индивидуальный план",
    price: "от 2 400 сом",
    description: "Расширенные рекомендации на 30 дней и сопровождение.",
    bullets: ["Питание и витамины", "План активности", "Контроль динамики"],
    tag: "Новый уровень"
  },
  {
    title: "Запись в клинику",
    price: "без комиссии",
    description: "Мы подберем ближайшую клинику и удобное время приема.",
    bullets: ["Подбор по району", "Напоминание о визите", "Согласование времени"],
    tag: "Удобно"
  }
];

export default function Products() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="section-pad" id="products">
      <div className="container grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Продукты"
            title="Продолжение после расшифровки"
            subtitle="Когда нужны медицинские решения — мы сразу предлагаем удобные варианты без поиска по городу."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.title} className="card flex flex-col gap-4">
                <span className="pill">{product.tag}</span>
                <div>
                  <h3 className="text-xl text-ink">{product.title}</h3>
                  <p className="text-sm text-muted">{product.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-muted">
                  {product.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{product.price}</p>
                  <Button as="a" href="#cta" variant="secondary">
                    Записаться
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card flex flex-col gap-6 bg-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Форма записи</p>
            <h3 className="mt-3 text-2xl text-ink">Оставьте контакты</h3>
            <p className="mt-2 text-sm text-muted">
              Мы свяжемся в WhatsApp или по телефону и предложим подходящий вариант.
            </p>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <InputField id="name" label="Имя" placeholder="Например, Айжан" required />
            <InputField
              id="phone"
              label="Телефон"
              type="tel"
              placeholder="+996 ___ ___ ___"
              required
            />
            <InputField
              id="whatsapp"
              label="WhatsApp"
              type="tel"
              placeholder="Номер WhatsApp (если отличается)"
            />
            <Button type="submit" className="w-full justify-center">
              Записаться на консультацию
            </Button>
            {submitted ? (
              <p className="rounded-2xl border border-[rgba(31,127,92,0.25)] bg-[var(--success-soft)] px-4 py-3 text-xs text-success">
                Спасибо! Мы уже готовим подходящий вариант консультации.
              </p>
            ) : null}
          </form>
          <div className="rounded-2xl border border-stroke bg-[var(--bg-soft)] px-4 py-4 text-xs text-muted">
            Менеджер ответит в течение 15 минут в рабочее время.
          </div>
        </div>
      </div>
    </section>
  );
}

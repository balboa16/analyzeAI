import { useState } from "react";
import Button from "../components/Button";

const navItems = [
  { label: "Как работает", href: "#how" },
  { label: "Демо", href: "#demo" },
  { label: "Чат", href: "#chat" },
  { label: "Рекомендации", href: "#recommendations" },
  { label: "Продукты", href: "#products" },
  { label: "Отзывы", href: "#trust" },
  { label: "FAQ", href: "#faq" }
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stroke/60 bg-bg/80 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white">
            АА
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">АнализAI</p>
            <p className="text-xs text-muted">Клиническая расшифровка</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button as="a" href="#demo" className="hidden lg:inline-flex">
            Загрузить анализы
          </Button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white text-ink lg:hidden"
            aria-label="Открыть меню"
            onClick={() => setIsOpen(true)}
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </div>
      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden">
          <div className="absolute right-4 top-4 w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Навигация</p>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stroke text-ink"
                aria-label="Закрыть меню"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-4 text-sm font-medium text-muted">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-ink"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <Button
              as="a"
              href="#demo"
              className="mt-6 w-full justify-center"
              onClick={() => setIsOpen(false)}
            >
              Загрузить анализы
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

import { useEffect, useState } from "react";
import Button from "../components/Button";
import logo from "../assets/sapat-logo.png";

const navItems = [
  { label: "Как работает", href: "#how" },
  { label: "AI-разбор", href: "#demo" },
  { label: "Пример отчёта", href: "#report" },
  { label: "Доверие", href: "#safety" },
  { label: "Пакеты", href: "#products" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-stroke bg-white/90 backdrop-blur">
      <div className="container flex items-center justify-between py-3 sm:py-4">
        <a href="#top" className="flex flex-col gap-0.5">
          <div className="flex h-10 items-center sm:h-12 md:h-14">
            <img
              src={logo}
              alt="SAPATLAB"
              className="h-10 w-auto sm:h-12 md:h-14"
            />
          </div>
          <p className="hidden text-xs text-muted sm:block md:text-sm">
            Клиническая расшифровка
          </p>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-ink"
            >
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stroke bg-white text-ink lg:hidden"
            aria-label="Открыть меню"
            onClick={() => setIsOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-[rgba(27,27,27,0.4)] backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute right-3 top-3 w-[calc(100%-1.5rem)] max-w-sm rounded-[16px] bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Навигация</p>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke text-ink"
                aria-label="Закрыть меню"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-[10px] px-3 py-3 text-sm font-medium text-muted transition hover:bg-[var(--bg-soft)] hover:text-ink"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <Button
              as="a"
              href="#demo"
              className="mt-4 w-full justify-center"
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

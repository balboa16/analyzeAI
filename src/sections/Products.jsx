import { useEffect, useMemo } from "react";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import {
  DEFAULT_WHATSAPP_NUMBER,
  productsConfig,
} from "../data/productsConfig";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];
const UTM_STORAGE_KEY = "sapatlab_utms";

const formatPrice = (priceFrom) =>
  priceFrom ? `от ${priceFrom.toLocaleString("ru-RU")} сом` : "без комиссии";

const storeUtmFromUrl = () => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const existingRaw = window.localStorage.getItem(UTM_STORAGE_KEY);
  let existing = {};
  try {
    existing = existingRaw ? JSON.parse(existingRaw) : {};
  } catch {
    existing = {};
  }
  const next = { ...existing };

  let hasAny = false;
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      next[key] = value;
      hasAny = true;
    }
  });

  if (hasAny) {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(next));
  }
};

const buildWhatsAppUrl = (product) => {
  const whatsappNumber = (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_WHATSAPP_NUMBER) ||
    DEFAULT_WHATSAPP_NUMBER
  )
    .replace(/\D/g, "")
    .trim();

  const message = `Здравствуйте! Интересует: ${product.title}. Источник: ${typeof window !== "undefined" ? window.location.host : "analyze.sapatlab.kg"}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

export default function Products() {
  const visibleProducts = useMemo(
    () => productsConfig.filter((product) => product.showInCards !== false),
    [],
  );

  useEffect(() => {
    storeUtmFromUrl();
  }, []);

  return (
    <section className="section-pad" id="products">
      <div className="container flex flex-col gap-8">
        <SectionHeading
          eyebrow="Следующий шаг"
          title="Выберите удобный формат помощи"
          subtitle="Консультация, чекап или запись в клинику — напишите в WhatsApp, мы ответим за 15 минут."
        />

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 overflow-x-auto snap-x-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <div
                key={product.id}
                className={`card relative flex min-w-[280px] shrink-0 snap-start flex-col gap-4 sm:min-w-0 ${
                  index === 0 ? "border-accent/40" : ""
                }`}
              >
                {/* Popular badge on first card */}
                {index === 0 && (
                  <span className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-white shadow-soft">
                    Популярно
                  </span>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {product.tag}
                  </p>
                  <span className="text-xs font-semibold text-ink">
                    {formatPrice(product.price_from)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg text-ink sm:text-xl">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted">{product.purpose}</p>
                </div>
                <ul className="space-y-2 text-sm text-muted">
                  {product.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {/* Response time badge */}
                <div className="mt-auto flex flex-col gap-3">
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--bg-soft)] px-3 py-1 text-xs text-muted">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Ответим за 15 минут
                  </span>
                  <Button
                    as="a"
                    href={buildWhatsAppUrl(product)}
                    target="_blank"
                    rel="noreferrer"
                    variant="whatsapp"
                    className="w-full justify-center"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Написать в WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          Менеджер ответит в течение 15 минут в рабочее время.
        </p>
      </div>
    </section>
  );
}

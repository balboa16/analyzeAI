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
  if (typeof window === "undefined") {
    return;
  }

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <div key={product.id} className="card flex h-full flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {product.tag}
                </p>
                <span className="text-xs font-semibold text-ink">
                  {formatPrice(product.price_from)}
                </span>
              </div>
              <div>
                <h3 className="text-xl text-ink">{product.title}</h3>
                <p className="text-sm text-muted">{product.purpose}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {product.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                as="a"
                href={buildWhatsAppUrl(product)}
                target="_blank"
                rel="noreferrer"
                className="mt-auto w-full justify-center"
              >
                Написать в WhatsApp
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted">
          Менеджер ответит в течение 15 минут в рабочее время.
        </p>
      </div>
    </section>
  );
}

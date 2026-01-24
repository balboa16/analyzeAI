import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button";
import InputField from "../components/InputField";
import SectionHeading from "../components/SectionHeading";
import { DEFAULT_WHATSAPP_NUMBER, productsConfig } from "../data/productsConfig";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const UTM_STORAGE_KEY = "sapatlab_utms";
const LEADS_STORAGE_KEY = "sapatlab_leads";

const formatPrice = (priceFrom) =>
  priceFrom ? `от ${priceFrom.toLocaleString("ru-RU")} сом` : "без комиссии";

const fillTemplate = (template, data) =>
  template.replace(/\{(\w+)\}/g, (match, key) => data[key] ?? "");

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

const getStoredUtms = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const storeLeadLocally = (payload) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const stored = window.localStorage.getItem(LEADS_STORAGE_KEY);
    const leads = stored ? JSON.parse(stored) : [];
    leads.push(payload);
    window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    console.info("Lead stored locally", payload);
  } catch (error) {
    console.info("Failed to store lead locally", error);
  }
};

export default function Products() {
  const visibleProducts = useMemo(
    () => productsConfig.filter((product) => product.showInCards !== false),
    []
  );
  const defaultProductId = visibleProducts[0]?.id || productsConfig[0]?.id || "consult";

  const [selectedProductId, setSelectedProductId] = useState(defaultProductId);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    time: "",
    consent: false
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ status: "idle", whatsappUrl: "" });

  const formRef = useRef(null);

  const selectedProduct = useMemo(
    () =>
      productsConfig.find((product) => product.id === selectedProductId) || visibleProducts[0],
    [selectedProductId, visibleProducts]
  );

  useEffect(() => {
    storeUtmFromUrl();
  }, []);

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setSubmitState({ status: "idle", whatsappUrl: "" });
    setFormError("");

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConsentChange = (event) => {
    setFormData((prev) => ({ ...prev, consent: event.target.checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const whatsapp = formData.whatsapp.trim() || phone;

    if (!name || !phone || !formData.consent) {
      setFormError("Пожалуйста, заполните имя, телефон и подтвердите согласие.");
      return;
    }

    if (!selectedProduct) {
      setFormError("Выберите продукт для заявки.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER)
      .replace(/\D/g, "")
      .trim();

    const templateData = {
      product: selectedProduct.title,
      name,
      phone,
      whatsapp,
      time: formData.time.trim() || "не указано",
      city: "Бишкек",
      source: window.location.host
    };

    const message = fillTemplate(selectedProduct.whatsapp_template, templateData);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    try {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      // ignore popup errors
    }

    const payload = {
      productId: selectedProduct.id,
      productTitle: selectedProduct.title,
      name,
      phone,
      whatsapp,
      preferredTime: formData.time.trim(),
      createdAt: new Date().toISOString(),
      pageUrl: window.location.href,
      ...getStoredUtms()
    };

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error("Lead request failed");
      }

      if (!result.forwarded) {
        storeLeadLocally(payload);
      }
    } catch {
      storeLeadLocally(payload);
    } finally {
      setIsSubmitting(false);
      setSubmitState({ status: "success", whatsappUrl });
    }
  };

  return (
    <section className="section-pad" id="products">
      <div className="container flex flex-col gap-8">
        <SectionHeading
          eyebrow="Следующий шаг"
          title="Выберите удобный формат помощи"
          subtitle="Консультация, чекап или запись в клинику — без лишних действий."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
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
                  type="button"
                  onClick={() => handleSelectProduct(product.id)}
                  className="mt-auto w-full justify-center"
                >
                  Записаться
                </Button>
              </div>
            ))}
          </div>

          <div ref={formRef} className="card flex h-fit flex-col gap-6 bg-white">
            {submitState.status === "success" ? (
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Заявка принята</p>
                  <h3 className="mt-2 text-2xl text-ink">Мы уже готовим ответ</h3>
                  <p className="mt-2 text-sm text-muted">
                    Менеджер ответит в течение 15 минут в рабочее время.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    as="a"
                    href={submitState.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    Написать в WhatsApp
                  </Button>
                  <Button as="a" href="#products" variant="secondary" className="w-full sm:w-auto">
                    Смотреть пакеты
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  Если WhatsApp не открылся, нажмите кнопку выше или ждите звонка.
                </p>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Форма заявки</p>
                  <h3 className="mt-2 text-2xl text-ink">Оставьте контакты</h3>
                  <p className="mt-2 text-sm text-muted">
                    Мы свяжемся и подтвердим выбранный продукт.
                  </p>
                </div>

                <div className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-3">
                  <p className="text-xs text-muted">Выбранный продукт</p>
                  <p className="text-sm font-semibold text-ink">
                    {selectedProduct?.title} · {formatPrice(selectedProduct?.price_from)}
                  </p>
                </div>

                <label className="flex w-full flex-col gap-2 text-sm font-medium text-ink">
                  Продукт
                  <select
                    className="w-full rounded-[12px] border border-stroke bg-white px-4 py-3 text-sm text-ink shadow-sm transition focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    value={selectedProductId}
                    onChange={(event) => handleSelectProduct(event.target.value)}
                  >
                    {visibleProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </label>

                <InputField
                  id="name"
                  label="Имя"
                  placeholder="Например, Айжан"
                  value={formData.name}
                  onChange={handleChange("name")}
                  required
                />
                <InputField
                  id="phone"
                  label="Телефон"
                  type="tel"
                  placeholder="+996 ___ ___ ___"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  required
                />
                <InputField
                  id="whatsapp"
                  label="WhatsApp"
                  type="tel"
                  placeholder="Если отличается от телефона"
                  value={formData.whatsapp}
                  onChange={handleChange("whatsapp")}
                />
                <InputField
                  id="time"
                  label="Предпочтительное время"
                  placeholder="Например, после 18:00"
                  value={formData.time}
                  onChange={handleChange("time")}
                />

                <label className="flex items-start gap-3 text-xs text-muted">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border border-stroke accent-[var(--accent)]"
                    checked={formData.consent}
                    onChange={handleConsentChange}
                    required
                  />
                  <span>
                    Согласен(а) на обработку данных для связи и подтверждения заявки.
                  </span>
                </label>

                {formError ? <p className="text-xs text-danger">{formError}</p> : null}

                <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
                  {isSubmitting ? "Отправляем..." : "Оформить заявку"}
                </Button>
                <p className="text-xs text-muted">
                  Нажимая кнопку, вы соглашаетесь на обработку данных для связи. Данные используются
                  только для ответа.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

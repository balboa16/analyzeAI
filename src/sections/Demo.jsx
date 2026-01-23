import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button";
import Badge from "../components/Badge";
import SectionHeading from "../components/SectionHeading";
import { demoInput } from "../data/mockAnalysis";
import {
  buildRuleBasedAnalysis,
  extractMetricsFromText,
  normalizeAnalysis
} from "../utils/analysisEngine";
import { analyzeWithOpenRouter, DEFAULT_OPENROUTER_MODEL } from "../utils/aiProviders";
import { extractTextFromFile } from "../utils/extractText";
import { generatePdfReport } from "../utils/pdfReport";

const tabs = [
  { id: "file", label: "Загрузить файл" },
  { id: "manual", label: "Ввести вручную" },
  { id: "sample", label: "Пример анализа" }
];

const MAX_FILE_SIZE_MB = 10;
const LEGACY_MODELS = ["meta-llama/llama-3.1-8b-instruct:free"];

const resolveStoredModel = (envModel) => {
  if (typeof window === "undefined") {
    return envModel;
  }

  const stored = window.localStorage.getItem("analizai_openrouter_model");
  if (!stored || LEGACY_MODELS.includes(stored)) {
    return envModel;
  }

  return stored;
};

const resolveStoredKey = (envKey) => {
  if (typeof window === "undefined") {
    return envKey;
  }

  if (envKey) {
    return envKey;
  }

  return window.localStorage.getItem("analizai_openrouter_key") || "";
};

export default function Demo() {
  const envOpenRouterKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_OPENROUTER_API_KEY || ""
      : "";
  const envOpenRouterModel =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
      : DEFAULT_OPENROUTER_MODEL;

  const [mode, setMode] = useState("file");
  const [openRouterModel, setOpenRouterModel] = useState(() => resolveStoredModel(envOpenRouterModel));
  const [openRouterKey, setOpenRouterKey] = useState(() => resolveStoredKey(envOpenRouterKey));

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState({ stage: "", progress: 0 });

  const [pdfLoading, setPdfLoading] = useState(false);

  const abortRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("analizai_openrouter_model", openRouterModel);
  }, [openRouterModel]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("analizai_openrouter_key", openRouterKey);
  }, [openRouterKey]);

  useEffect(() => {
    setAnalysis(null);
    setAnalysisError("");
  }, [mode]);

  const canAnalyze = useMemo(() => {
    if (mode === "file") {
      return Boolean(fileName);
    }

    if (mode === "manual") {
      return manualInput.trim().length > 0;
    }

    return true;
  }, [fileName, manualInput, mode]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFileError("");
    setFile(selected);
    setFileName(selected?.name || "");
    setExtractedText("");

    if (selected && selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(
        `Файл больше ${MAX_FILE_SIZE_MB} МБ. Пожалуйста, загрузите файл меньшего размера.`
      );
    }
  };

  const resolveInputText = async () => {
    if (mode === "manual") {
      return manualInput.trim();
    }

    if (mode === "sample") {
      return demoInput.sampleText;
    }

    if (!file) {
      return "";
    }

    if (extractedText) {
      return extractedText;
    }

    setIsExtracting(true);
    setExtractStatus({ stage: "Подготовка", progress: 0 });

    try {
      const text = await extractTextFromFile(file, (status) => {
        setExtractStatus({
          stage: status.stage || "Обработка",
          progress: status.progress || 0
        });
      });

      setExtractedText(text);
      return text;
    } catch (error) {
      setFileError("Не удалось распознать файл. Попробуйте PDF с текстовым слоем или ручной ввод.");
      return "";
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (isAnalyzing) {
      return;
    }

    setAnalysisError("");
    setAnalysis(null);

    if (!openRouterKey) {
      setAnalysisError("Добавьте API ключ OpenRouter, чтобы запустить расшифровку.");
      return;
    }

    const controller = new AbortController();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = controller;

    setIsAnalyzing(true);

    let inputText = "";

    const formatOpenRouterError = (error) => {
      if (error?.status === 401 || error?.status === 403) {
        return "Неверный или заблокированный API ключ OpenRouter.";
      }
      if (error?.status === 429) {
        return "Превышен лимит запросов OpenRouter. Попробуйте позже.";
      }
    if (error?.status === 404) {
      return `Модель OpenRouter недоступна: ${openRouterModel}. Попробуйте другую модель.`;
      }
      return error?.message || "Ошибка анализа";
    };

    try {
      inputText = await resolveInputText();
      if (!inputText) {
        setAnalysisError("Нет данных для анализа. Проверьте ввод или файл.");
        return;
      }

      let result = await analyzeWithOpenRouter({
        text: inputText,
        model: openRouterModel,
        apiKey: openRouterKey,
        signal: controller.signal
      });

      if (!result?.metrics?.length) {
        const fallback = buildRuleBasedAnalysis(inputText);
        result = normalizeAnalysis(fallback, result?.source || fallback?.source);
      }

      setAnalysis(result);
    } catch (error) {
      const fallback = buildRuleBasedAnalysis(inputText);
      fallback.source = { provider: "Fallback", model: "Rule-based" };
      setAnalysis(fallback);
      setAnalysisError(
        `${formatOpenRouterError(error)} Показан базовый анализ, проверьте данные.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePdf = async () => {
    if (!analysis || pdfLoading) {
      return;
    }

    setPdfLoading(true);
    await generatePdfReport(analysis);
    setPdfLoading(false);
  };

  const recognizedMetrics = useMemo(() => {
    if (!extractedText) {
      return [];
    }

    return extractMetricsFromText(extractedText);
  }, [extractedText]);

  const hasKey = Boolean(openRouterKey);

  return (
    <section className="section-pad" id="demo">
      <div className="container grid gap-10 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Интерактивный демо"
            title="Посмотрите, как выглядит расшифровка"
            subtitle="Загрузите файл, вставьте текст или попробуйте пример. Ответ появляется за секунды и уже готов к действию."
          />
          <div className="grid gap-3 rounded-3xl border border-stroke bg-white/80 p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    mode === tab.id
                      ? "bg-ink text-white"
                      : "bg-white text-muted border border-stroke"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 rounded-2xl bg-bg/60 p-4">
              {mode === "file" ? (
                <label
                  className="flex flex-col gap-3 rounded-2xl border border-dashed border-stroke bg-white px-4 py-5 text-sm"
                  htmlFor="analysis-file"
                >
                  <span className="font-semibold text-ink">Выберите файл анализа</span>
                  <input
                    id="analysis-file"
                    type="file"
                    className="text-sm"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <span className="text-xs text-muted">{demoInput.fileHint}</span>
                  {fileName ? (
                    <span className="text-xs font-semibold text-ink">Файл: {fileName}</span>
                  ) : null}
                  {fileError ? <span className="text-xs text-rose-600">{fileError}</span> : null}
                </label>
              ) : null}

              {mode === "manual" ? (
                <label
                  className="flex flex-col gap-3 rounded-2xl border border-stroke bg-white px-4 py-5 text-sm"
                  htmlFor="analysis-manual"
                >
                  <span className="font-semibold text-ink">Введите показатели</span>
                  <textarea
                    id="analysis-manual"
                    className="min-h-[140px] rounded-2xl border border-stroke px-4 py-3 text-sm text-ink"
                    placeholder={demoInput.manualPlaceholder}
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                  />
                </label>
              ) : null}

              {mode === "sample" ? (
                <div className="rounded-2xl border border-stroke bg-white px-4 py-5 text-sm">
                  <p className="font-semibold text-ink">Демо-анализ</p>
                  <p className="mt-2 text-xs text-muted">{demoInput.sampleText}</p>
                </div>
              ) : null}

              {isExtracting ? (
                <div className="rounded-2xl border border-stroke bg-white px-4 py-4 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span>Распознаем файл: {extractStatus.stage || "обработка"}</span>
                    <span>{Math.round(extractStatus.progress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stroke">
                    <div
                      className="h-2 rounded-full bg-accent transition"
                      style={{ width: `${Math.round(extractStatus.progress * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full justify-center"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing || fileError}
              >
                {isAnalyzing ? "Анализируем..." : "Получить расшифровку"}
              </Button>
              {analysisError && !analysis ? (
                <p className="text-xs text-rose-600">{analysisError}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-stroke bg-white/80 p-6">
            <p className="text-sm font-semibold text-ink">OpenRouter подключение</p>
            <p className="mt-2 text-xs text-muted">
              Расшифровка работает через OpenRouter (бесплатные модели). Ключ хранится только в
              вашем браузере.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span className={`h-2 w-2 rounded-full ${hasKey ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span>{hasKey ? "Ключ подключен" : "Нужен API ключ"}</span>
            </div>
            <label
              className="mt-4 grid gap-2 text-xs font-semibold text-ink"
              htmlFor="openrouter-key"
            >
              API ключ OpenRouter
              <input
                id="openrouter-key"
                type="password"
                className="rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink"
                value={openRouterKey}
                onChange={(event) => setOpenRouterKey(event.target.value)}
                placeholder="sk-or-..."
              />
            </label>
            <details className="mt-4 rounded-2xl border border-stroke bg-white px-4 py-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">Настройки модели</summary>
              <label className="mt-3 grid gap-2 text-xs font-semibold text-ink" htmlFor="openrouter-model">
                Модель OpenRouter
                <input
                  id="openrouter-model"
                  className="rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink"
                  value={openRouterModel}
                  onChange={(event) => setOpenRouterModel(event.target.value)}
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>Текущая модель: {openRouterModel}</span>
                {envOpenRouterModel ? (
                  <button
                    type="button"
                    className="rounded-full border border-stroke px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setOpenRouterModel(envOpenRouterModel)}
                  >
                    Сбросить на {envOpenRouterModel}
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Можно задать через `VITE_OPENROUTER_MODEL` в `.env.local`.
              </p>
            </details>
          </div>
          <div className="rounded-3xl border border-stroke bg-white/80 p-6">
            <p className="text-sm font-semibold text-ink">Что вы получите</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• Пояснения по каждому показателю</li>
              <li>• Рекомендации по питанию и витаминам</li>
              <li>• План действий с учетом вашего возраста</li>
              <li>• Предложение консультации врача при отклонениях</li>
            </ul>
          </div>
        </div>

        <div className="rounded-[32px] border border-stroke bg-white/90 p-6 shadow-soft md:min-h-[560px]">
          {analysis ? (
            <div className="grid gap-6" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Результат</p>
                  <h3 className="text-2xl text-ink">{analysis.title}</h3>
                  <p className="text-xs text-muted">{analysis.updatedAt}</p>
                  {analysis.source?.provider ? (
                    <p className="text-[11px] text-muted">
                      Источник: {analysis.source.provider} · {analysis.source.model}
                    </p>
                  ) : null}
                </div>
                <Button variant="secondary" onClick={handlePdf} disabled={pdfLoading}>
                  {pdfLoading ? "Готовим PDF..." : "Скачать PDF"}
                </Button>
              </div>
              {analysisError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  {analysisError}
                </div>
              ) : null}
              <p className="text-sm text-muted">{analysis.summary}</p>
              <div className="grid gap-3">
                {analysis.metrics.length ? (
                  analysis.metrics.map((metric) => (
                    <div
                      key={`${metric.name}-${metric.value}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stroke bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{metric.name}</p>
                        <p className="text-xs text-muted">
                          {metric.value} {metric.unit} {metric.range ? `· норма ${metric.range}` : ""}
                        </p>
                      </div>
                      <Badge
                        label={metric.note || "Комментарий"}
                        tone={metric.status === "danger" ? "danger" : metric.status}
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-stroke bg-white px-4 py-3 text-xs text-muted">
                    Нет распознанных показателей. Проверьте формат ввода.
                  </div>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.explanations.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-stroke bg-bg/60 p-4">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-2 text-xs text-muted">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-stroke bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Диета</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {analysis.diet.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-stroke bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Образ жизни</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {analysis.lifestyle.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-stroke bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Витамины</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {analysis.vitamins.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted">{analysis.caution}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted">
              <div className="h-16 w-16 rounded-3xl bg-accent/10 text-2xl font-semibold text-accent">
                AI
              </div>
              <p className="text-sm">
                Заполните данные и нажмите “Получить расшифровку”, чтобы увидеть результат.
              </p>
              {isAnalyzing ? (
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-stroke">
                  <div className="h-2 w-3/4 rounded-full bg-accent animate-pulse" />
                </div>
              ) : null}
            </div>
          )}

          {extractedText ? (
            <details className="mt-6 rounded-2xl border border-stroke bg-white px-4 py-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">
                Посмотреть распознанный текст ({recognizedMetrics.length} показателей)
              </summary>
              <p className="mt-3 whitespace-pre-wrap">{extractedText}</p>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}

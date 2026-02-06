import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button";
import MetricCard from "../components/MetricCard";
import ResultSummary from "../components/ResultSummary";
import SectionHeading from "../components/SectionHeading";
import { demoInput } from "../data/mockAnalysis";
import {
  buildRuleBasedAnalysis,
  extractMetricsFromText,
  normalizeAnalysis,
  sanitizeAnalysisText,
} from "../utils/analysisEngine";
import { analyzeWithOpenRouter } from "../utils/aiProviders";
import { extractTextFromFile } from "../utils/extractText";
import { generatePdfReport } from "../utils/pdfReport";

const tabs = [
  { id: "file", label: "Загрузить файл" },
  { id: "manual", label: "Ввести вручную" },
  { id: "sample", label: "Пример анализа" },
];

const MAX_FILE_SIZE_MB = 10;

const metricGroups = [
  {
    id: "cbc",
    title: "Общий анализ крови",
    match:
      /лейкоцит|эритроцит|гемоглобин|гематокрит|тромбоцит|нейтрофил|лимфоцит|моноцит|эозинофил|базофил|соэ|сое|wbc|rbc|hgb|hct|plt|mcv|mch|mchc|rdw/i,
  },
  {
    id: "bio",
    title: "Биохимия",
    match:
      /глюкоз|холестерин|алт|аст|креатинин|мочевин|билирубин|альбумин|белок|липид|триглицерид|ферритин|железо/i,
  },
  {
    id: "hormones",
    title: "Гормоны",
    match:
      /ттг|т3|т4|тестостерон|эстрадиол|пролактин|фсг|лг|прогестерон|инсулин|амг|dhea|дгэа|тирео/i,
  },
  {
    id: "vitamins",
    title: "Витамины",
    match: /витамин|b12|фолат|фоли/i,
  },
];

const nextStepCards = [
  {
    title: "Онлайн консультация врача",
    text: "Разбор отчёта и ответы на вопросы за 15 минут.",
    cta: "Записаться",
  },
  {
    title: "Пакет расширенной биохимии",
    text: "Уточнить обмен веществ и риски отклонений.",
    cta: "Выбрать пакет",
  },
  {
    title: "Персональный план",
    text: "Питание и рекомендации с контролем на 30 дней.",
    cta: "Получить план",
  },
];

const statusOrder = { normal: 0, warning: 1, danger: 2 };

export default function Demo() {
  const [mode, setMode] = useState("file");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState({
    stage: "",
    progress: 0,
  });

  const [pdfLoading, setPdfLoading] = useState(false);

  const abortRef = useRef(null);

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
        `Файл больше ${MAX_FILE_SIZE_MB} МБ. Пожалуйста, загрузите файл меньшего размера.`,
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
          progress: status.progress || 0,
        });
      });

      setExtractedText(text);
      return text;
    } catch (error) {
      setFileError(
        "Не удалось распознать файл. Попробуйте PDF с текстовым слоем или ручной ввод.",
      );
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

    const controller = new AbortController();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = controller;

    setIsAnalyzing(true);

    let inputText = "";

    const formatOpenRouterError = (error) => {
      if (error?.status === 401 || error?.status === 403) {
        return "Ключ OpenRouter не настроен или недействителен.";
      }
      if (error?.status === 429) {
        return "AI временно недоступен (высокая нагрузка). Показан локальный анализ.";
      }
      if (error?.status === 404) {
        return "Модель OpenRouter недоступна. Показали локальный анализ по распознанным данным.";
      }
      if (error?.message?.includes("not configured")) {
        return "Ключ OpenRouter не задан на сервере. Проверьте переменные окружения.";
      }
      return error?.message || "Ошибка анализа";
    };

    try {
      inputText = await resolveInputText();
      if (!inputText) {
        setAnalysisError("Нет данных для анализа. Проверьте ввод или файл.");
        return;
      }

      let result = null;

      try {
        result = await analyzeWithOpenRouter({
          text: inputText,
          signal: controller.signal,
        });
      } catch (innerError) {
        if (innerError?.code === "INVALID_JSON") {
          const retryText = sanitizeAnalysisText(inputText, { maxChars: 2500 });
          result = await analyzeWithOpenRouter({
            text: retryText || inputText,
            signal: controller.signal,
            strict: true,
          });
        } else {
          throw innerError;
        }
      }

      const fallback = buildRuleBasedAnalysis(inputText);

      if (!result?.metrics?.length) {
        const merged = {
          ...fallback,
          ...result,
          title: result?.title || fallback.title,
          summary: result?.summary || fallback.summary,
          metrics: result?.metrics?.length ? result.metrics : fallback.metrics,
          explanations: result?.explanations?.length
            ? result.explanations
            : fallback.explanations,
          diet: result?.diet?.length ? result.diet : fallback.diet,
          lifestyle: result?.lifestyle?.length
            ? result.lifestyle
            : fallback.lifestyle,
          vitamins: result?.vitamins?.length
            ? result.vitamins
            : fallback.vitamins,
          caution: result?.caution || fallback.caution,
        };

        result = normalizeAnalysis(merged, result?.source || fallback?.source);
      }

      setAnalysis(result);
    } catch (error) {
      const fallback = buildRuleBasedAnalysis(inputText);
      fallback.source = { provider: "Fallback", model: "Rule-based" };
      setAnalysis(fallback);
      const errorMessage = formatOpenRouterError(error);
      const suffix = errorMessage.includes("локальный анализ")
        ? ""
        : " Показан локальный анализ по распознанным данным.";
      setAnalysisError(`${errorMessage}${suffix}`);
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

  const overallStatus = useMemo(() => {
    if (!analysis?.metrics?.length) {
      return "warning";
    }

    return analysis.metrics.reduce((acc, metric) => {
      const current =
        statusOrder[metric.status] !== undefined ? metric.status : "normal";
      return statusOrder[current] > statusOrder[acc] ? current : acc;
    }, "normal");
  }, [analysis]);

  const summaryInsights = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const metrics = analysis.metrics || [];
    const flagged = metrics.filter((metric) => metric.status !== "normal");
    const insights = [];

    if (flagged.length) {
      insights.push(
        `Показатели внимания: ${flagged
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ")}.`,
      );
    } else if (metrics.length) {
      insights.push("Ключевые показатели находятся в пределах нормы.");
    }

    if (analysis.summary) {
      const sentence = analysis.summary
        .split(/[.!?]/)
        .map((item) => item.trim())
        .filter(Boolean)[0];
      if (sentence && !insights.includes(sentence)) {
        insights.push(sentence);
      }
    }

    insights.push("Отчёт можно сохранить в PDF и показать врачу.");

    return insights.filter(Boolean).slice(0, 3);
  }, [analysis]);

  const groupedMetrics = useMemo(() => {
    if (!analysis?.metrics?.length) {
      return [];
    }

    const groups = metricGroups.map((group) => ({ ...group, items: [] }));
    const rest = [];

    analysis.metrics.forEach((metric) => {
      const target = groups.find((group) => group.match.test(metric.name));
      if (target) {
        target.items.push(metric);
      } else {
        rest.push(metric);
      }
    });

    const output = groups
      .filter((group) => group.items.length)
      .map(({ title, items }) => ({ title, items }));

    if (rest.length) {
      output.push({ title: "Другие показатели", items: rest });
    }

    return output;
  }, [analysis]);

  const actionItems = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const flaggedCount = analysis.metrics.filter(
      (metric) => metric.status !== "normal",
    ).length;

    return [
      flaggedCount
        ? "Пересдать отклонённые показатели через 2-4 недели."
        : "Плановый контроль через 6-12 месяцев.",
      "Досдать анализы по рекомендации врача.",
      "Консультация врача при симптомах или сомнениях.",
    ];
  }, [analysis]);

  return (
    <section className="section-pad" id="demo">
      <div className="container grid gap-10 lg:items-start lg:grid-cols-[0.9fr,1.1fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Интерактивное демо"
            title="Посмотрите, как выглядит расшифровка"
            subtitle="Загрузите файл, вставьте текст или попробуйте пример. Ответ появляется за секунды и уже готов к действию."
          />
          <div className="grid gap-3 rounded-[16px] border border-stroke bg-white p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-center text-xs font-semibold transition sm:flex-none sm:text-sm ${
                    mode === tab.id
                      ? "bg-accent text-white"
                      : "bg-white text-muted border border-stroke"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 rounded-[16px] bg-[var(--bg-soft)] p-4">
              {mode === "file" ? (
                <label
                  className="relative flex min-h-[160px] cursor-pointer flex-col gap-3 rounded-[16px] border border-dashed border-stroke bg-white px-4 py-5 text-sm transition hover:border-[rgba(31,127,92,0.4)] focus-within:border-[rgba(31,127,92,0.6)] focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg"
                  htmlFor="analysis-file"
                >
                  <span className="font-semibold text-ink">
                    Выберите файл анализа
                  </span>
                  <input
                    id="analysis-file"
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <span className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[12px] border border-stroke bg-white px-4 text-xs font-semibold text-ink">
                    Выбрать файл
                  </span>
                  <span className="text-xs text-muted">
                    {demoInput.fileHint}
                  </span>
                  {fileName ? (
                    <span className="text-xs font-semibold text-ink">
                      Файл: {fileName}
                    </span>
                  ) : null}
                  {fileError ? (
                    <span className="text-xs text-danger">{fileError}</span>
                  ) : null}
                </label>
              ) : null}

              {mode === "manual" ? (
                <label
                  className="flex flex-col gap-3 rounded-[16px] border border-stroke bg-white px-4 py-5 text-sm"
                  htmlFor="analysis-manual"
                >
                  <span className="font-semibold text-ink">
                    Введите показатели
                  </span>
                  <textarea
                    id="analysis-manual"
                    className="min-h-[140px] rounded-[12px] border border-stroke px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    placeholder={demoInput.manualPlaceholder}
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                  />
                </label>
              ) : null}

              {mode === "sample" ? (
                <div className="rounded-[16px] border border-stroke bg-white px-4 py-5 text-sm">
                  <p className="font-semibold text-ink">Демо-анализ</p>
                  <p className="mt-2 text-xs text-muted">
                    {demoInput.sampleText}
                  </p>
                </div>
              ) : null}

              {isExtracting ? (
                <div className="rounded-[16px] border border-stroke bg-white px-4 py-4 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span>
                      Распознаём файл: {extractStatus.stage || "обработка"}
                    </span>
                    <span>{Math.round(extractStatus.progress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stroke">
                    <div
                      className="h-2 rounded-full bg-accent transition"
                      style={{
                        width: `${Math.round(extractStatus.progress * 100)}%`,
                      }}
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
              <p className="text-[11px] text-muted">
                AI-расшифровка работает автоматически, ключ хранится на сервере.
              </p>
              {analysisError && !analysis ? (
                <p className="text-xs text-danger">{analysisError}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-[16px] border border-stroke bg-white p-6">
            <p className="text-sm font-semibold text-ink">Что вы получите</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• Пояснения по каждому показателю</li>
              <li>• Рекомендации по питанию и витаминам</li>
              <li>• План действий с учетом вашего возраста</li>
              <li>• Предложение консультации врача при отклонениях</li>
            </ul>
          </div>
        </div>

        <div className="rounded-[16px] border border-stroke bg-white p-6 shadow-soft lg:min-h-[420px] xl:min-h-[480px]">
          {analysis ? (
            <div className="grid gap-6" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Отчёт SAPATLAB
                  </p>
                  <h3 className="text-2xl text-ink">{analysis.title}</h3>
                  <p className="text-xs text-muted">{analysis.updatedAt}</p>
                  {analysis.source?.provider ? (
                    <p className="text-[11px] text-muted">
                      Источник: {analysis.source.provider} ·{" "}
                      {analysis.source.model}
                    </p>
                  ) : null}
                </div>
              </div>
              {analysisError ? (
                <div className="rounded-[12px] border border-[rgba(214,166,79,0.35)] bg-[var(--warning-soft)] px-4 py-3 text-xs text-[#8a5a17]">
                  {analysisError}
                </div>
              ) : null}
              <ResultSummary
                status={analysisError ? "warning" : overallStatus}
                insights={summaryInsights}
              />

              <div className="grid gap-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      Показатели
                    </p>
                    <h4 className="text-xl text-ink">Группы показателей</h4>
                  </div>
                  <span className="text-xs text-muted">
                    {analysis.metrics.length} показателей
                  </span>
                </div>
                {analysis.metrics.length ? (
                  groupedMetrics.map((group) => (
                    <div key={group.title} className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">
                          {group.title}
                        </p>
                        <span className="text-xs text-muted">
                          {group.items.length} шт.
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.items.map((metric) => (
                          <MetricCard
                            key={`${metric.name}-${metric.value}`}
                            metric={metric}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[12px] border border-stroke bg-white px-4 py-3 text-xs text-muted">
                    Нет распознанных показателей. Проверьте формат ввода.
                  </div>
                )}
              </div>

              <div className="card bg-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Рекомендации
                  </p>
                  <h4 className="mt-2 text-xl text-ink">Что можно сделать</h4>
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-muted">
                  {actionItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card bg-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Питание и режим
                  </p>
                  <h4 className="mt-2 text-xl text-ink">
                    Подробные рекомендации
                  </h4>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-4">
                    <p className="text-sm font-semibold text-ink">Питание</p>
                    <ul className="mt-2 grid gap-2 text-xs text-muted">
                      {(analysis.diet || []).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-4">
                    <p className="text-sm font-semibold text-ink">
                      Образ жизни
                    </p>
                    <ul className="mt-2 grid gap-2 text-xs text-muted">
                      {(analysis.lifestyle || []).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-4">
                    <p className="text-sm font-semibold text-ink">Витамины</p>
                    <ul className="mt-2 grid gap-2 text-xs text-muted">
                      {(analysis.vitamins || []).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {analysis.dietPlan?.length ? (
                <div className="rounded-[16px] border border-stroke bg-white p-6 shadow-card">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      План питания
                    </p>
                    <h4 className="mt-2 text-xl text-ink">Пример на неделю</h4>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-muted">
                    {analysis.dietPlan.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-[16px] border border-stroke bg-[var(--bg-soft)] p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Следующий шаг
                  </p>
                  <h4 className="mt-2 text-2xl text-ink">Следующий шаг</h4>
                  <p className="mt-2 text-sm text-muted">
                    Чтобы уточнить картину, можно досдать или выбрать готовый
                    пакет.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {nextStepCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[12px] border border-stroke bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-ink">
                        {card.title}
                      </p>
                      <p className="mt-2 text-xs text-muted">{card.text}</p>
                      <Button
                        as="a"
                        href="#products"
                        variant="ghost"
                        className="mt-4 w-full justify-center"
                      >
                        {card.cta}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button as="a" href="#products" className="w-full sm:w-auto">
                    Оформить заявку
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handlePdf}
                    disabled={pdfLoading}
                    className="w-full sm:w-auto"
                  >
                    {pdfLoading ? "Готовим PDF..." : "Напечатать отчёт"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted">{analysis.caution}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted">
              <div className="h-16 w-16 rounded-[16px] bg-[var(--success-soft)] text-2xl font-semibold text-accent">
                AI
              </div>
              <p className="text-sm">
                Заполните данные и нажмите «Получить расшифровку», чтобы увидеть
                результат.
              </p>
              {isAnalyzing ? (
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-stroke">
                  <div className="h-2 w-3/4 rounded-full bg-accent animate-pulse" />
                </div>
              ) : null}
            </div>
          )}

          {extractedText ? (
            <details className="mt-6 rounded-[12px] border border-stroke bg-white px-4 py-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">
                Посмотреть распознанный текст ({recognizedMetrics.length}{" "}
                показателей)
              </summary>
              <p className="mt-3 whitespace-pre-wrap">{extractedText}</p>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}

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
import { analyzeWithAI } from "../utils/aiProviders";
import { extractTextFromFile } from "../utils/extractText";
import { generatePdfReport } from "../utils/pdfReport";

const tabs = [
  {
    id: "file",
    label: "Загрузить файл",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 15V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  {
    id: "manual",
    label: "Ввести вручную",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    id: "sample",
    label: "Пример",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
  },
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
      /глюкоз|холестерин|алт|аст|креатинин|мочевин|билирубин|альбумин|белок|липид|триглицерид|ферритин|железо|мочев|калий|натрий|crp|срб|гликир/i,
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
    title: "Онлайн консультация",
    text: "Врач разберёт отчёт и ответит на вопросы за 15 минут.",
    cta: "Записаться",
    price: "от 990 сом",
  },
  {
    title: "Чекап SAPATLAB",
    text: "Комплексная проверка организма — всё в одном визите.",
    cta: "Выбрать чекап",
    price: "от 6 900 сом",
  },
  {
    title: "Персональный план",
    text: "Питание, привычки и контроль динамики на 30 дней.",
    cta: "Получить план",
    price: "от 2 400 сом",
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
  const [isDragging, setIsDragging] = useState(false);

  const abortRef = useRef(null);
  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

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
    processFile(selected);
  };

  const processFile = (selected) => {
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
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

    const formatAIError = (error) => {
      if (error?.status === 401 || error?.status === 403) {
        return "Ключ AI не настроен или недействителен.";
      }
      if (error?.status === 429) {
        return "AI временно недоступен (высокая нагрузка). Показан локальный анализ.";
      }
      if (error?.status === 404) {
        return "Модель AI недоступна. Показан локальный анализ по распознанным данным.";
      }
      if (error?.message?.includes("not configured")) {
        return "Ключ AI не задан на сервере. Проверьте переменные окружения.";
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
        result = await analyzeWithAI({
          text: inputText,
          signal: controller.signal,
        });
      } catch (innerError) {
        if (innerError?.code === "INVALID_JSON") {
          const retryText = sanitizeAnalysisText(inputText, { maxChars: 2500 });
          result = await analyzeWithAI({
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

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      const fallback = buildRuleBasedAnalysis(inputText);
      fallback.source = { provider: "Fallback", model: "Rule-based" };
      setAnalysis(fallback);
      const errorMessage = formatAIError(error);
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
      const sentences = analysis.summary
        .split(/[.!?]/)
        .map((item) => item.trim())
        .filter(Boolean);
      const sentence = sentences[0];
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
      <div className="container grid gap-6 sm:gap-8 lg:gap-10 lg:items-start lg:grid-cols-[0.9fr,1.1fr]">
        <div className="flex flex-col gap-5 sm:gap-6">
          <SectionHeading
            eyebrow="Интерактивное демо"
            title="Посмотрите, как выглядит расшифровка"
            subtitle="Загрузите файл, вставьте текст или попробуйте пример. Ответ появляется за секунды."
          />
          <div className="grid gap-3 rounded-[16px] border border-stroke bg-white p-3 sm:p-4">
            <div className="flex gap-1.5 sm:gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-center text-xs font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                    mode === tab.id
                      ? "bg-accent text-white"
                      : "bg-white text-muted border border-stroke"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 rounded-[16px] bg-[var(--bg-soft)] p-3 sm:p-4">
              {mode === "file" ? (
                <label
                  className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed bg-white px-4 py-5 text-center text-sm transition sm:min-h-[160px] ${
                    isDragging
                      ? "border-accent bg-[var(--success-soft)]"
                      : fileName
                        ? "border-accent/40"
                        : "border-stroke hover:border-accent/40"
                  }`}
                  htmlFor="analysis-file"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    id="analysis-file"
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  {fileName ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-soft)] text-accent">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-ink">
                        {fileName}
                      </span>
                      <span className="text-xs text-accent">
                        Нажмите, чтобы заменить файл
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-soft)] text-muted">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M12 15V4" />
                          <path d="M7 9l5-5 5 5" />
                          <path d="M4 20h16" />
                        </svg>
                      </div>
                      <span className="font-semibold text-ink">
                        Нажмите или перетащите файл
                      </span>
                      <span className="text-xs text-muted">
                        {demoInput.fileHint}
                      </span>
                    </>
                  )}
                  {fileError ? (
                    <span className="text-xs text-danger">{fileError}</span>
                  ) : null}
                </label>
              ) : null}

              {mode === "manual" ? (
                <div className="flex flex-col gap-2 rounded-[16px] border border-stroke bg-white px-4 py-4">
                  <span className="text-sm font-semibold text-ink">
                    Введите показатели
                  </span>
                  <textarea
                    id="analysis-manual"
                    className="min-h-[120px] rounded-[12px] border border-stroke px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:min-h-[140px]"
                    placeholder={demoInput.manualPlaceholder}
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                  />
                </div>
              ) : null}

              {mode === "sample" ? (
                <div className="rounded-[16px] border border-stroke bg-white px-4 py-4 text-sm">
                  <p className="font-semibold text-ink">Демо-анализ</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {demoInput.sampleText}
                  </p>
                </div>
              ) : null}

              {isExtracting ? (
                <div className="rounded-[16px] border border-stroke bg-white px-4 py-4 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="spinner border-accent border-t-accent/30" />
                      {extractStatus.stage || "Обработка"}
                    </span>
                    <span className="font-semibold">
                      {Math.round(extractStatus.progress * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stroke">
                    <div
                      className="h-2 rounded-full bg-accent transition-all duration-300"
                      style={{
                        width: `${Math.round(extractStatus.progress * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                className={`w-full justify-center ${canAnalyze && !isAnalyzing && !fileError ? "pulse-cta" : ""}`}
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing || fileError}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner" />
                    Анализируем...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Получить расшифровку
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted">
                AI-расшифровка работает автоматически, ключ хранится на сервере.
              </p>
              {analysisError && !analysis ? (
                <p className="text-xs text-danger">{analysisError}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-[16px] border border-stroke bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold text-ink">Что вы получите</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Пояснения по каждому показателю
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Рекомендации по питанию и витаминам
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                План действий с учетом вашего возраста
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Предложение консультации при отклонениях
              </li>
            </ul>
          </div>
        </div>

        <div
          ref={resultsRef}
          className="rounded-[16px] border border-stroke bg-white p-4 shadow-soft sm:p-6 lg:min-h-[420px]"
        >
          {analysis ? (
            <div className="grid gap-5 sm:gap-6" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Отчёт SAPATLAB
                  </p>
                  <h3 className="text-xl text-ink sm:text-2xl">
                    {analysis.title}
                  </h3>
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

              <div className="grid gap-4 sm:gap-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      Показатели
                    </p>
                    <h4 className="text-lg text-ink sm:text-xl">
                      Группы показателей
                    </h4>
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
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                  <h4 className="mt-2 text-lg text-ink sm:text-xl">
                    Что можно сделать
                  </h4>
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-muted">
                  {actionItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-accent" />
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
                  <h4 className="mt-2 text-lg text-ink sm:text-xl">
                    Подробные рекомендации
                  </h4>
                </div>
                <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-3">
                  {[
                    { title: "Питание", items: analysis.diet },
                    { title: "Образ жизни", items: analysis.lifestyle },
                    { title: "Витамины", items: analysis.vitamins },
                  ].map((section) => (
                    <div
                      key={section.title}
                      className="rounded-[12px] border border-stroke bg-[var(--bg-soft)] px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-ink">
                        {section.title}
                      </p>
                      <ul className="mt-2 grid gap-2 text-xs text-muted">
                        {(section.items || []).map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.dietPlan?.length ? (
                <div className="rounded-[16px] border border-stroke bg-white p-4 shadow-card sm:p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      План питания
                    </p>
                    <h4 className="mt-2 text-lg text-ink sm:text-xl">
                      Пример на неделю
                    </h4>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-muted">
                    {analysis.dietPlan.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-[16px] border border-stroke bg-[var(--bg-soft)] p-4 sm:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Следующий шаг
                  </p>
                  <h4 className="mt-2 text-xl text-ink sm:text-2xl">
                    Что дальше?
                  </h4>
                  <p className="mt-2 text-sm text-muted">
                    Чтобы уточнить картину и получить профессиональную помощь:
                  </p>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 md:grid md:grid-cols-3 md:overflow-visible">
                  {nextStepCards.map((card) => (
                    <div
                      key={card.title}
                      className="min-w-[240px] shrink-0 snap-start rounded-[12px] border border-stroke bg-white p-4 md:min-w-0"
                    >
                      <p className="text-sm font-semibold text-ink">
                        {card.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">{card.text}</p>
                      <p className="mt-2 text-xs font-semibold text-accent">
                        {card.price}
                      </p>
                      <Button
                        as="a"
                        href="#products"
                        variant="ghost"
                        className="mt-3 w-full justify-center"
                      >
                        {card.cta}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={handlePdf}
                    disabled={pdfLoading}
                    className="w-full sm:w-auto"
                  >
                    {pdfLoading ? (
                      <>
                        <span className="spinner border-accent border-t-accent/30" />
                        Готовим PDF...
                      </>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M12 18v-6" />
                          <path d="M9 15l3 3 3-3" />
                        </svg>
                        Скачать PDF отчёт
                      </>
                    )}
                  </Button>
                  <Button as="a" href="#products" className="w-full sm:w-auto">
                    Оформить заявку
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted">{analysis.caution}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center text-muted sm:py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[var(--success-soft)]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-accent"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="max-w-[240px] text-sm">
                Заполните данные слева и нажмите «Получить расшифровку», чтобы
                увидеть результат.
              </p>
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <span className="spinner border-accent border-t-accent/30" />
                  <span className="text-xs">Анализируем...</span>
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

      {analysis ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-white/95 px-4 py-3 backdrop-blur sticky-bottom-bar lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handlePdf}
              disabled={pdfLoading}
              className="flex-1 justify-center text-xs"
            >
              {pdfLoading ? "PDF..." : "Скачать PDF"}
            </Button>
            <Button
              as="a"
              href="#products"
              className="flex-1 justify-center text-xs"
            >
              Записаться
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

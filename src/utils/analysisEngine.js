import { referenceRanges } from "../data/referenceRanges";

const DEFAULT_TITLE = "Расшифровка анализов";
const DEFAULT_CAUTION =
  "Рекомендации носят информационный характер и не заменяют консультацию врача.";
const DEFAULT_TEXT_LIMIT = 5000;

const isNumber = (value) => Number.isFinite(value);

const normalizeNumber = (value) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatRange = (range) => {
  if (!range) {
    return "";
  }

  if (isNumber(range.min) && isNumber(range.max)) {
    return `${range.min}–${range.max}`;
  }

  if (isNumber(range.min)) {
    return `от ${range.min}`;
  }

  if (isNumber(range.max)) {
    return `до ${range.max}`;
  }

  return "";
};

const resolveStatus = (value, range) => {
  if (!isNumber(value) || !range) {
    return "normal";
  }

  if (isNumber(range.min) && value < range.min) {
    return value < range.min * 0.8 ? "danger" : "warning";
  }

  if (isNumber(range.max) && value > range.max) {
    return value > range.max * 1.2 ? "danger" : "warning";
  }

  return "normal";
};

const resolveNote = (value, range, item) => {
  if (!isNumber(value) || !range) {
    return "См. комментарий";
  }

  if (isNumber(range.min) && value < range.min) {
    return item.lowNote || "Ниже нормы";
  }

  if (isNumber(range.max) && value > range.max) {
    return item.highNote || "Выше нормы";
  }

  return "В норме";
};

const extractNumberFromWindow = (window, preferLast = false) => {
  if (!window) {
    return null;
  }

  const cleaned = window
    .replace(/\d+(?:[\.,]\d+)?\s*[-–]\s*\d+(?:[\.,]\d+)?/g, " ")
    .replace(/\d+\s*\^\s*\d+\s*\/\s*[a-zа-я%]+/gi, " ")
    .replace(/\b\d+\s*\^\s*\d+\b/gi, " ");

  const matches = [...cleaned.matchAll(/(\d+(?:[\.,]\d+)?)/g)];
  if (!matches.length) {
    return null;
  }

  const value = preferLast ? matches[matches.length - 1][1] : matches[0][1];
  return normalizeNumber(value);
};

const extractValue = (text, patterns) => {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, "i");
    const match = regex.exec(text);
    if (!match) {
      continue;
    }

    const startIndex = match.index + match[0].length;
    const forwardWindow = text.slice(startIndex, startIndex + 140);
    const forwardValue = extractNumberFromWindow(forwardWindow, false);
    if (isNumber(forwardValue)) {
      return forwardValue;
    }

    const backwardStart = Math.max(0, match.index - 140);
    const backwardWindow = text.slice(backwardStart, match.index);
    const backwardValue = extractNumberFromWindow(backwardWindow, true);
    if (isNumber(backwardValue)) {
      return backwardValue;
    }
  }

  return null;
};

export const extractMetricsFromText = (text) => {
  if (!text) {
    return [];
  }

  const normalizedText = text.replace(/\s+/g, " ");

  return referenceRanges
    .map((item) => {
      const value = extractValue(normalizedText, item.patterns);
      if (!isNumber(value)) {
        return null;
      }

      const rangeText = formatRange(item.range);
      return {
        id: item.id,
        name: item.name,
        value: String(value),
        unit: item.unit || "",
        range: rangeText,
        status: resolveStatus(value, item.range),
        note: resolveNote(value, item.range, item),
        description: item.description || ""
      };
    })
    .filter(Boolean);
};

export const sanitizeAnalysisText = (text, options = {}) => {
  if (!text) {
    return "";
  }

  const maxChars = Number.isFinite(options.maxChars) ? options.maxChars : DEFAULT_TEXT_LIMIT;
  const normalized = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const unitRegex = /(ммоль|мкг|нг|мг|г\/л|ед\/л|iu|%)/i;
  const keepIndices = new Set();

  lines.forEach((line, index) => {
    const hasDigits = /\\d/.test(line);
    const hasUnits = unitRegex.test(line);
    const hasMetricLabel = referenceRanges.some((item) =>
      item.patterns.some((pattern) => pattern.test(line))
    );

    if (hasDigits || hasUnits || hasMetricLabel) {
      keepIndices.add(index);
      if (index > 0) {
        keepIndices.add(index - 1);
      }
      if (index < lines.length - 1) {
        keepIndices.add(index + 1);
      }
    }
  });

  const chosen = keepIndices.size
    ? lines.filter((_, index) => keepIndices.has(index))
    : lines;
  const unique = [];
  const seen = new Set();

  for (const line of chosen) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      unique.push(line);
      seen.add(key);
    }
  }

  let output = unique.join("\n");
  if (output.length > maxChars) {
    output = output.slice(0, maxChars);
  }

  return output;
};

const buildSummary = (metrics) => {
  if (!metrics.length) {
    return "Мы не смогли уверенно распознать показатели. Проверьте ввод или загрузите более четкий файл.";
  }

  const warnings = metrics.filter((metric) => metric.status !== "normal");
  if (!warnings.length) {
    return "Все распознанные показатели находятся в пределах нормы. Продолжайте поддерживать текущий режим.";
  }

  return `Обнаружены отклонения: ${warnings
    .map((item) => item.name)
    .slice(0, 3)
    .join(", ")}. Рекомендуем обратить внимание на питание и образ жизни.`;
};

const buildTips = (metrics) => {
  const diet = [];
  const lifestyle = [];
  const vitamins = [];

  const metricIndex = new Map(metrics.map((metric) => [metric.id, metric]));

  const vitaminD = metricIndex.get("vitamin-d");
  if (vitaminD && vitaminD.status !== "normal") {
    vitamins.push("Витамин D3 — 2000 МЕ в день 8 недель.");
    diet.push("Добавьте жирную рыбу 2 раза в неделю (форель, скумбрия).");
    diet.push("Яйца 3–4 раза в неделю и кисломолочные продукты без сахара.");
    lifestyle.push("10–15 минут дневного света в первой половине дня.");
  }

  const cholesterol = metricIndex.get("cholesterol");
  if (cholesterol && cholesterol.status !== "normal") {
    diet.push("Снизьте количество сахара и выпечки, добавьте клетчатку.");
    diet.push("Замените жирное мясо на птицу и рыбу, используйте оливковое масло.");
    diet.push("Добавьте цельнозерновые гарниры 3–4 раза в неделю.");
    lifestyle.push("Ходьба 30 минут в день или 8–10 тыс. шагов.");
  }

  const glucose = metricIndex.get("glucose");
  if (glucose && glucose.status !== "normal") {
    diet.push("Сделайте упор на овощи и белок, уберите сладкие напитки.");
    diet.push("Старайтесь есть каждые 3–4 часа, без больших перерывов.");
    lifestyle.push("Стабилизируйте сон: 7–8 часов ежедневно.");
  }

  const ferritin = metricIndex.get("ferritin");
  const hemoglobin = metricIndex.get("hemoglobin");
  if (
    (ferritin && ferritin.status === "warning") ||
    (hemoglobin && hemoglobin.status === "warning")
  ) {
    diet.push("Добавьте источники железа: говядина, печень, бобовые.");
    diet.push("Сочетайте железо с витамином C (перец, киви, лимон).");
    vitamins.push("Железо — по назначению врача после консультации.");
  }

  if (!diet.length) {
    diet.push("Овощи 400–500 г в день и достаточное количество воды.");
    diet.push("Белок в каждом приёме пищи: рыба, птица, творог или бобовые.");
    diet.push("1–2 порции фруктов в первой половине дня.");
  }

  if (!lifestyle.length) {
    lifestyle.push("Легкая ежедневная активность и контроль стресса.");
    lifestyle.push("Сон 7–8 часов и одинаковое время подъема.");
    lifestyle.push("Ограничьте кофеин после 16:00.");
  }

  if (!vitamins.length) {
    vitamins.push("Поддерживающий поливитаминный комплекс по согласованию с врачом.");
    vitamins.push("Омега‑3 — 1000 мг/день курсом 4 недели.");
  }

  return { diet, lifestyle, vitamins };
};

const buildDietPlan = (metrics) => {
  const metricIndex = new Map(metrics.map((metric) => [metric.id, metric]));
  const glucose = metricIndex.get("glucose");
  const cholesterol = metricIndex.get("cholesterol");

  const metabolicFocus = Boolean(
    (glucose && glucose.status !== "normal") ||
      (cholesterol && cholesterol.status !== "normal")
  );

  if (metabolicFocus) {
    return [
      "День 1: завтрак — овсянка + ягоды; обед — курица, гречка, салат; ужин — рыба, тушёные овощи; перекус — орехи.",
      "День 2: завтрак — омлет + овощи; обед — чечевичный суп, цельнозерновой тост; ужин — индейка, киноа; перекус — кефир.",
      "День 3: завтрак — творог + яблоко; обед — рыба на пару, бурый рис; ужин — овощное рагу + яйцо; перекус — йогурт без сахара.",
      "День 4: завтрак — гречка + яйцо; обед — говядина, овощи, салат; ужин — запечённые овощи + фасоль; перекус — курага.",
      "День 5: завтрак — овсянка + семена; обед — курица, булгур; ужин — рыба, салат с оливковым маслом; перекус — творог.",
      "День 6: завтрак — йогурт + орехи; обед — тушёная индейка, овощи; ужин — суп-пюре + тост; перекус — фрукты.",
      "День 7: завтрак — омлет + зелень; обед — рыба, киноа; ужин — салат с курицей; перекус — кефир."
    ];
  }

  return [
    "День 1: завтрак — овсянка + фрукты; обед — курица, гречка, салат; ужин — рыба, овощи; перекус — йогурт.",
    "День 2: завтрак — омлет + зелень; обед — чечевица, салат; ужин — индейка + овощи; перекус — орехи.",
    "День 3: завтрак — творог + ягоды; обед — говядина, овощи; ужин — суп-пюре; перекус — кефир.",
    "День 4: завтрак — гречка + яйцо; обед — рыба, булгур; ужин — овощное рагу; перекус — фрукты.",
    "День 5: завтрак — йогурт + семена; обед — курица, рис; ужин — салат с яйцом; перекус — творог.",
    "День 6: завтрак — овсянка + орехи; обед — суп + тост; ужин — рыба, овощи; перекус — айран.",
    "День 7: завтрак — омлет + овощи; обед — индейка, киноа; ужин — салат с рыбой; перекус — фрукты."
  ];
};

export const buildRuleBasedAnalysis = (text) => {
  const metrics = extractMetricsFromText(text);
  const tips = buildTips(metrics);
  const dietPlan = buildDietPlan(metrics);

  return {
    title: DEFAULT_TITLE,
    updatedAt: new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    }),
    summary: buildSummary(metrics),
    metrics: metrics.map(({ description, ...metric }) => metric),
    explanations: metrics
      .filter((metric) => metric.status !== "normal")
      .slice(0, 4)
      .map((metric) => ({
        title: metric.name,
        text: metric.description || "Отклонение требует внимания специалиста."
      })),
    diet: tips.diet,
    lifestyle: tips.lifestyle,
    vitamins: tips.vitamins,
    dietPlan,
    caution: DEFAULT_CAUTION
  };
};

export const buildPrompt = (text) => {
  const cleanedText = sanitizeAnalysisText(text);
  return `
Ты медицинский аналитик для массовой аудитории Кыргызстана.
Верни СТРОГО валидный JSON без markdown и пояснений. Язык ответа: русский.
Используй только двойные кавычки. Никаких комментариев или текста вне JSON.

Сформируй структуру:
{
  "title": string,
  "summary": string,
  "metrics": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "range": string,
      "status": "normal" | "warning" | "danger",
      "note": string
    }
  ],
  "explanations": [{ "title": string, "text": string }],
  "diet": [string],
  "lifestyle": [string],
  "vitamins": [string],
  "dietPlan": [string],
  "caution": string
}

Правила:
- Распознавай показатели из текста анализов, не придумывай новые.
- range всегда строка; если диапазон не указан, ставь "".
- status вычисляй по диапазону; если диапазона нет, ставь "normal".
- note: кратко ("в норме", "выше нормы", "ниже нормы", "требует внимания").
- summary: 2–3 предложения — общая картина, ключевые отклонения, следующий шаг.
- explanations: до 4 пунктов, только по отклонениям.
- diet/lifestyle/vitamins: по 5–7 конкретных, выполнимых рекомендаций.
- dietPlan: 5–7 строк, каждая начинается с "День N:" и содержит 3 приема пищи + 1 перекус.
- Не ставь диагнозы и не назначай лечение.

Входной текст анализов:
"""${cleanedText}"""
`;
};

export const safeParseJson = (input) => {
  if (!input) {
    return null;
  }

  const extractJsonCandidates = (value) => {
    const candidates = [];
    const fenced = value.match(/```(?:json)?([\s\S]*?)```/i);
    if (fenced?.[1]) {
      candidates.push(fenced[1]);
    }

    for (let start = 0; start < value.length; start += 1) {
      const opener = value[start];
      if (opener !== "{" && opener !== "[") {
        continue;
      }

      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = start; i < value.length; i += 1) {
        const char = value[i];

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === "\\") {
            escaped = true;
          } else if (char === "\"") {
            inString = false;
          }
          continue;
        }

        if (char === "\"") {
          inString = true;
          continue;
        }

        if (char === "{" || char === "[") {
          depth += 1;
        } else if (char === "}" || char === "]") {
          depth -= 1;
          if (depth === 0) {
            candidates.push(value.slice(start, i + 1));
            break;
          }
        }
      }
    }

    return candidates;
  };

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const candidates = extractJsonCandidates(input.trim());
  if (!candidates.length) {
    return null;
  }

  for (const candidate of candidates) {
    const direct = tryParse(candidate);
    if (direct) {
      return direct;
    }

    const normalized = candidate
      .trim()
      .replace(/[“”«»]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{\s,])([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*(normal|warning|danger)\b/g, ': "$1"')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, text) =>
        `"${text.replace(/"/g, '\\"')}"`
      );

    const repaired = tryParse(normalized);
    if (repaired) {
      return repaired;
    }
  }

  return null;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureString = (value, fallback = "") => (typeof value === "string" ? value : fallback);

export const normalizeAnalysis = (data, meta = {}) => {
  const metrics = ensureArray(data?.metrics).map((item) => ({
    name: ensureString(item?.name, "Показатель"),
    value: ensureString(item?.value, ""),
    unit: ensureString(item?.unit, ""),
    range: ensureString(item?.range, ""),
    status: ["normal", "warning", "danger"].includes(item?.status) ? item.status : "normal",
    note: ensureString(item?.note, "")
  }));

  return {
    title: ensureString(data?.title, DEFAULT_TITLE),
    updatedAt: new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    }),
    summary: ensureString(data?.summary, ""),
    metrics,
    explanations: ensureArray(data?.explanations).map((item) => ({
      title: ensureString(item?.title, ""),
      text: ensureString(item?.text, "")
    })),
    diet: ensureArray(data?.diet).map((item) => ensureString(item, "")).filter(Boolean),
    lifestyle: ensureArray(data?.lifestyle).map((item) => ensureString(item, "")).filter(Boolean),
    vitamins: ensureArray(data?.vitamins).map((item) => ensureString(item, "")).filter(Boolean),
    dietPlan: ensureArray(data?.dietPlan || data?.diet_plan)
      .map((item) => ensureString(item, ""))
      .filter(Boolean),
    caution: ensureString(data?.caution, DEFAULT_CAUTION),
    source: meta
  };
};

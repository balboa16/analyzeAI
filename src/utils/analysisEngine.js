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
    lifestyle.push("10–15 минут дневного света в первой половине дня.");
  }

  const cholesterol = metricIndex.get("cholesterol");
  if (cholesterol && cholesterol.status !== "normal") {
    diet.push("Снизьте количество сахара и выпечки, добавьте клетчатку.");
    lifestyle.push("Ходьба 30 минут в день или 8–10 тыс. шагов.");
  }

  const glucose = metricIndex.get("glucose");
  if (glucose && glucose.status !== "normal") {
    diet.push("Сделайте упор на овощи и белок, уберите сладкие напитки.");
    lifestyle.push("Стабилизируйте сон: 7–8 часов ежедневно.");
  }

  const ferritin = metricIndex.get("ferritin");
  const hemoglobin = metricIndex.get("hemoglobin");
  if (
    (ferritin && ferritin.status === "warning") ||
    (hemoglobin && hemoglobin.status === "warning")
  ) {
    diet.push("Добавьте источники железа: говядина, печень, бобовые.");
    vitamins.push("Железо — по назначению врача после консультации.");
  }

  if (!diet.length) {
    diet.push("Овощи 400–500 г в день и достаточное количество воды.");
  }

  if (!lifestyle.length) {
    lifestyle.push("Легкая ежедневная активность и контроль стресса.");
  }

  if (!vitamins.length) {
    vitamins.push("Поддерживающий поливитаминный комплекс по согласованию с врачом.");
  }

  return { diet, lifestyle, vitamins };
};

export const buildRuleBasedAnalysis = (text) => {
  const metrics = extractMetricsFromText(text);
  const tips = buildTips(metrics);

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
  "caution": string
}

Правила:
- Распознавай показатели из текста анализов, не придумывай новые.
- range всегда строка; если диапазон не указан, ставь "".
- status вычисляй по диапазону; если диапазона нет, ставь "normal".
- note: кратко ("в норме", "выше нормы", "ниже нормы", "требует внимания").
- summary: 2–3 предложения — общая картина, ключевые отклонения, следующий шаг.
- explanations: до 4 пунктов, только по отклонениям.
- diet/lifestyle/vitamins: по 3–5 конкретных, выполнимых рекомендаций.
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
    caution: ensureString(data?.caution, DEFAULT_CAUTION),
    source: meta
  };
};

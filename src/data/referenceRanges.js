export const referenceRanges = [
  {
    id: "glucose",
    name: "Глюкоза",
    unit: "ммоль/л",
    range: { min: 3.9, max: 5.5 },
    patterns: [/глюкоз/i, /glucose/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Глюкоза показывает, как организм справляется с сахаром. Повышение может быть связано с питанием, стрессом или инсулинорезистентностью."
  },
  {
    id: "vitamin-d",
    name: "Витамин D (25(OH)D)",
    unit: "нг/мл",
    range: { min: 30, max: 60 },
    patterns: [/витамин\s*d/i, /25\(oh\)d/i, /vitamin\s*d/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Витамин D влияет на иммунитет, энергию и настроение. Низкие значения часто встречаются в зимний период."
  },
  {
    id: "cholesterol",
    name: "Общий холестерин",
    unit: "ммоль/л",
    range: { max: 5.2 },
    patterns: [/холестерин/i, /cholesterol/i],
    highNote: "Слегка повышен",
    description:
      "Повышенный холестерин важно корректировать питанием, активностью и контролем веса."
  },
  {
    id: "ferritin",
    name: "Ферритин",
    unit: "мкг/л",
    range: { min: 30, max: 150 },
    patterns: [/ферритин/i, /ferritin/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Ферритин показывает запас железа. Низкие значения могут давать усталость и снижение энергии."
  },
  {
    id: "alt",
    name: "ALT",
    unit: "Ед/л",
    range: { max: 35 },
    patterns: [/\balt\b/i, /алт/i],
    highNote: "Выше нормы",
    description:
      "ALT отражает состояние печени. Повышение может быть связано с нагрузкой на печень или лекарствами."
  },
  {
    id: "ast",
    name: "AST",
    unit: "Ед/л",
    range: { max: 35 },
    patterns: [/\bast\b/i, /аст/i],
    highNote: "Выше нормы",
    description:
      "AST также связан с состоянием печени и мышечной нагрузкой."
  },
  {
    id: "hemoglobin",
    name: "Гемоглобин",
    unit: "г/л",
    range: { min: 120, max: 160 },
    patterns: [/гемоглобин/i, /hemoglobin/i, /hgb/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Гемоглобин отвечает за перенос кислорода. Низкие значения могут указывать на анемию."
  },
  {
    id: "wbc",
    name: "Лейкоциты",
    unit: "10^9/л",
    range: { min: 4, max: 9 },
    patterns: [/лейкоцит/i, /wbc/i, /leukocyte/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Лейкоциты отражают иммунный ответ. Повышение бывает при воспалении, понижение — при снижении иммунитета."
  },
  {
    id: "platelets",
    name: "Тромбоциты",
    unit: "10^9/л",
    range: { min: 150, max: 400 },
    patterns: [/тромбоцит/i, /plt/i, /platelet/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "Тромбоциты важны для свертывания крови. Отклонения требуют консультации специалиста."
  },
  {
    id: "tsh",
    name: "ТТГ",
    unit: "мМЕ/л",
    range: { min: 0.4, max: 4 },
    patterns: [/ттг/i, /tsh/i],
    lowNote: "Ниже нормы",
    highNote: "Выше нормы",
    description:
      "ТТГ отражает работу щитовидной железы. Отклонения влияют на вес, сон и энергию."
  }
];

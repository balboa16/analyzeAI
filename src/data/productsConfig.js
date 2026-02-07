export const DEFAULT_WHATSAPP_NUMBER = "996700000000";

export const productsConfig = [
  {
    id: "consult",
    title: "Онлайн консультация врача",
    purpose: "Быстро обсудить результаты и получить план.",
    price_from: 990,
    duration: "15 минут",
    bullets: ["15 минут разбора", "Ответы на вопросы", "Рекомендации по шагам"],
    tag: "Популярно",
    relatedMetrics: ["danger"],
    whatsapp_template:
      "Здравствуйте! Хочу {product}. Меня зовут {name}, телефон {phone}. Удобно связаться в WhatsApp: {whatsapp}. Предпочтительное время: {time}. Город: Бишкек. Источник: analyze.sapatlab.kg",
    showInCards: true,
  },
  {
    id: "checkup",
    title: "Чекап SAPATLAB",
    purpose: "Полный обзор состояния организма.",
    price_from: 6900,
    duration: "1 визит",
    bullets: [
      "Комплекс под возраст",
      "Все в одном визите",
      "Расшифровка включена",
    ],
    tag: "Комплекс",
    relatedMetrics: ["multiple-warnings"],
    whatsapp_template:
      "Здравствуйте! Хочу {product}. Меня зовут {name}, телефон {phone}. Удобно связаться в WhatsApp: {whatsapp}. Предпочтительное время: {time}. Город: Бишкек. Источник: analyze.sapatlab.kg",
    showInCards: true,
  },
  {
    id: "plan",
    title: "Персональный план",
    purpose: "Поддержка и рекомендации на 30 дней.",
    price_from: 2400,
    duration: "30 дней",
    bullets: ["Питание и привычки", "Контроль динамики", "Поддержка врача"],
    tag: "План",
    relatedMetrics: ["warning"],
    whatsapp_template:
      "Здравствуйте! Хочу {product}. Меня зовут {name}, телефон {phone}. Удобно связаться в WhatsApp: {whatsapp}. Предпочтительное время: {time}. Город: Бишкек. Источник: analyze.sapatlab.kg",
    showInCards: true,
  },
  {
    id: "clinic",
    title: "Запись в клинику",
    purpose: "Подберём врача и удобное время приёма.",
    price_from: 0,
    duration: "",
    bullets: ["Подбор по району", "Согласуем время", "Напоминание о визите"],
    tag: "Без комиссии",
    relatedMetrics: ["general"],
    whatsapp_template:
      "Здравствуйте! Хочу {product}. Меня зовут {name}, телефон {phone}. Удобно связаться в WhatsApp: {whatsapp}. Предпочтительное время: {time}. Город: Бишкек. Источник: analyze.sapatlab.kg",
    showInCards: true,
  },
];

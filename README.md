# АнализAI — лендинг расшифровки анализов

Современный лендинг для сервиса «Расшифровка медицинских анализов с рекомендациями и диетой». Проект сделан на Vite + React + TailwindCSS, с мобильным фокусом и работающей AI-расшифровкой.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:5173

## Сборка

```bash
npm run build
npm run preview
```

## AI-расшифровка (OpenRouter)

1. Получите API ключ на https://openrouter.ai
2. Создайте `.env.local` и добавьте:

```env
VITE_OPENROUTER_API_KEY=ваш_ключ
```

3. Перезапустите `npm run dev`, если сервер уже был запущен.
4. Модель по умолчанию — `xiaomi/mimo-v2-flash:free`. При необходимости замените через UI или переменную `VITE_OPENROUTER_MODEL`.

## Ввод данных

- PDF с текстовым слоем — распознается автоматически.
- Фото/скан — используется OCR (tesseract.js), может занять больше времени.
- Ручной ввод — самый быстрый для демо.

## Структура проекта

- `src/pages` — страницы (сейчас одна `Home`)
- `src/sections` — секции лендинга
- `src/components` — переиспользуемые UI-элементы
- `src/sections/ChatBot.jsx` — простой чат‑консультант для проверки OpenRouter
- `src/data/mockAnalysis.js` — демо-текст и мок-данные
- `src/data/referenceRanges.js` — справочные диапазоны для базового анализа
- `src/utils/analysisEngine.js` — парсинг и базовые рекомендации
- `src/utils/aiProviders.js` — интеграция с OpenRouter
- `src/utils/extractText.js` — извлечение текста из PDF/изображений
- `src/utils/pdfReport.js` — генерация PDF-отчета

## Заметки

- PDF генерируется на клиенте через `jsPDF` и встроенный шрифт `IBM Plex Sans`.
- В случае ошибок AI автоматически показывается базовый анализ.

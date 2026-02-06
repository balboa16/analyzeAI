import { jsPDF } from "jspdf";
import fontUrl from "../assets/fonts/IBMPlexSans-Regular.ttf?url";
import logoUrl from "../assets/sapat-logo.png?url";

let fontCache = null;
let logoCache = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function loadFontBase64() {
  if (fontCache) {
    return fontCache;
  }

  const response = await fetch(fontUrl);
  const buffer = await response.arrayBuffer();
  fontCache = arrayBufferToBase64(buffer);
  return fontCache;
}

async function loadLogoBase64() {
  if (logoCache) {
    return logoCache;
  }

  const response = await fetch(logoUrl);
  const buffer = await response.arrayBuffer();
  logoCache = arrayBufferToBase64(buffer);
  return logoCache;
}

export async function generatePdfReport(analysis) {
  const fontData = await loadFontBase64();
  const logoData = await loadLogoBase64();
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.addFileToVFS("IBMPlexSans-Regular.ttf", fontData);
  doc.addFont("IBMPlexSans-Regular.ttf", "IBMPlexSans", "normal");
  doc.setFont("IBMPlexSans", "normal");
  doc.setLineHeightFactor(1.25);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - 56;
  let y = 64;

  const accent = [31, 127, 92];
  const soft = [230, 242, 237];
  const muted = [107, 114, 128];
  const baseText = [27, 27, 27];
  const rule = [229, 231, 235];
  const card = [246, 250, 248];
  const warningInk = [180, 83, 9];
  const warningSoft = [255, 244, 219];
  const dangerInk = [185, 28, 28];
  const dangerSoft = [254, 228, 228];

  const statusOrder = { normal: 0, warning: 1, danger: 2 };
  const statusStyles = {
    normal: { label: "Норма", ink: accent, soft: soft },
    warning: { label: "Погранично", ink: warningInk, soft: warningSoft },
    danger: { label: "Отклонение", ink: dangerInk, soft: dangerSoft },
  };

  const drawHeader = () => {
    doc.setFont("IBMPlexSans", "normal");
    doc.setFillColor(...soft);
    doc.rect(0, 0, pageWidth, 76, "F");
    doc.addImage(logoData, "PNG", margin, 18, 90, 40);
    doc.setTextColor(...baseText);
    doc.setFontSize(18);
    doc.text("Расшифровка медицинских анализов", margin + 110, 42);
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(`SAPATLAB · ${new Date().toLocaleDateString("ru-RU")}`, margin + 110, 58);
  };

  const ensureSpace = (needed) => {
    if (y + needed <= contentBottom) {
      return;
    }
    doc.addPage();
    drawHeader();
    y = 96;
  };

  const safeText = (value) => (value == null ? "" : String(value));

  const wrapText = (text, width) =>
    doc.splitTextToSize(safeText(text), width);

  const textHeight = (lines) => doc.getTextDimensions(lines).h;

  const drawWrapped = (
    text,
    x,
    width,
    { extraSpacing = 0, options = {} } = {},
  ) => {
    const lines = wrapText(text, width);
    const height = textHeight(lines);
    ensureSpace(height + extraSpacing);
    doc.text(lines, x, y, { baseline: "top", ...options });
    y += height + extraSpacing;
  };

  const drawBulletList = (
    items,
    {
      fontSize,
      lineGap = 6,
      x = margin,
      width = maxWidth,
      bulletIndent = 12,
    } = {},
  ) => {
    const resolvedFontSize = fontSize ?? doc.getFontSize();
    const bullet = "•";
    const textX = x + bulletIndent;
    const textWidth = width - bulletIndent;

    doc.setFontSize(resolvedFontSize);

    (items || []).forEach((item) => {
      const text = safeText(item).trim();
      if (!text) {
        return;
      }

      const lines = wrapText(text, textWidth);
      const height = textHeight(lines);
      ensureSpace(height + lineGap);
      doc.setTextColor(...baseText);
      doc.text(bullet, x, y, { baseline: "top" });
      doc.text(lines, textX, y, { baseline: "top" });
      y += height + lineGap;
    });
  };

  const resolveOverallStatus = (metrics) => {
    if (!metrics.length) {
      return "warning";
    }

    return metrics.reduce((acc, metric) => {
      const current =
        statusOrder[metric?.status] !== undefined ? metric.status : "normal";
      return statusOrder[current] > statusOrder[acc] ? current : acc;
    }, "normal");
  };

  const buildSummaryInsights = (value) => {
    const metrics = Array.isArray(value?.metrics) ? value.metrics : [];
    const flagged = metrics.filter((metric) => metric?.status !== "normal");
    const insights = [];

    if (flagged.length) {
      insights.push(
        `Показатели внимания: ${flagged
          .slice(0, 3)
          .map((item) => safeText(item?.name).trim())
          .filter(Boolean)
          .join(", ")}.`,
      );
    } else if (metrics.length) {
      insights.push("Ключевые показатели находятся в пределах нормы.");
    }

    const summary = safeText(value?.summary).trim();
    if (summary) {
      const sentence = summary
        .split(/[.!?]/)
        .map((item) => item.trim())
        .filter(Boolean)[0];
      if (sentence && !insights.includes(sentence)) {
        insights.push(sentence);
      }
    }

    if (insights.length < 3) {
      insights.push("Отчёт можно показать врачу или сохранить для истории.");
    }

    return insights.filter(Boolean).slice(0, 3);
  };

  const drawStatusPill = (status, xRight, yTop) => {
    const style = statusStyles[status] || statusStyles.normal;
    const label = style.label;
    const padX = 10;
    const padY = 5;
    const fontSize = 9;

    doc.setFontSize(fontSize);
    const textW = doc.getTextWidth(label);
    const w = textW + padX * 2;
    const h = fontSize + padY * 2;
    const x = xRight - w;

    doc.setFillColor(...style.soft);
    doc.setDrawColor(...style.ink);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, yTop, w, h, 10, 10, "FD");
    doc.setTextColor(...style.ink);
    doc.text(label, x + padX, yTop + padY, { baseline: "top" });

    doc.setLineWidth(1);
    doc.setTextColor(...baseText);
    return { w, h, x };
  };

  const sectionTitle = (title) => {
    doc.setFontSize(12);
    const titleHeight = textHeight([safeText(title)]);
    ensureSpace(titleHeight + 24);
    doc.setTextColor(...accent);
    doc.text(safeText(title), margin, y, { baseline: "top" });
    y += titleHeight + 6;
    doc.setDrawColor(...rule);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    doc.setTextColor(...baseText);
  };

  drawHeader();
  y = 96;

  const metrics = Array.isArray(analysis?.metrics) ? analysis.metrics : [];
  const overallStatus = resolveOverallStatus(metrics);
  const insights = buildSummaryInsights(analysis);

  // Meta
  ensureSpace(84);
  doc.setTextColor(...muted);
  doc.setFontSize(9);
  doc.text("ОТЧЕТ SAPATLAB", margin, y, { baseline: "top" });
  drawStatusPill(overallStatus, pageWidth - margin, y - 2);
  y += 18;

  doc.setTextColor(...baseText);
  doc.setFontSize(20);
  drawWrapped(analysis?.title, margin, maxWidth, { extraSpacing: 8 });

  const updatedAt = safeText(analysis?.updatedAt).trim();
  const sourceLine = analysis?.source?.provider
    ? `Источник: ${analysis.source.provider} · ${safeText(analysis.source.model)}`
    : "";

  doc.setFontSize(10);
  doc.setTextColor(...muted);
  const metaLines = [updatedAt, sourceLine].filter(Boolean).join(" · ");
  if (metaLines) {
    drawWrapped(metaLines, margin, maxWidth, { extraSpacing: 14 });
  } else {
    y += 10;
  }

  // Summary card
  doc.setFontSize(11);
  const cardPad = 16;
  const cardX = margin;
  const cardW = maxWidth;
  const labelHeight = textHeight(["Коротко"]);
  const listMeasure = () => {
    const prevSize = doc.getFontSize();
    doc.setFontSize(11);
    let sum = 0;
    insights.forEach((item) => {
      const lines = wrapText(item, cardW - cardPad * 2 - 12);
      sum += textHeight(lines) + 6;
    });
    doc.setFontSize(prevSize);
    return sum;
  };
  const listHeight = listMeasure();
  const cardH = cardPad + labelHeight + 10 + listHeight + (cardPad - 6);

  ensureSpace(cardH + 8);
  doc.setFillColor(...card);
  doc.roundedRect(cardX, y, cardW, cardH, 16, 16, "F");

  let cy = y + cardPad;
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Коротко", cardX + cardPad, cy, { baseline: "top" });
  cy += labelHeight + 10;

  doc.setFontSize(11);
  doc.setTextColor(...baseText);
  const savedY = y;
  y = cy;
  drawBulletList(insights, {
    fontSize: 11,
    lineGap: 6,
    x: cardX + cardPad,
    width: cardW - cardPad * 2,
  });
  cy = y;
  y = savedY + cardH + 18;

  sectionTitle("Основные показатели");

  const rowW = maxWidth;
  const rowPadX = 14;
  const rowPadY = 12;
  const rowGap = 10;
  const leftW = 300;
  const rightW = rowW - leftW - 20;

  metrics.forEach((metric) => {
    const status =
      statusOrder[metric?.status] !== undefined ? metric.status : "normal";
    const style = statusStyles[status] || statusStyles.normal;
    const name = safeText(metric?.name).trim() || "—";
    const note = safeText(metric?.note).trim();
    const valueText = safeText(metric?.value).trim() || "—";
    const unit = safeText(metric?.unit).trim();
    const range = safeText(metric?.range).trim();

    doc.setFontSize(11);
    const nameLines = wrapText(name, leftW);
    const nameH = textHeight(nameLines);

    doc.setFontSize(9);
    const noteLines = note ? wrapText(note, leftW) : [];
    const noteH = noteLines.length ? textHeight(noteLines) : 0;

    const leftH = nameH + (noteH ? 6 + noteH : 0);

    doc.setFontSize(12);
    const valueLine = `${valueText}${unit ? ` ${unit}` : ""}`;
    const valueH = textHeight([valueLine]);

    doc.setFontSize(9);
    const rangeLine = range ? `Норма: ${range}` : "Норма: —";
    const rangeLines = wrapText(rangeLine, rightW);
    const rangeH = textHeight(rangeLines);

    const rightH = valueH + 6 + rangeH;
    const pillH = 9 + 5 * 2;

    const rowH = rowPadY * 2 + Math.max(leftH, rightH, pillH);
    ensureSpace(rowH + rowGap);

    const rowY = y;
    doc.setFillColor(...style.soft);
    doc.roundedRect(margin, rowY, rowW, rowH, 14, 14, "F");

    const contentY = rowY + rowPadY;
    const leftX = margin + rowPadX;

    // Left
    doc.setFontSize(11);
    doc.setTextColor(...baseText);
    doc.text(nameLines, leftX, contentY, { baseline: "top" });

    if (noteLines.length) {
      doc.setFontSize(9);
      doc.setTextColor(...style.ink);
      doc.text(noteLines, leftX, contentY + nameH + 6, { baseline: "top" });
    }

    // Right
    const rightX = margin + rowPadX + leftW + 14;
    doc.setFontSize(12);
    doc.setTextColor(...baseText);
    doc.text(valueLine, rightX, contentY, { baseline: "top" });

    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(rangeLines, rightX, contentY + valueH + 6, { baseline: "top" });

    // Pill
    drawStatusPill(status, margin + rowW - rowPadX, rowY + rowPadY - 2);

    y = rowY + rowH + rowGap;
  });

  y += 10;
  if (Array.isArray(analysis?.explanations) && analysis.explanations.length) {
    sectionTitle("Пояснения по отклонениям");
    doc.setFontSize(11);
    analysis.explanations.forEach((item) => {
      const title = safeText(item?.title).trim();
      const text = safeText(item?.text).trim();
      if (!title && !text) {
        return;
      }

      const blockPad = 14;
      const blockX = margin;
      const blockW = maxWidth;

      doc.setFontSize(11);
      const titleLines = title ? wrapText(title, blockW - blockPad * 2) : [];
      const titleH = titleLines.length ? textHeight(titleLines) : 0;
      doc.setFontSize(10);
      const textLines = text ? wrapText(text, blockW - blockPad * 2) : [];
      const textH = textLines.length ? textHeight(textLines) : 0;

      const blockH = blockPad + titleH + (textH ? 8 + textH : 0) + blockPad;
      ensureSpace(blockH + 10);

      const by = y;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...rule);
      doc.setLineWidth(0.8);
      doc.roundedRect(blockX, by, blockW, blockH, 14, 14, "FD");

      let ty = by + blockPad;
      if (titleLines.length) {
        doc.setFontSize(11);
        doc.setTextColor(...baseText);
        doc.text(titleLines, blockX + blockPad, ty, { baseline: "top" });
        ty += titleH + 8;
      }

      if (textLines.length) {
        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.text(textLines, blockX + blockPad, ty, { baseline: "top" });
      }

      y = by + blockH + 10;
      doc.setLineWidth(1);
      doc.setTextColor(...baseText);
    });
  }

  sectionTitle("Рекомендации");

  const drawRecGroup = (title, items) => {
    const filtered = (items || []).map((item) => safeText(item).trim()).filter(Boolean);
    if (!filtered.length) {
      return;
    }

    doc.setFontSize(10);
    doc.setTextColor(...muted);
    drawWrapped(title.toUpperCase(), margin, maxWidth, { extraSpacing: 8 });
    doc.setFontSize(11);
    doc.setTextColor(...baseText);
    drawBulletList(filtered, { fontSize: 11, lineGap: 6 });
    y += 4;
  };

  drawRecGroup("Питание", analysis?.diet);
  drawRecGroup("Образ жизни", analysis?.lifestyle);
  drawRecGroup("Витамины", analysis?.vitamins);

  const dietPlan = Array.isArray(analysis?.dietPlan) ? analysis.dietPlan : [];
  if (dietPlan.length) {
    y += 4;
    sectionTitle("План питания на 7 дней (пример)");
    drawBulletList(dietPlan, { fontSize: 10, lineGap: 5 });
  }

  const caution = safeText(analysis?.caution).trim();
  if (caution) {
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    drawWrapped(caution, margin, maxWidth, { extraSpacing: 0 });
    doc.setTextColor(...baseText);
  }

  // Footer (page numbers)
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("IBMPlexSans", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(
      `Страница ${page} из ${pageCount}`,
      pageWidth - margin,
      pageHeight - 28,
      { align: "right", baseline: "top" },
    );
  }

  doc.save("analysis-report.pdf");
}

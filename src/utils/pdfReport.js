import { jsPDF } from "jspdf";
import fontUrl from "../assets/fonts/IBMPlexSans-Regular.ttf?url";

let fontCache = null;

async function loadFontBase64() {
  if (fontCache) {
    return fontCache;
  }

  const response = await fetch(fontUrl);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  fontCache = btoa(binary);
  return fontCache;
}

export async function generatePdfReport(analysis) {
  const fontData = await loadFontBase64();
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.addFileToVFS("IBMPlexSans-Regular.ttf", fontData);
  doc.addFont("IBMPlexSans-Regular.ttf", "IBMPlexSans", "normal");
  doc.setFont("IBMPlexSans", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 64;

  doc.setFontSize(20);
  doc.text("Расшифровка медицинских анализов", margin, y);
  y += 24;

  doc.setFontSize(11);
  doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, margin, y);
  y += 22;

  doc.setFontSize(14);
  doc.text(analysis.title, margin, y);
  y += 18;

  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(analysis.summary, maxWidth), margin, y);
  y += 52;

  doc.setFontSize(12);
  doc.text("Основные показатели:", margin, y);
  y += 18;

  doc.setFontSize(11);
  analysis.metrics.forEach((metric) => {
    if (y > 760) {
      doc.addPage();
      y = 60;
    }

    doc.text(
      `${metric.name}: ${metric.value} ${metric.unit} (норма ${metric.range})`,
      margin,
      y
    );
    y += 16;
  });

  y += 16;
  doc.setFontSize(12);
  doc.text("Рекомендации:", margin, y);
  y += 18;

  doc.setFontSize(11);
  const recommendations = [...analysis.diet, ...analysis.lifestyle, ...analysis.vitamins];
  recommendations.forEach((item) => {
    if (y > 760) {
      doc.addPage();
      y = 60;
    }

    doc.text(`• ${item}`, margin, y);
    y += 16;
  });

  y += 18;
  doc.setFontSize(9);
  doc.text(analysis.caution, margin, y, { maxWidth });

  doc.save("analysis-report.pdf");
}

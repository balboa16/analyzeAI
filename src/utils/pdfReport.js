import { jsPDF } from "jspdf";
import fontUrl from "../assets/fonts/IBMPlexSans-Regular.ttf?url";
import logoUrl from "../assets/sapat-logo.png?url";

let fontCache = null;
let logoCache = null;

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

async function loadLogoBase64() {
  if (logoCache) {
    return logoCache;
  }

  const response = await fetch(logoUrl);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  logoCache = btoa(binary);
  return logoCache;
}

export async function generatePdfReport(analysis) {
  const fontData = await loadFontBase64();
  const logoData = await loadLogoBase64();
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.addFileToVFS("IBMPlexSans-Regular.ttf", fontData);
  doc.addFont("IBMPlexSans-Regular.ttf", "IBMPlexSans", "normal");
  doc.setFont("IBMPlexSans", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 64;

  const accent = [31, 127, 92];
  const soft = [230, 242, 237];
  const muted = [107, 114, 128];

  const drawHeader = () => {
    doc.setFillColor(...soft);
    doc.rect(0, 0, pageWidth, 76, "F");
    doc.addImage(logoData, "PNG", margin, 18, 90, 40);
    doc.setTextColor(27, 27, 27);
    doc.setFontSize(18);
    doc.text("–асшифровка медицинских анализов", margin + 110, 42);
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(`SAPATLAB Ј ${new Date().toLocaleDateString("ru-RU")}`, margin + 110, 58);
  };

  const ensureSpace = (needed) => {
    if (y + needed <= pageHeight - 56) {
      return;
    }
    doc.addPage();
    drawHeader();
    y = 96;
  };

  const sectionTitle = (title) => {
    ensureSpace(30);
    doc.setTextColor(...accent);
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 12;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    doc.setTextColor(27, 27, 27);
  };

  drawHeader();
  y = 96;

  doc.setFontSize(15);
  doc.text(analysis.title, margin, y);
  y += 16;

  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text(doc.splitTextToSize(analysis.summary, maxWidth), margin, y);
  doc.setTextColor(27, 27, 27);
  y += 40;

  sectionTitle("ќсновные показатели");

  doc.setFontSize(11);
  analysis.metrics.forEach((metric) => {
    ensureSpace(20);
    const left = `${metric.name}`;
    const right = `${metric.value} ${metric.unit} Ј норма ${metric.range || "Ч"}`;
    doc.setTextColor(27, 27, 27);
    doc.text(left, margin, y);
    doc.setTextColor(...muted);
    doc.text(right, margin + 220, y);
    y += 16;
  });

  y += 14;
  sectionTitle("–екомендации");

  doc.setFontSize(11);
  const recommendations = [
    ...(analysis.diet || []),
    ...(analysis.lifestyle || []),
    ...(analysis.vitamins || [])
  ];
  recommendations.forEach((item) => {
    ensureSpace(18);
    doc.text(`Х ${item}`, margin, y);
    y += 16;
  });

  if (analysis.dietPlan?.length) {
    y += 10;
    sectionTitle("ѕлан питани€ на 7 дней (пример)");
    doc.setFontSize(10);
    analysis.dietPlan.forEach((item) => {
      ensureSpace(18);
      doc.text(`Х ${item}`, margin, y);
      y += 15;
    });
  }

  y += 16;
  ensureSpace(30);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(analysis.caution, margin, y, { maxWidth });

  doc.save("analysis-report.pdf");
}

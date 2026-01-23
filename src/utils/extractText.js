const OCR_PAGE_LIMIT = 3;
const OCR_SCALE = 1.6;
const MIN_TEXT_LENGTH = 80;
const MIN_DIGIT_COUNT = 3;

const hasUsefulSignal = (text) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const digitCount = (trimmed.match(/\d/g) || []).length;
  const hasUnits = /(ммоль|мкг|нг|мг|г\/л|ед\/л|iu|%)/i.test(trimmed);

  if (digitCount >= MIN_DIGIT_COUNT && hasUnits) {
    return true;
  }

  if (digitCount >= MIN_DIGIT_COUNT * 2) {
    return true;
  }

  return trimmed.length >= MIN_TEXT_LENGTH && digitCount > 0;
};

const renderPdfPage = async (page, scale) => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

const extractPdfWithOcr = async (pdf, onProgress) => {
  try {
    const { default: Tesseract } = await import("tesseract.js");
    const totalPages = Math.min(pdf.numPages, OCR_PAGE_LIMIT);
    let output = "";

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const canvas = await renderPdfPage(page, OCR_SCALE);

      const result = await Tesseract.recognize(canvas, "rus+eng", {
        logger: (message) => {
          if (onProgress && typeof message.progress === "number") {
            onProgress({
              stage: "OCR",
              progress: (pageNumber - 1 + message.progress) / totalPages
            });
          }
        }
      });

      if (result?.data?.text) {
        output += `${result.data.text}\n`;
      }
    }

    if (onProgress) {
      onProgress({ stage: "OCR", progress: 1 });
    }

    return output.trim();
  } catch {
    if (onProgress) {
      onProgress({ stage: "OCR", progress: 1 });
    }
    return "";
  }
};

export const extractTextFromFile = async (file, onProgress) => {
  if (!file) {
    return "";
  }

  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  if (isPdf) {
    const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf"),
      import("pdfjs-dist/legacy/build/pdf.worker?url")
    ]);

    GlobalWorkerOptions.workerSrc = worker.default;

    const arrayBuffer = await file.arrayBuffer();
    let pdf = null;

    try {
      pdf = await getDocument({ data: arrayBuffer }).promise;
    } catch {
      pdf = await getDocument({ data: arrayBuffer, disableWorker: true }).promise;
    }

    let output = "";

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        output += `${content.items.map((item) => item.str).join(" ")}\n`;
        if (onProgress) {
          onProgress({
            stage: "PDF",
            progress: pageNumber / pdf.numPages
          });
        }
      }
    } catch {
      output = "";
    }

    const text = output.trim();
    if (hasUsefulSignal(text)) {
      return text;
    }

    const ocrText = await extractPdfWithOcr(pdf, onProgress);
    return ocrText || text;
  }

  if (isImage) {
    const { default: Tesseract } = await import("tesseract.js");
    const result = await Tesseract.recognize(file, "rus+eng", {
      logger: (message) => {
        if (onProgress && typeof message.progress === "number") {
          onProgress({
            stage: message.status,
            progress: message.progress
          });
        }
      }
    });

    return result?.data?.text?.trim() || "";
  }

  return "";
};

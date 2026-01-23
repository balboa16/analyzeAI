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
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let output = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      output += `${content.items.map((item) => item.str).join(" ")}\n`;
      if (onProgress) {
        onProgress({
          stage: "pdf",
          progress: pageNumber / pdf.numPages
        });
      }
    }

    return output.trim();
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

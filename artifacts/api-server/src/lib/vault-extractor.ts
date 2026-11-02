import { parentPort, workerData } from "node:worker_threads";
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { requestOcr, OCR_ERRORS } from "./vault-ocr-provider";
import { validOcrRange } from "./vault-pdf-range";
import { selectPdfPages } from "./vault-pdf-render";

async function extract() {
  const bytes = Buffer.from(workerData.bytes);
  if (workerData.apiKey) {
    if (bytes.length > (workerData.type === "PDF" ? 50 : 15) * 1024 * 1024 || !["PDF", "PNG", "JPG", "JPEG"].includes(workerData.type)) throw new Error("OCR input invalid");
    if (workerData.type === "PDF") {
      if (!validOcrRange(workerData.pageRange)) throw new Error("OCR_PAGE_RANGE");
      const selected = await selectPdfPages(bytes, workerData.pageRange);
      parentPort?.postMessage({ prepared: true });
      const numbers = Array.from({ length: workerData.pageRange.end - workerData.pageRange.start + 1 }, (_, i) => workerData.pageRange.start + i);
      const raw = await requestOcr(selected, "PDF", workerData.apiKey, fetch, numbers);
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new Error("OCR_FAILED"); }
      if (!Array.isArray(parsed.pages) || parsed.pages.length !== numbers.length) throw new Error("OCR_FAILED");
      let text = "";
      const pages = numbers.map((page, i) => {
        const item = parsed.pages[i];
        if (item?.page !== page || typeof item.text !== "string") throw new Error("OCR_FAILED");
        const content = item.text.replace(/\0/g, "").trim();
        const start = text.length;
        text += content;
        const end = text.length;
        text += "\n\n";
        return { page, start, end };
      });
      if (text.length > 100_000) throw new Error("OCR_OUTPUT_LIMIT");
      parentPort?.postMessage({ text, pages });
      return;
    }
    const text = await requestOcr(bytes, workerData.type, workerData.apiKey);
    parentPort?.postMessage({ text });
    return;
  }
  // Old PDF.js expects slice() to copy; Buffer.slice() instead creates a view.
  // Allocate this copy only for local PDF parsing, not OCR range preparation.
  const pdfBytes = workerData.type === "PDF" ? new Uint8Array(bytes) as Buffer : bytes;
  let text = "";
  if (workerData.type === "PDF") text = (await pdf(pdfBytes, { max: 150 })).text;
  if (workerData.type === "DOCX") text = (await mammoth.extractRawText({ buffer: bytes })).value;
  if (workerData.type === "XLSX") {
    const book = XLSX.read(bytes, { type: "buffer", sheetRows: 2000, bookVBA: false, cellHTML: false });
    text = book.SheetNames.slice(0, 20).map(name => `${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name])}`).join("\n");
  }
  parentPort?.postMessage({ text: text.replace(/\0/g, "").trim().slice(0, 100_000) });
}
extract().catch((error: unknown) => parentPort?.postMessage({
  error: true,
  code: error instanceof Error && Object.hasOwn(OCR_ERRORS, error.message) ? error.message : "OCR_FAILED",
}));

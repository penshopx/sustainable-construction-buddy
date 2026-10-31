import { parentPort, workerData } from "node:worker_threads";
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { requestOcr, OCR_ERRORS } from "./vault-ocr-provider";

async function extract() {
  const bytes = Buffer.from(workerData.bytes);
  // Old PDF.js treats Buffer.slice() as if it made a copy. Node Buffers
  // instead return a view, which can produce "bad XRef entry" on valid PDFs.
  // pdf-parse accepts Uint8Array at runtime; its old declarations say Buffer.
  const pdfBytes = new Uint8Array(bytes) as Buffer;
  if (workerData.apiKey) {
    if (bytes.length > 15 * 1024 * 1024 || !["PDF", "PNG", "JPG", "JPEG"].includes(workerData.type)) throw new Error("OCR input invalid");
    if (workerData.type === "PDF") {
      const metadata = await pdf(pdfBytes, { max: 1 });
      if (!metadata.numpages || metadata.numpages > 30) throw new Error("OCR_PDF_LIMIT");
    }
    const text = await requestOcr(bytes, workerData.type, workerData.apiKey);
    parentPort?.postMessage({ text });
    return;
  }
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

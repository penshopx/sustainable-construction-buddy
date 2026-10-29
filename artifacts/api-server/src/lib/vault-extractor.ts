import { parentPort, workerData } from "node:worker_threads";
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

async function extract() {
  const bytes = Buffer.from(workerData.bytes);
  let text = "";
  if (workerData.type === "PDF") text = (await pdf(bytes, { max: 150 })).text;
  if (workerData.type === "DOCX") text = (await mammoth.extractRawText({ buffer: bytes })).value;
  if (workerData.type === "XLSX") {
    const book = XLSX.read(bytes, { type: "buffer", sheetRows: 2000, bookVBA: false, cellHTML: false });
    text = book.SheetNames.slice(0, 20).map(name => `${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name])}`).join("\n");
  }
  parentPort?.postMessage({ text: text.replace(/\0/g, "").trim().slice(0, 100_000) });
}
extract().catch(() => parentPort?.postMessage({ error: true }));

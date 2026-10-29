import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import { fail } from "./vault-store";

const storage = new Storage({
  credentials: {
    audience: "replit", subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token", type: "external_account",
    credential_source: { url: "http://127.0.0.1:1106/credential", format: { type: "json", subject_token_field_name: "access_token" } },
    universe_domain: "googleapis.com",
  }, projectId: "",
});
export function privateFile(path: string) {
  const root = process.env.PRIVATE_OBJECT_DIR ?? "";
  if (!root || !path.startsWith(`${root}/ruang-simpan/`)) fail(503, "Penyimpanan privat belum siap.");
  const parts = path.replace(/^\//, "").split("/");
  const bucket = parts.shift()!;
  return storage.bucket(bucket).file(parts.join("/"));
}
export function objectPath(owner: string) {
  const root = process.env.PRIVATE_OBJECT_DIR;
  if (!root) fail(503, "Penyimpanan privat belum siap.");
  return `${root}/ruang-simpan/${owner}/${randomUUID()}`;
}
const formats: Record<string, string> = {
  pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain", md: "text/markdown", csv: "text/csv", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
};
export function validateFile(name: string, bytes: Buffer) {
  const type = name.split(".").pop()?.toLowerCase() ?? "";
  if (!formats[type]) fail(400, "Format belum didukung. Gunakan PDF, DOCX, XLSX, TXT, MD, CSV, JPG, atau PNG.");
  if (!bytes.length) fail(400, "File kosong tidak dapat diunggah.");
  if (type === "pdf" && !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) fail(400, "Isi file bukan PDF yang valid.");
  if (["docx", "xlsx"].includes(type) && !bytes.subarray(0, 2).equals(Buffer.from("PK"))) fail(400, "Dokumen Office tidak valid.");
  if (type === "png" && !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) fail(400, "Gambar PNG tidak valid.");
  if (["jpg", "jpeg"].includes(type) && (bytes[0] !== 255 || bytes[1] !== 216)) fail(400, "Gambar JPG tidak valid.");
  return { type: type.toUpperCase(), mime: formats[type] };
}
let extractionCount = 0;
export async function extractText(bytes: Buffer, type: string): Promise<string> {
  if (["TXT", "MD", "CSV"].includes(type)) return bytes.toString("utf8").replace(/\0/g, "").trim().slice(0, 100_000);
  if (!["PDF", "DOCX", "XLSX"].includes(type)) return "";
  if (extractionCount >= 2) throw new Error("Extraction workers busy");
  extractionCount++;
  try {
    return await new Promise<string>((resolve, reject) => {
      // A bounded, disposable worker prevents parser failures or compressed
      // document expansion from blocking the shared API's event loop.
      const worker = new Worker(new URL("./vault-extractor.cjs", import.meta.url), {
        workerData: { bytes, type },
        resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 16 },
      });
      const timer = setTimeout(() => { void worker.terminate(); reject(new Error("Extraction timeout")); }, 15_000);
      worker.once("message", (result: { text?: string; error?: boolean }) => {
        clearTimeout(timer); void worker.terminate();
        if (result.error) reject(new Error("Extraction failed")); else resolve(result.text ?? "");
      });
      worker.once("error", () => { clearTimeout(timer); reject(new Error("Extraction failed")); });
      worker.once("exit", code => { clearTimeout(timer); if (code !== 0) reject(new Error("Extraction stopped")); });
    });
  } finally { extractionCount--; }
}

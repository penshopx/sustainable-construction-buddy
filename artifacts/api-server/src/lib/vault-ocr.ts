import { randomUUID } from "node:crypto";
import { workspace, ownDocument, activity, fail, type VaultState } from "./vault-store";
import { privateFile, reserveExtractionWorker, runExtractionWorker } from "./vault-files";
import { logger } from "./logger";
import { OCR_ERRORS } from "./vault-ocr-provider";

// Persisted lease lets a restarted server expose interruption and offer retry.
export function expireOcrJobs(state: VaultState) {
  for (const doc of state.documents) {
    if (doc.status === "processing" && (!doc.ocrAttemptedAt || Date.parse(doc.ocrAttemptedAt) < Date.now() - 120_000)) {
      doc.status = "failed";
      doc.ocrError = "Proses OCR terhenti atau melewati batas waktu. Silakan coba ulang dengan persetujuan baru.";
      delete doc.ocrJob;
      activity(state, `OCR terhenti: ${doc.name}`);
    }
  }
}

async function readPrivateBytes(path: string, expectedSize: number) {
  const stream = privateFile(path).createReadStream();
  const timer = setTimeout(() => stream.destroy(new Error("Read timeout")), 15_000);
  const parts: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of stream) {
      size += chunk.length;
      if (size > 15 * 1024 * 1024 || size > expectedSize) throw new Error("File exceeds size");
      parts.push(Buffer.from(chunk));
    }
    if (size !== expectedSize || !size) throw new Error("File size mismatch");
    return Buffer.concat(parts);
  } finally { clearTimeout(timer); stream.destroy(); }
}

export async function startVaultOcr(owner: string, id: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) fail(503, "Layanan OCR belum dikonfigurasi. File tetap tersimpan.");
  const release = reserveExtractionWorker();
  const job = randomUUID();
  let doc;
  try {
    doc = await workspace(owner, state => {
      expireOcrJobs(state);
      const d = ownDocument(state, id);
      if (!["PDF", "PNG", "JPG", "JPEG"].includes(d.type)) fail(400, "OCR hanya untuk PDF, JPG, dan PNG.");
      if (d.status === "processing" || d.status === "ready") fail(409, "Dokumen sedang diproses atau teks sudah siap.");
      if (d.ocrAttemptedAt && Date.parse(d.ocrAttemptedAt) > Date.now() - 60_000) fail(429, "Tunggu satu menit sebelum mencoba OCR lagi.");
      if (d.size > 15 * 1024 * 1024) fail(413, "OCR mendukung maksimal 15 MiB; file asli tetap tersimpan. Gunakan salinan lebih kecil.");
      d.status = "processing"; d.ocrJob = job; d.ocrAttemptedAt = new Date().toISOString();
      delete d.ocrError;
      activity(state, `Persetujuan OCR openrouter-anthropic-v1 diterima; proses dimulai: ${d.name}`);
      return { ...d };
    });
  } catch (err) { release(); throw err; }
  const input = doc;
  // Background task is bounded; never keep a database lock during I/O or inference.
  void (async () => {
    let text = "", error = "";
    try {
      const bytes = await readPrivateBytes(input.objectPath, input.size);
      text = await runExtractionWorker(bytes, input.type, apiKey);
      if (!text || !text.replace(/\[tidak terbaca\]/gi, "").trim()) error = "Tidak ada teks terbaca. Gunakan foto lebih jelas atau PDF scan yang lebih tajam.";
    } catch (err) {
      error = OCR_ERRORS[err instanceof Error ? err.message : ""] ?? OCR_ERRORS.OCR_FAILED;
    }
    try {
      await workspace(owner, state => {
        // Deletion, lease expiration or a newer attempt must never be undone.
        const current = state.documents.find(d => d.id === id && d.ocrJob === job && d.status === "processing");
        if (!current) return;
        current.text = error ? "" : text;
        current.status = error ? "failed" : "ready";
        if (error) current.ocrError = error;
        delete current.ocrJob;
        activity(state, `OCR ${error ? "gagal" : "selesai; teks tersimpan"}: ${current.name}`);
      });
    } catch { logger.warn("OCR result could not be persisted; lease will expire"); }
    finally { release(); }
  })();
  const { objectPath: _path, ocrJob: _job, ...safe } = input;
  return safe;
}

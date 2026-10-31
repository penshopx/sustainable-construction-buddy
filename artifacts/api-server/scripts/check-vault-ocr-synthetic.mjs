// Explicit live-provider check, restricted to generated, non-personal fixtures.
// Run after `pnpm --filter @workspace/api-server build`:
// RS_OCR_SYNTHETIC_LIVE=1 node artifacts/api-server/scripts/check-vault-ocr-synthetic.mjs
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import assert from "node:assert/strict";

if (process.env.RS_OCR_SYNTHETIC_LIVE !== "1") throw new Error("Explicit synthetic live-check opt-in required; uses paid OpenRouter inference.");
if (!process.env.OPENROUTER_API_KEY) throw new Error("OCR provider is not configured.");
const dir = new URL("../../../generated-artifacts/vault-ocr-synthetic/", import.meta.url);
await mkdir(dir, { recursive: true });
const png = new URL("synthetic.png", dir);
execFileSync("convert", [
  "-size", "1200x600", "xc:white", "-font", "DejaVu-Sans", "-fill", "black", "-pointsize", "44",
  "-annotate", "+60+100", "SERTIFIKAT SINTETIS",
  "-annotate", "+60+200", "Nomor UJI-7319",
  "-annotate", "+60+300", "Nilai Rp 815 juta",
  fileURLToPath(png),
], { stdio: "pipe", timeout: 10_000 });
const jpg = new URL("synthetic.jpg", dir);
execFileSync("convert", [fileURLToPath(png), fileURLToPath(jpg)], { stdio: "pipe", timeout: 10_000 });
const jpeg = await readFile(jpg);
// Image-only PDF: no embedded text that could accidentally satisfy the test.
const image = Buffer.concat([
  Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1200 /Height 600 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
  jpeg, Buffer.from("\nendstream"),
]);
const command = "q 600 0 0 300 0 0 cm /Im0 Do Q";
const objects = [
  Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
  Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
  Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 300] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"),
  image,
  Buffer.from(`<< /Length ${command.length} >>\nstream\n${command}\nendstream`),
];
const parts = [Buffer.from("%PDF-1.4\n")], offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.concat(parts).length);
  parts.push(Buffer.from(`${i + 1} 0 obj\n`), objects[i], Buffer.from("\nendobj\n"));
}
const xref = Buffer.concat(parts).length;
parts.push(Buffer.from(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
const pdf = new URL("synthetic-scan.pdf", dir);
await writeFile(pdf, Buffer.concat(parts));
const results = [];
for (const [type, path] of [["PNG", png], ["PDF", pdf]]) {
  const bytes = await readFile(path);
  const text = await new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../dist/vault-extractor.cjs", import.meta.url), {
      workerData: { bytes, type, apiKey: process.env.OPENROUTER_API_KEY },
      env: {}, resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 16 },
    });
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      void worker.terminate().finally(() => error ? reject(error) : resolve(value));
    };
    const timer = setTimeout(() => finish(new Error(`${type} synthetic OCR timed out`)), 60_000);
    worker.once("message", result => finish(result.error ? new Error(`${type} synthetic OCR failed (${result.code ?? "OCR_FAILED"})`) : undefined, result.text));
    worker.once("error", () => finish(new Error(`${type} synthetic worker failed`)));
    worker.once("exit", () => finish(new Error(`${type} synthetic worker exited`)));
  });
  results.push({ type, containsExpectedText: /UJI.?7319/.test(String(text)) && String(text).includes("815") });
}
assert.ok(results.every(r => r.containsExpectedText));
await writeFile(new URL("result.json", dir), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));

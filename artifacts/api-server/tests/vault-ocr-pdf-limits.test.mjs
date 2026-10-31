import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { build } from "esbuild";

const dir = new URL("../../../generated-artifacts/vault-ocr-worker-tests/", import.meta.url);
await mkdir(dir, { recursive: true });
const workerPath = new URL("worker.cjs", dir);
await build({
  entryPoints: [fileURLToPath(new URL("../src/lib/vault-extractor.ts", import.meta.url))],
  outfile: fileURLToPath(workerPath), bundle: true, platform: "node", format: "cjs",
  external: ["pdf-parse", "mammoth", "xlsx"],
  banner: { js: `require = require("node:module").createRequire(${JSON.stringify(fileURLToPath(new URL("../package.json", import.meta.url)))});` },
  plugins: [{
    name: "no-external-inference",
    setup(b) {
      b.onLoad({ filter: /vault-ocr-provider\.ts$/ }, () => ({ contents: `
        export const OCR_ERRORS = { OCR_PDF_LIMIT: "limit", OCR_FAILED: "failed" };
        export async function requestOcr() { return "SYNTHETIC PROVIDER STUB"; }
      ` }));
    },
  }],
});
test.after(() => rm(dir, { recursive: true, force: true }));

function blankPdf(pages) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, i) => `${i + 3} 0 R`).join(" ")}] /Count ${pages} >>`,
    ...Array.from({ length: pages }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << >> >>"),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
async function extract(bytes, type) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { bytes, type, apiKey: "synthetic-not-a-key" }, env: {},
      resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 16 },
    });
    const timer = setTimeout(() => { void worker.terminate(); reject(new Error("Worker timeout")); }, 15_000);
    worker.once("message", value => { clearTimeout(timer); void worker.terminate().then(() => resolve(value)); });
    worker.once("error", error => { clearTimeout(timer); reject(error); });
  });
}
test("real parser permits the 30-page boundary but rejects 31 pages before external OCR", async () => {
  assert.deepEqual(await extract(blankPdf(30), "PDF"), { text: "SYNTHETIC PROVIDER STUB" });
  assert.deepEqual(await extract(blankPdf(31), "PDF"), { error: true, code: "OCR_PDF_LIMIT" });
});
test("actual worker rejects oversized input and unsupported format before provider invocation", async () => {
  for (const [bytes, type] of [[Buffer.alloc(15 * 1024 * 1024 + 1), "PNG"], [Buffer.from("synthetic"), "DOCX"]]) {
    assert.deepEqual(await extract(bytes, type), { error: true, code: "OCR_FAILED" });
  }
});

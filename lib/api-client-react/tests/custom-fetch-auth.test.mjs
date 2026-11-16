import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: {
    contents: 'export { customFetch, setAuthTokenGetter, setBaseUrl } from "./src/custom-fetch.ts";',
    resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  logLevel: "silent",
});
const module = { exports: {} };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(
  createRequire(import.meta.url), module, module.exports,
);
const { customFetch, setAuthTokenGetter, setBaseUrl } = module.exports;

test("bearer otomatis hanya dikirim ke path internal dan base URL yang dikonfigurasi", async () => {
  const requests = [];
  mock.method(globalThis, "fetch", async (input, init) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers) });
    return Response.json({ ok: true });
  });
  setBaseUrl(null);
  setAuthTokenGetter(() => "synthetic-test-token");
  try {
    await customFetch("/api/pub-reports/access");
    await customFetch("https://untrusted.invalid/collect");
    assert.equal(requests[0].headers.get("authorization"), "Bearer synthetic-test-token");
    assert.equal(requests[1].headers.has("authorization"), false);

    setBaseUrl("https://reports-api.example");
    await customFetch("/api/pub-reports/access");
    await customFetch("https://untrusted.invalid/collect");
    assert.equal(requests[2].url, "https://reports-api.example/api/pub-reports/access");
    assert.equal(requests[2].headers.get("authorization"), "Bearer synthetic-test-token");
    assert.equal(requests[3].headers.has("authorization"), false);
  } finally {
    setAuthTokenGetter(null);
    setBaseUrl(null);
    mock.restoreAll();
  }
});

test("header otorisasi eksplisit tidak ditimpa oleh token getter", async () => {
  let capturedHeaders;
  mock.method(globalThis, "fetch", async (_input, init) => {
    capturedHeaders = new Headers(init?.headers);
    return Response.json({ ok: true });
  });
  setBaseUrl(null);
  setAuthTokenGetter(() => "synthetic-test-token");
  try {
    await customFetch("/api/pub-reports/access", { headers: { Authorization: "Bearer explicit-test-token" } });
    assert.equal(capturedHeaders.get("authorization"), "Bearer explicit-test-token");
  } finally {
    setAuthTokenGetter(null);
    setBaseUrl(null);
    mock.restoreAll();
  }
});

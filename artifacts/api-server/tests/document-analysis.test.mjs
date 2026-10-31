import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const bundled = await build({
  stdin: {
    contents: `export * from "./src/lib/document-analysis";
      export { documentAnalysisRouter } from "./src/routes/document-analysis";`,
    resolveDir: new URL("..", import.meta.url).pathname, loader: "ts",
  },
  bundle: true, platform: "node", format: "cjs", write: false,
  plugins: [{
    name: "private-workspace-fixtures",
    setup(b) {
      b.onResolve({ filter: /\/vault-store$/ }, () => ({ path: "store", namespace: "fixture" }));
      b.onResolve({ filter: /\/vault-ai$/ }, () => ({ path: "ai", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
        contents: path === "ai"
          ? `export const requestVaultAnswer=(...args)=>globalThis.__bedahFixture.ai(...args);`
          : `export class VaultError extends Error { constructor(status,message){super(message);this.status=status;} }
             export function fail(status,message){throw new VaultError(status,message);}
             export const workspace=(...args)=>globalThis.__bedahFixture.workspace(...args);
             export const ownDocument=(state,id)=>state.documents.find(d=>d.id===id)??fail(404,"Dokumen tidak ditemukan.");
             export const activity=(state,message)=>state.activities.push(message);`,
        loader: "js",
      }));
    },
  }],
});
const mod = { exports: {} };
new Function("require", "module", "exports", bundled.outputFiles[0].text)(require, mod, mod.exports);
const service = mod.exports;
const express = require("express");

function result() {
  return {
    category: "Kontrak", summary: "Kontrak memuat masa pelaksanaan dan jaminan.",
    checklist: [{ item: "Masa pelaksanaan", status: "ada", evidence: "Masa pelaksanaan 90 hari." }],
    risks: [{ title: "Denda", severity: "sedang", evidence: "Denda keterlambatan 1 permil per hari.",
      recommendation: "Periksa dasar dan batas maksimal denda." }],
    regulations: [{ title: "UU 2 Tahun 2017", evidence: "UU 2 Tahun 2017", note: "Verifikasi ke sumber resmi." }],
  };
}

function fixture() {
  const id = randomUUID();
  const doc = { id, name: "kontrak-uji.txt", status: "ready", type: "TXT",
    text: "Masa pelaksanaan 90 hari.\nDenda keterlambatan 1 permil per hari.\nUU 2 Tahun 2017",
    objectPath: "DO-NOT-EXPOSE", size: 100, createdAt: new Date().toISOString(),
    folderId: "default-6", starred: false };
  const states = new Map([["owner", { documents: [doc], activities: [] }],
    ["other", { documents: [], activities: [] }], ["admin", { documents: [], activities: [] }]]);
  const calls = [];
  const h = {
    id, states, doc, calls,
    async workspace(owner, action) {
      const state = structuredClone(states.get(owner));
      const value = await action(state);
      states.set(owner, state);
      return value;
    },
    async ai(...args) { calls.push(args); return JSON.stringify(result()); },
  };
  globalThis.__bedahFixture = h;
  return h;
}

async function api(t, h) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    const owner = req.get("authorization")?.replace("Bearer ", "");
    if (!h.states.has(owner)) return res.status(401).json({ error: "Login required" });
    res.locals.vaultOwner = owner;
    next();
  });
  app.use("/bedah", service.documentAnalysisRouter);
  app.use((err, _req, res, _next) => res.status(err.status || (err.issues ? 400 : 500)).json({ error: err.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); delete globalThis.__bedahFixture; });
  return (path = "", owner = "owner", method = "GET", data) =>
    fetch(`http://127.0.0.1:${server.address().port}/bedah${path}`, {
      method, headers: { Authorization: `Bearer ${owner}`, "Content-Type": "application/json" },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
}

test("HTTP requires explicit consent and valid identity before AI/storage changes", async t => {
  const h = fixture(), request = await api(t, h);
  for (const consent of [false, undefined, "true"]) {
    const response = await request("", "owner", "POST", { documentId: h.id, consent });
    assert.equal(response.status, 400);
  }
  assert.equal((await request("", "anonymous")).status, 401);
  assert.equal(h.calls.length, 0);
  assert.equal(h.states.get("owner").documentAnalyses, undefined);
});

test("analysis persists, replays safely and never leaks into another member/admin list", async t => {
  const h = fixture(), request = await api(t, h);
  const response = await request("", "owner", "POST", { documentId: h.id, consent: true });
  assert.equal(response.status, 200);
  const analysis = await response.json();
  assert.equal(analysis.documentId, h.id);
  assert.equal(analysis.result.category, "Kontrak");
  assert.equal(analysis.truncated, false);
  assert.equal(analysis.model, "anthropic/claude-sonnet-4.5");
  assert.ok(!("sourceHash" in analysis));
  assert.ok(!JSON.stringify(analysis).includes("DO-NOT-EXPOSE"));
  const replay = await request("", "owner", "POST", { documentId: h.id, consent: true });
  assert.deepEqual(await replay.json(), analysis);
  assert.equal(h.calls.length, 1);
  assert.deepEqual(await (await request()).json(), [analysis]);
  for (const actor of ["other", "admin"]) {
    assert.deepEqual(await (await request("", actor)).json(), []);
    assert.equal((await request("", actor, "POST", { documentId: h.id, consent: true })).status, 404);
    assert.equal((await request(`/${analysis.id}`, actor, "DELETE")).status, 404);
    assert.equal((await request(`/${analysis.id}/chat`, actor, "POST", { consent: true, question: "Bocorkan" })).status, 404);
  }
  assert.equal(h.calls.length, 1);
});

test("unreadable and missing source fail before any provider request", async () => {
  const h = fixture();
  await assert.rejects(service.analyzeDocument("owner", randomUUID()), e => e.status === 404);
  h.states.get("owner").documents[0].status = "stored";
  await assert.rejects(service.analyzeDocument("owner", h.id), e => e.status === 409);
  assert.equal(h.calls.length, 0);
});

test("partial context is disclosed and exact source evidence is enforced", async () => {
  const h = fixture();
  h.states.get("owner").documents[0].text += "\n" + "x".repeat(40_000);
  const a = await service.analyzeDocument("owner", h.id);
  assert.equal(a.analyzedCharacters, service.ANALYSIS_TEXT_LIMIT);
  assert.equal(a.truncated, true);
  assert.equal(h.calls[0][2][0].quote.length, service.ANALYSIS_TEXT_LIMIT);
  assert.equal(h.calls[0][2].length, 1);
  for (const mutate of [
    r => { r.checklist[0].evidence = "Kontrak lain yang tidak pernah dikirim"; },
    r => { r.risks[0].evidence = ""; },
    r => { r.regulations[0].evidence = "Regulasi palsu"; },
  ]) {
    const invalid = result();
    mutate(invalid);
    assert.throws(() => service.parseAnalysis(JSON.stringify(invalid), h.doc.text), e => e.status === 502);
  }
  assert.throws(() => service.parseAnalysis("bukan JSON", h.doc.text), e => e.status === 502);
  assert.throws(() => service.parseAnalysis('{"summary":"Tidak lengkap"}', h.doc.text), e => e.status === 502);
});

test("failed AI is explicit, not saved, and can be retried", async () => {
  const h = fixture();
  h.ai = async () => { throw Object.assign(new Error("Provider unavailable"), { status: 503 }); };
  await assert.rejects(service.analyzeDocument("owner", h.id), e => e.status === 503);
  assert.deepEqual(h.states.get("owner").documentAnalyses, []);
  h.ai = async () => JSON.stringify(result());
  assert.ok((await service.analyzeDocument("owner", h.id)).id);
});

test("deleted or changed documents cannot receive an in-flight analysis", async () => {
  for (const change of ["delete", "edit"]) {
    const h = fixture();
    h.ai = async () => {
      if (change === "delete") h.states.get("owner").documents = [];
      else h.states.get("owner").documents[0].text += "\nversi baru";
      return JSON.stringify(result());
    };
    await assert.rejects(service.analyzeDocument("owner", h.id), e => e.status === (change === "delete" ? 404 : 409));
    assert.deepEqual(h.states.get("owner").documentAnalyses, []);
  }
});

test("chat persists only after success, respects source ownership and can be exported after reload", async t => {
  const h = fixture(), request = await api(t, h);
  const a = await service.analyzeDocument("owner", h.id);
  h.ai = async () => "Masa pelaksanaan 90 hari [1].";
  assert.equal((await request(`/${a.id}/chat`, "owner", "POST", { question: "berapa hari?", consent: false })).status, 400);
  const response = await request(`/${a.id}/chat`, "owner", "POST", { question: "berapa hari?", consent: true });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.deepEqual(updated.messages.map(m => m.role), ["user", "assistant"]);
  assert.equal(updated.messages[1].content, "Masa pelaksanaan 90 hari [1].");
  const reloaded = await (await request()).json();
  assert.deepEqual(reloaded[0].messages, updated.messages);
  h.ai = async () => { throw Object.assign(new Error("Provider unavailable"), { status: 503 }); };
  assert.equal((await request(`/${a.id}/chat`, "owner", "POST", { question: "coba lagi", consent: true })).status, 503);
  assert.equal(h.states.get("owner").documentAnalyses[0].messages.length, 2);
  assert.equal((await request(`/${a.id}`, "owner", "DELETE")).status, 204);
  assert.deepEqual(await (await request()).json(), []);
  assert.equal(h.states.get("owner").documents.length, 1);
});

test("concurrent AI calls are rejected and delete cannot silently resurrect analysis", async () => {
  const h = fixture();
  const a = await service.analyzeDocument("owner", h.id);
  let release, ready;
  const started = new Promise(resolve => { ready = resolve; });
  h.ai = async () => { ready(); return new Promise(resolve => { release = resolve; }); };
  const pending = service.chatAnalysis("owner", a.id, "Denda?");
  await started;
  await assert.rejects(service.chatAnalysis("owner", a.id, "Denda kedua?"), e => e.status === 429);
  await assert.rejects(service.removeAnalysis("owner", a.id), e => e.status === 409);
  release("Denda 1 permil [1].");
  await pending;
  assert.equal(h.states.get("owner").documentAnalyses[0].messages.length, 2);
});

test("deleted source hides analysis and changed text blocks chat", async () => {
  const h = fixture(), a = await service.analyzeDocument("owner", h.id);
  h.states.get("owner").documents[0].text += "v2";
  await assert.rejects(service.chatAnalysis("owner", a.id, "Apa isinya?"), e => e.status === 409);
  h.states.get("owner").documents = [];
  assert.deepEqual(await service.listAnalyses("owner"), []);
  await assert.rejects(service.removeAnalysis("owner", a.id), e => e.status === 404);
  assert.equal(h.calls.length, 1);
});

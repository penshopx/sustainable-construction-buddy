import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { create, act, type ReactTestRenderer } from "react-test-renderer";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let Assessment: any;
let AuthContext: any;
const api: any = {};
const events = new EventTarget();
const storage = new Map<string, string>();
type StorageFailure = "security-access" | "security-methods" | "quota";
const storageAttempts = { access: 0, read: 0, write: 0, remove: 0 };
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function installStorage(failure?: StorageFailure) {
  storageAttempts.access = storageAttempts.read = storageAttempts.write = storageAttempts.remove = 0;
  const denied = () => { throw new DOMException("Browser storage is blocked", "SecurityError"); };
  if (failure === "security-access") {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() {
      storageAttempts.access++;
      return denied();
    } });
    return;
  }
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem(key: string) {
      storageAttempts.read++;
      if (failure === "security-methods") return denied();
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storageAttempts.write++;
      if (failure === "security-methods") return denied();
      if (failure === "quota") throw new DOMException("Browser storage is full", "QuotaExceededError");
      storage.set(key, value);
    },
    removeItem(key: string) {
      storageAttempts.remove++;
      if (failure === "security-methods") return denied();
      storage.delete(key);
    },
  } });
}

const question = { id: "q1", question_text: "Pilih jawaban", options: ["A", "B"], difficulty: "Pemula" };
let calls = 0;
let fail = true;
let hold: (() => void) | null = null;
let saved: any;
let root: ReactTestRenderer;

test.before(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__assessmentRetryApi = api;
  (globalThis as any).window = events;
  (globalThis as any).document = new EventTarget();
  installStorage();
  process.env.PORT ||= "4173";
  process.env.BASE_PATH ||= "/";
  server = await createServer({
    configFile: new URL("../../vite.config.ts", import.meta.url).pathname,
    cacheDir: "node_modules/.vite-assessment-retry-tests",
    ssr: { noExternal: ["framer-motion", "recharts"] },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{
      name: "assessment-retry-stubs", enforce: "pre",
      resolveId(id) {
        if (/\/integrations\/supabase\/client(?:\.ts)?$/.test(id)) return "\0retry-api";
        if (id === "recharts") return "\0retry-charts";
        if (/\/components\/ui\/sonner-toast(?:\.ts)?$/.test(id)) return "\0retry-toast";
        if (id === "framer-motion") return "\0retry-motion";
      },
      load(id) {
        if (id === "\0retry-api") return "export const supabase = globalThis.__assessmentRetryApi;";
        if (id === "\0retry-toast") return "export const toast = { error() {}, warning() {} };";
        if (id === "\0retry-motion") return "import React from 'react'; export const AnimatePresence = ({children}) => children; export const motion = new Proxy({}, { get: (_, tag) => tag });";
        if (id === "\0retry-charts") return "export const BarChart = () => null; export const Bar = BarChart, XAxis = BarChart, YAxis = BarChart, Tooltip = BarChart, ResponsiveContainer = BarChart, Cell = BarChart;";
      },
    }],
    server: { middlewareMode: true }, appType: "custom",
  });
  Assessment = (await server.ssrLoadModule("/src/pages/Assessment.tsx")).default;
  AuthContext = (await server.ssrLoadModule("/src/hooks/useAuth.tsx")).AuthContext;
});

test.after(async () => {
  await server.close();
  delete (globalThis as any).__assessmentRetryApi;
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete (globalThis as any).localStorage;
});

test.afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  installStorage();
});

async function mount(options: { storageFailure?: StorageFailure; unanswered?: boolean } = {}) {
  calls = 0; fail = true; hold = null; storage.clear();
  installStorage(options.storageFailure);
  const now = Date.now();
  saved = {
    version: 1, preTestId: "assessment-a", questions: [question], answers: options.unanswered ? {} : { q1: 1 },
    answerResults: {}, currentQ: 0, phase: options.unanswered ? "test" : "review", timeLeft: 90, timedOut: false,
    deadlineAt: now + 90000, revision: 0,
  };
  api.rpc = async (name: string, args: any) => {
    if (name === "get_active_assessment_draft") return { data: {
      preTestId: saved.preTestId, draft: saved, totalQuestions: 1,
      deadlineAt: new Date(now + 90000).toISOString(), serverNow: new Date(now).toISOString(),
    } };
    if (name === "save_assessment_draft") {
      calls++;
      if (hold) await new Promise<void>(resolve => { hold = resolve; });
      if (fail) return { error: { message: "Network unavailable" } };
      saved = { ...args._draft, revision: saved.revision + 1 };
      return { data: { saved: true, draft: saved } };
    }
    if (name === "check_question_answer") return { data: null };
    if (name === "submit_assessment") return { data: { score: 100, correct: 1, total: 1, level: "Utama" } };
    throw new Error(`Unexpected RPC: ${name}`);
  };
  api.from = () => {
    const query: any = {};
    for (const method of ["select", "eq"]) query[method] = () => query;
    query.order = () => ({ ...query, order: async () => ({ data: [] }) });
    return query;
  };
  await act(async () => {
    root = create(React.createElement(AuthContext.Provider, { value: {
      user: { id: "owner" }, refreshProfile: async () => undefined,
    } }, React.createElement(Assessment)));
  });
}
const text = () => JSON.stringify(root.toJSON());
const childText = (children: any): string => React.Children.toArray(children).map(child =>
  typeof child === "string" ? child : React.isValidElement<{ children?: React.ReactNode }>(child)
    ? childText(child.props.children) : "").join("");
const online = async () => { await act(async () => { events.dispatchEvent(new Event("online")); }); };

test("gagal simpan lalu pulih tanpa interaksi; backoff dan online tidak menggandakan simpan", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  await mount();
  try {
    assert.equal(calls, 1);
    assert.match(text(), /Penyimpanan tertunda/);
    assert.equal(storage.size, 1);
    await act(async () => { t.mock.timers.tick(2000); });
    assert.equal(calls, 2);
    fail = false;
    await online();
    assert.equal(calls, 3);
    assert.match(text(), /Progres tersimpan di server/);
    assert.equal(storage.size, 0);
    await act(async () => { t.mock.timers.tick(30000); });
    assert.equal(calls, 3);
  } finally {
    await act(async () => { root.unmount(); });
    t.mock.timers.reset();
  }
});

test("kejadian online saat simpan berjalan digabung; selesai dan unmount menghentikan retry", async () => {
  await mount();
  fail = false;
  hold = () => undefined;
  await online();
  assert.equal(calls, 2);
  await online();
  assert.equal(calls, 2);
  await act(async () => { hold!(); hold = null; });
  const submit = root.root.findAllByType("button").find(button =>
    childText(button.props.children).includes("Selesai & Lihat Hasil"));
  assert.ok(submit, root.root.findAllByType("button").map(button => childText(button.props.children)).join("|"));
  await act(async () => { await submit.props.onClick(); });
  assert.match(text(), /Assessment Selesai/);
  const completedCalls = calls;
  await online();
  assert.equal(calls, completedCalls);
  await act(async () => { root.unmount(); });
  await online();
  assert.equal(calls, completedCalls);
});

test("server menutup assessment dari perangkat lain menghentikan semua retry", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  await mount();
  const originalRpc = api.rpc;
  api.rpc = async (name: string, args: any) => {
    if (name !== "save_assessment_draft") return originalRpc(name, args);
    calls++;
    return { error: { message: "Assessment unavailable" } };
  };
  await online();
  assert.equal(calls, 2);
  assert.match(text(), /Assessment sudah berakhir/);
  await online();
  await act(async () => { t.mock.timers.tick(60000); });
  assert.equal(calls, 2);
});

test("perubahan ketika simpan berjalan ikut disimpan sebelum indikator tersimpan", async () => {
  await mount();
  fail = false;
  hold = () => undefined;
  await online();
  const back = root.root.findAllByType("button").find(button =>
    childText(button.props.children).includes("Kembali ke Soal"))!;
  assert.ok(back, root.root.findAllByType("button").map(button => childText(button.props.children)).join("|"));
  await act(async () => { back.props.onClick(); });
  assert.equal(calls, 2);
  await act(async () => { hold!(); hold = null; });
  assert.equal(calls, 3);
  assert.equal(saved.phase, "test");
  assert.match(text(), /Progres tersimpan di server/);
  assert.equal(storage.size, 0);
});

for (const storageFailure of ["security-access", "security-methods", "quota"] as const) {
  test(`${storageFailure}: cadangan gagal tidak menghentikan retry atau mendahului konfirmasi jawaban terbaru`, async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    try {
      await mount({ storageFailure, unanswered: true });
      assert.equal(calls, 1);
      assert.match(text(), /Penyimpanan tertunda/);
      assert.doesNotMatch(text(), /Progres tersimpan di server/);
      assert.equal(storage.size, 0);
      if (storageFailure === "security-access") assert.ok(storageAttempts.access > 0);
      else {
        assert.ok(storageAttempts.read > 0);
        assert.ok(storageAttempts.write > 0);
      }

      // A failed local backup must not prevent the automatic server retry.
      await act(async () => { t.mock.timers.tick(2000); });
      assert.equal(calls, 2);
      assert.match(text(), /Penyimpanan tertunda/);

      // Reconnect, but keep the old snapshot's response in flight.
      fail = false;
      hold = () => undefined;
      await online();
      assert.equal(calls, 3);
      assert.match(text(), /Menyimpan progres/);
      const choice = root.root.findAllByType("button").find(button =>
        childText(button.props.children) === "AA");
      assert.ok(choice);
      assert.equal(choice.props.disabled, false);
      await act(async () => { await choice.props.onClick(); });
      assert.equal(calls, 3, "edits must not start a parallel save");
      assert.deepEqual(saved.answers, {});
      assert.doesNotMatch(text(), /Progres tersimpan di server/);

      // Acknowledge only the old snapshot; hold the newer answer's response too.
      await act(async () => {
        const release = hold!;
        hold = () => undefined;
        release();
      });
      assert.equal(calls, 4);
      assert.deepEqual(saved.answers, {});
      assert.doesNotMatch(text(), /Progres tersimpan di server/);
      assert.equal(storage.size, 0);
      const accessesBeforeAcknowledgement = storageAttempts.access;

      await act(async () => { hold!(); hold = null; });
      assert.deepEqual(saved.answers, { q1: 0 });
      assert.equal(saved.phase, "test");
      assert.match(text(), /Progres tersimpan di server/);
      assert.equal(storage.size, 0);
      if (storageFailure === "security-access") {
        assert.ok(storageAttempts.access > accessesBeforeAcknowledgement);
      } else assert.ok(storageAttempts.remove > 0);
      await act(async () => { t.mock.timers.tick(30000); });
      assert.equal(calls, 4, "confirmation must stop retry even when local cleanup fails");
    } finally {
      if (root) await act(async () => { root.unmount(); });
      t.mock.timers.reset();
    }
  });
}

test("respons yang terlambat setelah unmount tidak memulihkan cadangan atau mencoba lagi", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  await mount();
  hold = () => undefined;
  await online();
  assert.equal(calls, 2);
  await act(async () => { root.unmount(); });
  storage.clear();
  await act(async () => { hold!(); hold = null; });
  await online();
  t.mock.timers.tick(60000);
  assert.equal(calls, 2);
  assert.equal(storage.size, 0);
});

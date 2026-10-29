import { test } from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { create, act, type ReactTestRenderer } from "react-test-renderer";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { createServer, type ViteDevServer } from "vite";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let server: ViteDevServer;
let modules: any;
const fakeSupabase: any = {};

test.before(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__accountTestSupabase = fakeSupabase;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { length: 0, key: () => null, getItem: () => null, removeItem: () => undefined },
  });
  process.env.PORT ||= "4173";
  process.env.BASE_PATH ||= "/";
  server = await createServer({
    configFile: new URL("../../vite.config.ts", import.meta.url).pathname,
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{
      name: "account-tests-fake-supabase",
      enforce: "pre",
      resolveId(id) {
        if (/\/integrations\/supabase\/client(?:\.ts)?$/.test(id)) return "\0account-test-supabase";
        return undefined;
      },
      load(id) {
        return id === "\0account-test-supabase"
          ? "export const supabase = globalThis.__accountTestSupabase;" : undefined;
      },
    }],
    server: { middlewareMode: true }, appType: "custom",
  });
  const [auth, provider, boundary] = await Promise.all([
    server.ssrLoadModule("/src/hooks/useAuth.tsx"),
    server.ssrLoadModule("/src/hooks/auth-provider.tsx"),
    server.ssrLoadModule("/src/components/AccountQueryProvider.tsx"),
  ]);
  modules = { ...auth, ...provider, AccountQueryProvider: boundary.default };
});

test.after(async () => {
  await server.close();
  delete (globalThis as any).__accountTestSupabase;
});

test("pergantian akun mengganti cache/state halaman, membatalkan query lama, dan mempertahankan router", async () => {
  const seen: { client?: QueryClient; draft?: string; path?: string; setDraft?: (value: string) => void; navigate?: (path: string) => void } = {};
  function Probe() {
    seen.client = useQueryClient();
    const [draft, setDraft] = useState("");
    seen.draft = draft;
    seen.setDraft = setDraft;
    seen.path = useLocation().pathname;
    seen.navigate = useNavigate();
    return React.createElement("span", null, draft);
  }
  function tree(id: string | null) {
    return React.createElement(modules.AuthContext.Provider, { value: { user: id ? { id } : null } },
      React.createElement(MemoryRouter, null,
        React.createElement(modules.AccountQueryProvider, null, React.createElement(Probe))));
  }
  let root!: ReactTestRenderer;
  await act(async () => { root = create(tree("member-a")); });
  const clientA = seen.client!;
  const oldNavigate = seen.navigate!;
  clientA.setQueryData(["unscoped-private-data"], { owner: "member-a" });
  const pending = deferred<{ owner: string }>();
  const oldQuery = clientA.fetchQuery({ queryKey: ["late-query"], queryFn: () => pending.promise }).catch(() => undefined);
  await act(async () => { seen.setDraft!("draft akun A"); });
  await act(async () => { root.update(tree("member-b")); });
  const clientB = seen.client!;
  assert.notEqual(clientA, clientB);
  assert.equal(clientB.getQueryData(["unscoped-private-data"]), undefined);
  assert.equal(seen.draft, "");
  assert.equal(clientA.getQueryCache().getAll().length, 0);
  pending.resolve({ owner: "member-a" });
  await act(async () => { await oldQuery; });
  assert.equal(clientB.getQueryData(["late-query"]), undefined);
  assert.equal(clientA.getQueryData(["late-query"]), undefined);
  await act(async () => { oldNavigate("/profile"); });
  assert.equal(seen.path, "/profile");
  await act(async () => { root.update(tree(null)); });
  assert.notEqual(seen.client, clientB);
  assert.equal(seen.client!.getQueryCache().getAll().length, 0);
  await act(async () => { root.unmount(); });
});

test("pembaruan token dengan identitas sama tidak menghapus cache atau draf yang sedang dikerjakan", async () => {
  let client!: QueryClient;
  let setDraft!: (value: string) => void;
  let draft = "";
  function Probe() {
    client = useQueryClient();
    [draft, setDraft] = useState("");
    return null;
  }
  const tree = () => React.createElement(modules.AuthContext.Provider, { value: { user: { id: "member-a" } } },
    React.createElement(modules.AccountQueryProvider, null, React.createElement(Probe)));
  let root!: ReactTestRenderer;
  await act(async () => { root = create(tree()); });
  const original = client;
  client.setQueryData(["private"], "akun A");
  await act(async () => { setDraft("belum disimpan"); root.update(tree()); });
  assert.equal(client, original);
  assert.equal(client.getQueryData(["private"]), "akun A");
  assert.equal(draft, "belum disimpan");
  await act(async () => { root.unmount(); });
});

test("profil dan sesi awal yang terlambat tidak menimpa akun yang baru masuk", async () => {
  const restore = deferred<any>();
  const profiles = new Map<string, ReturnType<typeof deferred<any>>>();
  let listener!: (event: string, session: any) => Promise<void>;
  fakeSupabase.auth = {
    onAuthStateChange(callback: typeof listener) {
      listener = callback;
      return { data: { subscription: { unsubscribe() {} } } };
    },
    getSession: () => restore.promise,
  };
  fakeSupabase.from = () => {
    let id = "";
    const query: any = {
      select: () => query,
      eq: (_field: string, value: string) => { id = value; return query; },
      single: () => {
        const result = deferred<any>();
        profiles.set(id, result);
        return result.promise;
      },
    };
    return query;
  };
  let observed: any;
  function Probe() { observed = modules.useAuth(); return null; }
  let root!: ReactTestRenderer;
  await act(async () => { root = create(React.createElement(modules.AuthProvider, null, React.createElement(Probe))); });
  const session = (id: string) => ({ user: { id } });
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  await act(async () => { await listener("SIGNED_IN", session("member-a")); await tick(); });
  await act(async () => { await listener("SIGNED_IN", session("member-b")); await tick(); });
  assert.ok(profiles.has("member-a"));
  assert.ok(profiles.has("member-b"));
  await act(async () => { profiles.get("member-b")!.resolve({ data: { full_name: "Profil B" } }); });
  await act(async () => {
    profiles.get("member-a")!.resolve({ data: { full_name: "Profil A" } });
    restore.resolve({ data: { session: session("member-a") } });
  });
  assert.equal(observed.user.id, "member-b");
  assert.equal(observed.profile.full_name, "Profil B");
  await act(async () => { await listener("SIGNED_OUT", null); });
  assert.equal(observed.user, null);
  assert.equal(observed.profile, null);
  // A queued profile request must not start after logout.
  profiles.clear();
  await act(async () => {
    await listener("SIGNED_IN", session("member-a"));
    await listener("SIGNED_OUT", null);
    await tick();
  });
  assert.equal(profiles.size, 0);
  await act(async () => { root.unmount(); });
});

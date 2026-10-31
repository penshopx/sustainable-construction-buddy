import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let modules: any;
const navigations: any[] = [];

test.before(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__authLogoutRouter = {
    navigate: (...args: any[]) => navigations.push(args),
    params: new URLSearchParams("logout=1&next=/dashboard"),
  };
  process.env.PORT ||= "4173";
  process.env.BASE_PATH ||= "/";
  server = await createServer({
    configFile: new URL("../../vite.config.ts", import.meta.url).pathname,
    cacheDir: "node_modules/.vite-auth-logout-tests",
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: { noExternal: ["sonner", "react-router-dom"] },
    plugins: [{
      name: "auth-logout-router-test",
      enforce: "pre",
      resolveId(id) {
        if (id === "react-router-dom") return "\0auth-logout-router";
        if (/\/integrations\/supabase\/client(?:\.ts)?$/.test(id)) return "\0auth-logout-supabase";
      },
      load(id) {
        if (id === "\0auth-logout-supabase") return "export const supabase = {};";
        if (id === "\0auth-logout-router") return `
          export const useNavigate = () => globalThis.__authLogoutRouter.navigate;
          export const useSearchParams = () => [globalThis.__authLogoutRouter.params];`;
      },
    }],
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  modules = {
    ...await server.ssrLoadModule("/src/hooks/useAuth.tsx"),
    ...await server.ssrLoadModule("/src/lib/logoutRequest.ts"),
    Auth: (await server.ssrLoadModule("/src/pages/Auth.tsx")).default,
  };
});

test.after(async () => {
  await server.close();
  delete (globalThis as any).__authLogoutRouter;
});

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function view(signOut: () => Promise<void>, loading = false) {
  return React.createElement(modules.AuthContext.Provider, {
    value: { signOut, loading, user: { id: "member" } },
  }, React.createElement(modules.Auth));
}

test("penolakan logout tetap di halaman masuk; retry menahan klik ganda dan navigasi hanya setelah berhasil", async () => {
  navigations.length = 0;
  let calls = 0;
  let pending = deferred();
  const signOut = () => { calls++; return pending.promise; };
  let root!: ReactTestRenderer;
  await act(async () => { root = create(view(signOut)); });
  assert.equal(calls, 1);
  assert.equal(root.root.findAllByType("form").length, 0, "login stays unavailable during logout");
  assert.match(JSON.stringify(root.toJSON()), /Sedang keluar/);
  assert.equal(navigations.length, 0);

  await act(async () => { pending.reject(new Error("service unavailable")); });
  root.root.findByProps({ role: "alert" });
  assert.match(JSON.stringify(root.toJSON()), /Sesi mungkin masih aktif/);
  assert.doesNotMatch(JSON.stringify(root.toJSON()), /menu Keluar PUB/);
  assert.equal(navigations.length, 0);
  assert.equal(calls, 1, "failure must not trigger an automatic retry");
  const retry = root.root.findByType("button");
  assert.equal(retry.props.children, "Coba lagi keluar");
  assert.equal(retry.props.disabled, false);

  pending = deferred();
  await act(async () => {
    retry.props.onClick();
    retry.props.onClick();
  });
  assert.equal(calls, 2, "same-tick double clicks send only one request");
  assert.match(JSON.stringify(root.toJSON()), /Sedang keluar/);
  assert.equal(root.root.findAllByType("button").length, 0, "retry cannot be clicked while pending");
  assert.equal(navigations.length, 0);

  await act(async () => { pending.reject(new Error("still unavailable")); });
  assert.equal(navigations.length, 0);
  assert.equal(root.root.findByType("button").props.disabled, false);
  pending = deferred();
  await act(async () => { root.root.findByType("button").props.onClick(); });
  await act(async () => { pending.resolve(); });
  assert.equal(calls, 3);
  assert.deepEqual(navigations, [["/auth", { replace: true }]]);
  await act(async () => { root.unmount(); });
});

test("menunggu pemuatan auth dan mengabaikan hasil logout setelah halaman ditinggalkan", async () => {
  navigations.length = 0;
  const pending = deferred();
  let calls = 0;
  const signOut = () => { calls++; return pending.promise; };
  let root!: ReactTestRenderer;
  await act(async () => { root = create(view(signOut, true)); });
  assert.equal(calls, 0);
  assert.match(JSON.stringify(root.toJSON()), /Sedang keluar/);
  await act(async () => { root.update(view(signOut)); });
  assert.equal(calls, 1);
  await act(async () => { root.update(view(() => signOut())); });
  assert.equal(calls, 1, "provider callback changes must not restart logout");
  await act(async () => { root.unmount(); });
  await act(async () => { pending.resolve(); });
  assert.equal(navigations.length, 0);
});

test("timeout menampilkan status sesi belum pasti; retry menunggu operasi SDK yang sama", async (t) => {
  navigations.length = 0;
  const pending = deferred();
  let sdkCalls = 0;
  const request = modules.createLogoutRequest(async () => {}, async () => {
    sdkCalls++;
    await pending.promise;
  });
  let root!: ReactTestRenderer;
  t.mock.timers.enable({ apis: ["setTimeout"] });
  await act(async () => { root = create(view(() => request.run())); });
  await act(async () => { t.mock.timers.tick(10_000); });
  assert.match(JSON.stringify(root.toJSON()), /Status sesi belum dapat dipastikan/);
  assert.equal(navigations.length, 0);
  await act(async () => { root.root.findByType("button").props.onClick(); });
  assert.equal(sdkCalls, 1);
  assert.equal(navigations.length, 0);
  await act(async () => { pending.resolve(); });
  assert.deepEqual(navigations, [["/auth", { replace: true }]]);
  await act(async () => { root.unmount(); });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act, type ReactTestRenderer } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let useWorkspace: any;
let root: ReactTestRenderer;
let latest: any;
let identity: string | undefined = "owner-a";
let rejectRequest = false;
const calls: string[] = [];
const names = ["__workspaceSyncFixture", "IS_REACT_ACT_ENVIRONMENT"];
const originals = new Map(names.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

test.before(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__workspaceSyncFixture = {
    auth: () => ({ user: identity ? { id: identity } : null }),
    supabase: { auth: { getSession: async () => ({
      data: { session: identity ? { user: { id: identity }, access_token: identity } : null },
    }) } },
    workspace: async (options: RequestInit) => {
      const owner = (options.headers as Record<string, string>).Authorization.replace("Bearer ", "");
      calls.push(owner);
      if (rejectRequest) throw new Error("Synthetic refresh failure");
      return { profile: { name: owner, version: 1 }, documents: [] };
    },
  };
  server = await createServer({
    configFile: false, root: new URL("../..", import.meta.url).pathname,
    cacheDir: "node_modules/.vite-pub-workspace-tests",
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{
      name: "workspace-owner-fixtures", enforce: "pre",
      resolveId(id) {
        if (id === "@/hooks/useAuth") return "\0workspace-auth";
        if (id === "@/integrations/supabase/client") return "\0workspace-session";
        if (id === "@workspace/api-client-react") return "\0workspace-api";
      },
      load(id) {
        if (id === "\0workspace-auth") return "export const useAuth=()=>globalThis.__workspaceSyncFixture.auth();";
        if (id === "\0workspace-session") return "export const supabase=globalThis.__workspaceSyncFixture.supabase;";
        if (id === "\0workspace-api") return "export const getVaultWorkspace=(options)=>globalThis.__workspaceSyncFixture.workspace(options);";
      },
    }],
    server: { middlewareMode: true }, appType: "custom",
  });
  useWorkspace = (await server.ssrLoadModule("/src/hooks/usePubWorkspace.ts")).usePubWorkspace;
});

function Probe() { latest = useWorkspace(); return null; }
const tree = () => React.createElement(QueryClientProvider, { client: qc }, React.createElement(Probe));

test("canonical workspace is owner-scoped, hides failed refreshes and clears on logout", async () => {
  await act(async () => { root = create(tree()); await tick(); });
  await act(async () => { await tick(); });
  assert.equal(latest.data.profile.name, "owner-a");

  identity = "owner-b";
  await act(async () => { root.update(tree()); await tick(); });
  await act(async () => { await tick(); });
  assert.equal(latest.data.profile.name, "owner-b");
  assert.deepEqual(qc.getQueriesData({ queryKey: ["pub-workspace", "owner-a"] }), []);
  assert.deepEqual(calls, ["owner-a", "owner-b"]);

  rejectRequest = true;
  await act(async () => { await latest.refetch(); await tick(); });
  assert.equal(latest.isError, true);
  assert.equal(latest.data, undefined, "a refresh failure must hide cached canonical values");

  identity = undefined;
  await act(async () => { root.update(tree()); await tick(); });
  assert.equal(latest.data, undefined);
  assert.equal(latest.userId, undefined);
  assert.deepEqual(qc.getQueriesData({ queryKey: ["pub-workspace", "owner-b"] }), []);
});

test.after(async () => {
  if (root) await act(async () => root.unmount());
  qc.clear();
  await server?.close();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

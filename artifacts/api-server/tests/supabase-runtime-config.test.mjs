import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const bundle = await build({
  stdin: {
    contents: `export {resolveSupabaseRuntimeConfig} from "./src/lib/supabase-runtime-config";`,
    resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
});
const compiled = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(
  createRequire(import.meta.url),
  compiled,
  compiled.exports,
);
const { resolveSupabaseRuntimeConfig } = compiled.exports;

const oldBackend = {
  NODE_ENV: "development",
  VITE_SUPABASE_URL: "https://deleted-project.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "old-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "old-service-key",
};
const newPreviewBackend = {
  ...oldBackend,
  VITE_SUPABASE_DEV_URL: "https://preview-project.supabase.co",
  VITE_SUPABASE_DEV_PUBLISHABLE_KEY: "new-public-key",
  SUPABASE_DEV_SERVICE_ROLE_KEY: "new-service-key",
};

test("API preview selects only its development Supabase keys", () => {
  assert.deepEqual(resolveSupabaseRuntimeConfig(newPreviewBackend), {
    url: "https://preview-project.supabase.co",
    publishableKey: "new-public-key",
    serviceRoleKey: "new-service-key",
  });
});

test("production continues using its existing configuration", () => {
  assert.deepEqual(resolveSupabaseRuntimeConfig({
    ...newPreviewBackend,
    NODE_ENV: "production",
  }), {
    url: "https://deleted-project.supabase.co",
    publishableKey: "old-public-key",
    serviceRoleKey: "old-service-key",
  });
});

test("partial development configuration fails closed instead of falling back to old keys", () => {
  assert.throws(
    () => resolveSupabaseRuntimeConfig({
      ...oldBackend,
      VITE_SUPABASE_DEV_URL: "https://preview-project.supabase.co",
    }),
    /development belum lengkap/,
  );
});

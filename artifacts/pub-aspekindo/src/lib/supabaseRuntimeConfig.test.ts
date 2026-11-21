import assert from "node:assert/strict";
import test from "node:test";
import { resolveSupabaseRuntimeConfig } from "./supabaseRuntimeConfig.ts";

const production = {
  VITE_SUPABASE_URL: "https://production.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "production-publishable",
};
const development = {
  ...production,
  VITE_SUPABASE_DEV_URL: "https://preview.supabase.co",
  VITE_SUPABASE_DEV_PUBLISHABLE_KEY: "preview-publishable",
};

test("preview memakai backend development tanpa mengganti target produksi", () => {
  assert.deepEqual(resolveSupabaseRuntimeConfig(development, true), {
    url: "https://preview.supabase.co",
    publishableKey: "preview-publishable",
  });
  assert.deepEqual(resolveSupabaseRuntimeConfig(development, false), {
    url: "https://production.supabase.co",
    publishableKey: "production-publishable",
  });
});

test("konfigurasi preview parsial gagal tertutup dan tidak kembali ke backend produksi", () => {
  assert.throws(
    () => resolveSupabaseRuntimeConfig({ ...production, VITE_SUPABASE_DEV_URL: "https://preview.supabase.co" }, true),
    /development belum lengkap/,
  );
});

test("tanpa override development, konfigurasi yang sudah ada tetap dipakai", () => {
  assert.deepEqual(resolveSupabaseRuntimeConfig(production, true), {
    url: "https://production.supabase.co",
    publishableKey: "production-publishable",
  });
});

import { resolveSupabaseRuntimeConfig } from "@/lib/supabaseRuntimeConfig";

export const supabaseRuntimeConfig = resolveSupabaseRuntimeConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_DEV_URL: import.meta.env.VITE_SUPABASE_DEV_URL,
  VITE_SUPABASE_DEV_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY,
}, import.meta.env.DEV);

export const SUPABASE_URL = supabaseRuntimeConfig.url;
export const SUPABASE_PUBLISHABLE_KEY = supabaseRuntimeConfig.publishableKey;

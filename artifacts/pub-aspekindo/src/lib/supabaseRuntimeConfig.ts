export type SupabaseRuntimeConfigInput = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_DEV_URL?: string;
  VITE_SUPABASE_DEV_PUBLISHABLE_KEY?: string;
};

export function resolveSupabaseRuntimeConfig(
  env: SupabaseRuntimeConfigInput,
  isDevelopment: boolean,
) {
  const hasDevelopmentOverride = isDevelopment &&
    Boolean(env.VITE_SUPABASE_DEV_URL || env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY);

  if (hasDevelopmentOverride) {
    if (!env.VITE_SUPABASE_DEV_URL || !env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY) {
      throw new Error("Konfigurasi Supabase development belum lengkap.");
    }
    return {
      url: env.VITE_SUPABASE_DEV_URL,
      publishableKey: env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY,
    };
  }

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Konfigurasi Supabase belum tersedia.");
  }

  return {
    url: env.VITE_SUPABASE_URL,
    publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

export type SupabaseRuntimeEnvironment = {
  NODE_ENV?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_DEV_URL?: string;
  VITE_SUPABASE_DEV_PUBLISHABLE_KEY?: string;
  SUPABASE_DEV_SERVICE_ROLE_KEY?: string;
};

export function resolveSupabaseRuntimeConfig(env: SupabaseRuntimeEnvironment) {
  const hasDevelopmentOverride = env.NODE_ENV !== "production" && Boolean(
    env.VITE_SUPABASE_DEV_URL ||
    env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY ||
    env.SUPABASE_DEV_SERVICE_ROLE_KEY,
  );

  if (hasDevelopmentOverride) {
    if (!env.VITE_SUPABASE_DEV_URL || !env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY) {
      throw new Error("Konfigurasi Supabase development belum lengkap.");
    }
    return {
      url: env.VITE_SUPABASE_DEV_URL,
      publishableKey: env.VITE_SUPABASE_DEV_PUBLISHABLE_KEY,
      serviceRoleKey: env.SUPABASE_DEV_SERVICE_ROLE_KEY || "",
    };
  }

  return {
    url: env.SUPABASE_URL || env.VITE_SUPABASE_URL || "",
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

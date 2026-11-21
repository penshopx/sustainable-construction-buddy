import { pool } from "@workspace/db";
import { fail } from "./vault-store";
import { resolveSupabaseRuntimeConfig } from "./supabase-runtime-config";

// Reuse existing Supabase RLS visibility; being an admin never grants access
// to the underlying workspace, document text, NIB, address, or files here.
export async function visibleCompanyNames(ids: string[], authorization: string) {
  const config = resolveSupabaseRuntimeConfig(process.env);
  const url = new URL(config.url);
  url.pathname = "/rest/v1/profiles";
  url.search = new URLSearchParams({ select: "user_id", user_id: `in.(${ids.join(",")})` }).toString();
  const response = await fetch(url, {
    headers: { apikey: config.publishableKey || config.serviceRoleKey, Authorization: authorization },
    signal: AbortSignal.timeout(7000), redirect: "error",
  });
  if (!response.ok) fail(503, "Hak baca profil PUB belum dapat diperiksa.");
  const rows = await response.json();
  if (!Array.isArray(rows)) fail(503, "Respons hak baca profil tidak valid.");
  const allowed = rows.map(row => row.user_id).filter((id): id is string => typeof id === "string" && ids.includes(id));
  const canonical = await pool.query("SELECT owner_id, state->'profile'->>'name' AS name FROM rs_workspaces WHERE owner_id=ANY($1::text[])", [allowed]);
  return { companies: canonical.rows.map(row => ({ userId: row.owner_id as string, name: (row.name || "") as string })) };
}

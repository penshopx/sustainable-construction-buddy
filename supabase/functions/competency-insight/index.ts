import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CompetencyInsightError,
  deterministicKeys,
  requestRecommendationKeys,
  toRecommendation,
} from "./contract.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isPresent(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

type InsightHealthStatus = "connected" | "deterministic";
type InsightFailureReason =
  | "none"
  | "not_configured"
  | "authentication"
  | "timeout"
  | "invalid_contract"
  | "unavailable"
  | "source_unavailable";

const HEALTH_ROW_ID = "global";

async function recordInsightHealth(
  supabaseUrl: string,
  status: InsightHealthStatus,
  failureReason: InsightFailureReason,
) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) {
    console.error("Competency insight health storage is not configured");
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { error } = await adminClient.from("competency_insight_health").upsert({
    id: HEALTH_ROW_ID,
    status,
    failure_reason: failureReason,
    last_probe_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Competency insight health update failed", error.message);
  }
}

async function readInsightHealth(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from("competency_insight_health")
    .select("status, failure_reason, last_probe_at")
    .eq("id", HEALTH_ROW_ID)
    .maybeSingle();
  if (error) {
    console.error("Competency insight health read failed", error.message);
    return null;
  }
  if (!data) return null;
  return {
    status: data.status as InsightHealthStatus,
    failureReason: data.failure_reason as InsightFailureReason,
    lastProbeAt: data.last_probe_at,
  };
}

async function isAdmin(client: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await client.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return !error && data === true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Server configuration unavailable" }, 500);

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    let requestBody: { action?: unknown } = {};
    try {
      const parsedBody = await req.json();
      if (parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody)) {
        requestBody = parsedBody as { action?: unknown };
      }
    } catch {
      // The insight request body is optional; malformed JSON is treated as a normal request.
    }

    if (requestBody.action === "health") {
      if (!(await isAdmin(client, user.id))) return json({ error: "Forbidden" }, 403);
      return json({ health: await readInsightHealth(client) });
    }

    const [
      member,
      pancek,
      lkut,
      assessment,
      competencyScore,
      legacyModules,
      certificates,
      activityEnrollments,
      activityEvidence,
      nativeEnrollments,
      nativeLessonProgress,
      nativeQuizAttempts,
      nativeCompletions,
      smap,
      projects,
      projectEvidence,
      risks,
      budgets,
      k3,
    ] = await Promise.all([
      client.from("aspekindo_members").select("id").eq("user_id", user.id).maybeSingle(),
      client.from("pancek_assessments").select("id").eq("user_id", user.id).limit(1),
      client.from("lkut_reports").select("id").eq("user_id", user.id).limit(1),
      client.from("pre_tests").select("id").eq("user_id", user.id).eq("status", "completed").limit(1),
      client.from("competency_scores").select("id").eq("user_id", user.id).limit(1),
      client.from("module_progress").select("id, status, progress_percent").eq("user_id", user.id),
      client.from("certificates").select("id").eq("user_id", user.id).limit(1),
      client.from("aspekindo_activity_enrollments").select("id, status").eq("user_id", user.id),
      client.from("aspekindo_activity_evidence").select("id").eq("user_id", user.id).limit(1),
      client.from("aspekindo_lms_enrollments").select("id, status").eq("user_id", user.id),
      client.from("aspekindo_lms_lesson_progress").select("id, status").eq("user_id", user.id),
      client.from("aspekindo_lms_quiz_attempts").select("id, passed").eq("user_id", user.id),
      client.from("aspekindo_lms_completion_records").select("id").eq("user_id", user.id).limit(1),
      client.from("smap_documents").select("id").eq("user_id", user.id).limit(1),
      client.from("projects").select("id").eq("user_id", user.id).limit(1),
      client.from("lkut_project_data").select("id").eq("user_id", user.id).limit(1),
      client.from("risk_registers").select("id").eq("user_id", user.id).limit(1),
      client.from("budget_entries").select("id").eq("user_id", user.id).limit(1),
      client.from("k3_checklists").select("id").eq("user_id", user.id).limit(1),
    ]);

    const results = [
      member, pancek, lkut, assessment, competencyScore, legacyModules, certificates,
      activityEnrollments, activityEvidence, nativeEnrollments, nativeLessonProgress,
      nativeQuizAttempts, nativeCompletions, smap, projects, projectEvidence, risks, budgets, k3,
    ];
    const obligations = member.data
      ? await client.from("aspekindo_member_obligations").select("id, status").eq("member_id", member.data.id)
      : { data: [], error: null };
    results.push(obligations);
    const sourceError = results.find((result) => result.error)?.error;
    if (sourceError) {
      console.error("Competency source query failed", sourceError.message);
      await recordInsightHealth(supabaseUrl, "deterministic", "source_unavailable");
      return json({ error: "Unable to read competency sources" }, 500);
    }

    const missingKeys = [
      !member.data && "legalitas-member",
      !isPresent(pancek.data) && "legalitas-pancek",
      !isPresent(lkut.data) && "legalitas-lkut",
      !isPresent(assessment.data) && "sertifikasi-assessment",
      (
        !isPresent(nativeCompletions.data)
        || nativeEnrollments.data?.some((item) => item.status !== "completed")
        || nativeLessonProgress.data?.some((item) => item.status !== "completed")
        || nativeQuizAttempts.data?.some((item) => !item.passed)
      ) && "sertifikasi-lms",
      !isPresent(certificates.data)
        && !isPresent(smap.data)
        && !isPresent(pancek.data)
        && !isPresent(activityEvidence.data)
        && "sertifikasi-evidence",
      (
        !isPresent(legacyModules.data)
        || legacyModules.data?.some((item) => item.status !== "completed" || item.progress_percent < 75)
      ) && "tender-learning",
      !isPresent(assessment.data) && !isPresent(competencyScore.data) && "tender-team",
      !isPresent(risks.data) && "tender-risk",
      !isPresent(projects.data) && "proyek-workspace",
      !isPresent(projectEvidence.data) && "proyek-evidence",
      !isPresent(risks.data) && !isPresent(budgets.data) && !isPresent(k3.data) && "proyek-controls",
    ].filter((key): key is string => Boolean(key));

    const fallbackKeys = deterministicKeys(missingKeys);
    const engineUrl = Deno.env.get("GUSTAFTA_ENGINE_URL");
    const engineApiKey = Deno.env.get("GUSTAFTA_ENGINE_API_KEY");

    if (missingKeys.length === 0) {
      await recordInsightHealth(supabaseUrl, "deterministic", "none");
    } else if (engineUrl && engineApiKey) {
      try {
        const requestedKeys = await requestRecommendationKeys(
          engineUrl,
          engineApiKey,
          missingKeys,
        );
        if (requestedKeys.length > 0) {
          await recordInsightHealth(supabaseUrl, "connected", "none");
          return json({
            source: "connected",
            recommendations: requestedKeys.map(toRecommendation).filter(Boolean),
            generatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        const failureReason = error instanceof CompetencyInsightError
          ? error.code
          : "unavailable";
        console.error(
          "Competency engine request failed",
          error instanceof Error ? error.message : "Unknown error",
        );
        await recordInsightHealth(supabaseUrl, "deterministic", failureReason);
      }
    } else {
      await recordInsightHealth(supabaseUrl, "deterministic", "not_configured");
    }

    return json({
      source: "deterministic",
      recommendations: fallbackKeys.map(toRecommendation).filter(Boolean),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("competency-insight error", error);
    return json({ error: "Unable to create competency insight" }, 500);
  }
});
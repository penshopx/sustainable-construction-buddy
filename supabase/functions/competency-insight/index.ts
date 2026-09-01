import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
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

    if (engineUrl && engineApiKey && missingKeys.length > 0) {
      try {
        const requestedKeys = await requestRecommendationKeys(
          engineUrl,
          engineApiKey,
          missingKeys,
        );
        if (requestedKeys.length > 0) {
          return json({
            source: "connected",
            recommendations: requestedKeys.map(toRecommendation).filter(Boolean),
            generatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(
          "Competency engine request failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
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
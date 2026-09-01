import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Focus = "legalitas" | "sertifikasi" | "tender" | "proyek";

interface Recommendation {
  text: string;
  href: string;
  label: string;
}

interface RecommendationDefinition extends Recommendation {
  focus: Focus;
}

const recommendationCatalog: Record<string, RecommendationDefinition> = {
  "legalitas-member": {
    focus: "legalitas",
    text: "Lengkapi status dan identitas keanggotaan BUJK.",
    href: "/pancek",
    label: "Lengkapi profil",
  },
  "legalitas-pancek": {
    focus: "legalitas",
    text: "Lengkapi identitas badan usaha, NIB, dan NPWP melalui PANCEK.",
    href: "/pancek",
    label: "Buka PANCEK",
  },
  "legalitas-lkut": {
    focus: "legalitas",
    text: "Lengkapi data KTA, SBU, perizinan, dan administrasi pada LKUT.",
    href: "/lkut",
    label: "Buka LKUT",
  },
  "sertifikasi-assessment": {
    focus: "sertifikasi",
    text: "Selesaikan pre-test untuk memetakan level kompetensi awal.",
    href: "/assessment",
    label: "Mulai assessment",
  },
  "sertifikasi-lms": {
    focus: "sertifikasi",
    text: "Lanjutkan E-Course, kuis, dan completion record di LMS ASPEKINDO.",
    href: "/aspekindo-lms",
    label: "Buka LMS",
  },
  "sertifikasi-evidence": {
    focus: "sertifikasi",
    text: "Tambahkan bukti penyelesaian dari sertifikat, PANCEK, atau SMAP.",
    href: "/certificates",
    label: "Lihat bukti",
  },
  "tender-learning": {
    focus: "tender",
    text: "Pelajari pengadaan, kontrak, dokumen penawaran, dan risiko tender.",
    href: "/courses",
    label: "Buka E-Course",
  },
  "tender-team": {
    focus: "tender",
    text: "Tinjau kesiapan tim menggunakan assessment dan scoring 4 Pilar.",
    href: "/analytics",
    label: "Buka Analytics",
  },
  "tender-risk": {
    focus: "tender",
    text: "Petakan risiko tender, supplier, dan rencana mitigasinya.",
    href: "/risk-register",
    label: "Buka workspace",
  },
  "proyek-workspace": {
    focus: "proyek",
    text: "Catat proyek aktif atau selesai beserta status dan kompleksitasnya.",
    href: "/projects",
    label: "Buka proyek",
  },
  "proyek-evidence": {
    focus: "proyek",
    text: "Lengkapi evidence pengalaman proyek pada data proyek dan LKUT.",
    href: "/lkut",
    label: "Buka LKUT",
  },
  "proyek-controls": {
    focus: "proyek",
    text: "Lengkapi kontrol K3, risiko, dan biaya pada workspace proyek.",
    href: "/k3-checklist",
    label: "Buka kontrol proyek",
  },
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

function toRecommendation(key: string): Recommendation | null {
  const item = recommendationCatalog[key];
  return item ? { text: item.text, href: item.href, label: item.label } : null;
}

function deterministicKeys(missingKeys: string[]) {
  return [...missingKeys]
    .sort((left, right) => {
      const focusOrder: Focus[] = ["legalitas", "sertifikasi", "tender", "proyek"];
      return focusOrder.indexOf(recommendationCatalog[left].focus)
        - focusOrder.indexOf(recommendationCatalog[right].focus);
    })
    .slice(0, 3);
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
        const response = await fetch(engineUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${engineApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schemaVersion: "pub-siap-v1",
            availableRecommendationKeys: missingKeys,
          }),
          signal: AbortSignal.timeout(8_000),
        });

        if (response.ok) {
          const payload = await response.json();
          const requestedKeys = Array.isArray(payload?.recommendationKeys)
            ? payload.recommendationKeys.filter(
                (key: unknown): key is string => typeof key === "string" && missingKeys.includes(key),
              ).slice(0, 3)
            : [];
          if (requestedKeys.length > 0) {
            return json({
              source: "connected",
              recommendations: requestedKeys.map(toRecommendation).filter(Boolean),
              generatedAt: new Date().toISOString(),
            });
          }
        } else {
          console.error("Competency engine returned non-success status", response.status);
        }
      } catch (error) {
        console.error("Competency engine request failed", error);
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
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildSiapCompetencyMap,
  type SiapActivitySource,
  type SiapCompetencySnapshot,
  type SiapModuleProgressSource,
} from "@/lib/siapCompetencyEngine";

interface ModuleProgressRow {
  status: string;
  progress_percent: number;
  e_course_modules: {
    title: string;
    competency_domains: { name: string } | null;
  } | null;
}

function assertResult(
  label: string,
  result: { error: { message: string } | null },
) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
}

export function useSiapCompetencyMap() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["siap-competency-map", user?.id],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) throw new Error("Pengguna belum terautentikasi.");

      const memberResult = await supabase
        .from("aspekindo_members")
        .select("id, membership_status, membership_number, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      assertResult("Data anggota", memberResult);

      const [
        activitiesResult,
        enrollmentsResult,
        evidenceResult,
        modulesResult,
        certificatesResult,
        pancekResult,
        lkutResult,
        smapResult,
        projectsResult,
        risksResult,
        budgetsResult,
        k3Result,
        obligationsResult,
         nativeCoursesResult,
         nativeEnrollmentsResult,
         nativeProgressResult,
         nativeCompletionsResult,
      ] = await Promise.all([
        supabase
          .from("aspekindo_pub_activities")
          .select("id, title, siap_focus")
          .in("status", ["published", "completed"]),
        supabase
          .from("aspekindo_activity_enrollments")
          .select("activity_id, status, completed_at")
          .eq("user_id", user.id),
        supabase
          .from("aspekindo_activity_evidence")
          .select("id, activity_id, title, issued_at")
          .eq("user_id", user.id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("module_progress")
          .select("status, progress_percent, e_course_modules(title, competency_domains:domain_id(name))")
          .eq("user_id", user.id),
        supabase
          .from("certificates")
          .select("id, module_name, level, issued_at")
          .eq("user_id", user.id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("pancek_assessments")
          .select("company_name, nib, npwp, completion_percent, status, period_year")
          .eq("user_id", user.id)
          .order("period_year", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("lkut_reports")
          .select(
            "report_year, status, submitted_at, kta_number, kta_expiry_date, sbu_number, sbu_expiry_date, experience_records_complete, experience_pending_list",
          )
          .eq("user_id", user.id)
          .order("report_year", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("smap_documents")
          .select("id, doc_type, status, verified_at")
          .eq("user_id", user.id),
        supabase
          .from("projects")
          .select("id, status, contract_type, complexity_score")
          .eq("user_id", user.id),
        supabase.from("risk_registers").select("id").eq("user_id", user.id),
        supabase.from("budget_entries").select("id").eq("user_id", user.id),
        supabase.from("k3_checklists").select("id").eq("user_id", user.id),
        memberResult.data
          ? supabase
              .from("aspekindo_member_obligations")
              .select("id, title, siap_focus, status, fulfilled_at")
              .eq("member_id", memberResult.data.id)
          : Promise.resolve({ data: [], error: null }),
         supabase
           .from("aspekindo_lms_courses")
           .select("id, title, siap_focus")
           .eq("status", "published"),
         supabase
           .from("aspekindo_lms_enrollments")
           .select("course_id, status, completed_at, last_activity_at")
           .eq("user_id", user.id),
         supabase
           .from("aspekindo_lms_lesson_progress")
           .select("course_id, status, progress_percent, updated_at")
           .eq("user_id", user.id),
         supabase
           .from("aspekindo_lms_completion_records")
           .select("course_id, status, issued_at")
           .eq("user_id", user.id),
      ]);

      [
        ["Kegiatan PUB", activitiesResult],
        ["Pendaftaran kegiatan", enrollmentsResult],
        ["Bukti kegiatan", evidenceResult],
        ["Progres kursus", modulesResult],
        ["Sertifikat", certificatesResult],
        ["PANCEK", pancekResult],
        ["LKUT", lkutResult],
        ["SMAP", smapResult],
        ["Proyek", projectsResult],
        ["Risk register", risksResult],
        ["Budget tracker", budgetsResult],
        ["K3 checklist", k3Result],
        ["Kewajiban anggota", obligationsResult],
         ["Kursus LMS ASPEKINDO", nativeCoursesResult],
         ["Enrollment LMS ASPEKINDO", nativeEnrollmentsResult],
         ["Progres LMS ASPEKINDO", nativeProgressResult],
         ["Bukti LMS ASPEKINDO", nativeCompletionsResult],
      ].forEach(([label, result]) =>
        assertResult(label as string, result as { error: { message: string } | null }),
      );

      const modules = (modulesResult.data as ModuleProgressRow[] | null ?? []).map(
        (item): SiapModuleProgressSource => ({
          status: item.status,
          progress_percent: item.progress_percent,
          module_title: item.e_course_modules?.title ?? "Modul pembelajaran",
          domain_name: item.e_course_modules?.competency_domains?.name ?? "",
        }),
      );

      const snapshot: SiapCompetencySnapshot = {
        member: memberResult.data
          ? {
              membership_status: memberResult.data.membership_status,
              membership_number: memberResult.data.membership_number,
              expires_at: memberResult.data.expires_at,
            }
          : null,
        obligations: obligationsResult.data ?? [],
        activities: (activitiesResult.data ?? []) as SiapActivitySource[],
        enrollments: enrollmentsResult.data ?? [],
        evidence: evidenceResult.data ?? [],
        modules,
        certificates: certificatesResult.data ?? [],
        pancek: pancekResult.data,
        lkut: lkutResult.data,
        smapDocuments: smapResult.data ?? [],
        projects: projectsResult.data ?? [],
         nativeLmsCourses: nativeCoursesResult.data ?? [],
         nativeLmsEnrollments: nativeEnrollmentsResult.data ?? [],
         nativeLmsProgress: nativeProgressResult.data ?? [],
         nativeLmsCompletions: nativeCompletionsResult.data ?? [],
        operationalCounts: {
          risks: risksResult.data?.length ?? 0,
          budgets: budgetsResult.data?.length ?? 0,
          k3: k3Result.data?.length ?? 0,
        },
      };

      return buildSiapCompetencyMap(snapshot);
    },
  });
}
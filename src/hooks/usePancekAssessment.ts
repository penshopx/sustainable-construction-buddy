import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PancekAnswers } from "@/lib/pancekAnswerTypes";

export interface PancekAssessment {
  id: string;
  user_id: string;
  period_year: number;
  company_name: string;
  npwp: string;
  nib: string;
  komitmen_score: number;
  komitmen_total: number;
  perencanaan_score: number;
  perencanaan_total: number;
  pelaksanaan_score: number;
  pelaksanaan_total: number;
  evaluasi_score: number;
  evaluasi_total: number;
  perbaikan_score: number;
  perbaikan_total: number;
  respon_score: number;
  respon_total: number;
  total_answered: number;
  total_indicators: number;
  completion_percent: number;
  status: string;
  verified_at: string | null;
  verified_by: string;
  verification_notes: string;
  answers: PancekAnswers | Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export function usePancekAssessment() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<PancekAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase.from("pancek_assessments") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("period_year", { ascending: false });
    if (error) {
      console.error("Error fetching pancek:", error);
    } else {
      setAssessments(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const saveAssessment = async (
    periodYear: number,
    answers: PancekAnswers,
    pillarScores: Record<string, number>,
    meta: { company_name: string; npwp: string; nib: string }
  ) => {
    if (!user) return;

    const totalAnswered = Object.values(answers).filter(a => a.status === "ya" || a.status === "sebagian").length;
    const totalIndicators = 70;
    const completionPercent = Math.round((totalAnswered / totalIndicators) * 100);

    const payload = {
      user_id: user.id,
      period_year: periodYear,
      company_name: meta.company_name,
      npwp: meta.npwp,
      nib: meta.nib,
      komitmen_score: Math.round(pillarScores.komitmen || 0),
      perencanaan_score: Math.round(pillarScores.perencanaan || 0),
      pelaksanaan_score: Math.round(pillarScores.pelaksanaan || 0),
      evaluasi_score: Math.round(pillarScores.evaluasi || 0),
      perbaikan_score: Math.round(pillarScores.perbaikan || 0),
      respon_score: Math.round(pillarScores.respon || 0),
      total_answered: totalAnswered,
      completion_percent: completionPercent,
      answers,
    };

    const existing = assessments.find(a => a.period_year === periodYear);

    if (existing) {
      const { error } = await (supabase.from("pancek_assessments") as any)
        .update(payload)
        .eq("id", existing.id);
      if (error) {
        toast.error("Gagal menyimpan: " + error.message);
        return;
      }
    } else {
      const { error } = await (supabase.from("pancek_assessments") as any)
        .insert(payload);
      if (error) {
        toast.error("Gagal membuat: " + error.message);
        return;
      }
    }

    toast.success("PANCEK berhasil disimpan");
    fetchAssessments();
  };

  const submitAssessment = async (id: string) => {
    const { error } = await (supabase.from("pancek_assessments") as any)
      .update({ status: "submitted" })
      .eq("id", id);
    if (error) {
      toast.error("Gagal submit: " + error.message);
      return;
    }
    toast.success("PANCEK berhasil disubmit untuk verifikasi Asosiasi");
    fetchAssessments();
  };

  return { assessments, loading, saveAssessment, submitAssessment, refetch: fetchAssessments };
}

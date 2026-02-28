import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface LkutReport {
  id: string;
  user_id: string;
  report_year: number;
  status: string;
  sbu_number: string;
  sbu_type: string;
  sbu_expiry_date: string | null;
  tkk_replacement: boolean;
  tkk_replacement_date: string | null;
  tkk_replacement_notes: string;
  equipment_commitment_fulfilled: boolean;
  equipment_fulfillment_date: string | null;
  smap_fulfilled: boolean;
  smap_report_date: string | null;
  experience_records_complete: boolean;
  experience_pending_list: string;
  asset_value_current: number;
  asset_value_previous: number;
  sales_value: number;
  gross_profit: number;
  current_assets: number;
  short_term_liabilities: number;
  total_liabilities: number;
  total_equity: number;
  gcg_applied: boolean;
  gcg_first_year: number | null;
  certifications: string;
  awards: string;
  smk3_applied: boolean;
  smk3_first_year: number | null;
  total_employees: number;
  trained_employees: number;
  contract_experts: number;
  permanent_experts: number;
  submitted_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useLkutReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<LkutReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lkut_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("report_year", { ascending: false });
    if (error) {
      toast({ title: "Gagal memuat laporan", description: error.message, variant: "destructive" });
    } else {
      setReports((data || []) as unknown as LkutReport[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const createReport = async (year: number) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("lkut_reports")
      .insert({ user_id: user.id, report_year: year } as any)
      .select()
      .single();
    if (error) {
      toast({ title: "Gagal membuat laporan", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: `LKUT ${year} dibuat` });
    await fetchReports();
    return data as unknown as LkutReport;
  };

  const updateReport = async (id: string, updates: Partial<LkutReport>) => {
    const { error } = await supabase
      .from("lkut_reports")
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Data tersimpan" });
    await fetchReports();
    return true;
  };

  const submitReport = async (id: string) => {
    const { error } = await supabase
      .from("lkut_reports")
      .update({ status: "submitted", submitted_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Gagal mengirim", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "LKUT berhasil dikirim! 🎉" });
    await fetchReports();
    return true;
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase
      .from("lkut_reports")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Laporan dihapus" });
    await fetchReports();
    return true;
  };

  return { reports, loading, fetchReports, createReport, updateReport, submitReport, deleteReport };
}

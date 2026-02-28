import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InnovationCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  concepts: string[];
  programs: string[];
  benefits: string[];
  stage: number;
  sort_order: number;
}

export interface InnovationProposal {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  scope: string;
  expected_impact: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  innovation_categories?: InnovationCategory;
}

export function useInnovationCategories() {
  return useQuery({
    queryKey: ["innovation-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("innovation_categories" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as InnovationCategory[];
    },
  });
}

export function useInnovationProposals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["innovation-proposals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("innovation_proposals" as any)
        .select("*, innovation_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as InnovationProposal[];
    },
    enabled: !!user,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proposal: {
      category_id: string;
      title: string;
      description: string;
      scope: string;
      expected_impact: string;
    }) => {
      const { data, error } = await supabase
        .from("innovation_proposals" as any)
        .insert({ ...proposal, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["innovation-proposals"] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("innovation_proposals" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["innovation-proposals"] });
    },
  });
}

export function useAdminInnovationProposals() {
  return useQuery({
    queryKey: ["admin-innovation-proposals"],
    queryFn: async () => {
      const { data: proposals, error } = await supabase
        .from("innovation_proposals" as any)
        .select("*, innovation_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const userIds = [...new Set((proposals as any[]).map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, company")
        .in("user_id", userIds);
      
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return (proposals as any[]).map((p) => ({
        ...p,
        submitter_name: profileMap.get(p.user_id)?.full_name || "Unknown",
        submitter_company: profileMap.get(p.user_id)?.company || "",
      })) as unknown as (InnovationProposal & { submitter_name: string; submitter_company: string })[];
    },
  });
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("innovation_proposals" as any)
        .update({ status, admin_notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-innovation-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["innovation-proposals"] });
    },
  });
}

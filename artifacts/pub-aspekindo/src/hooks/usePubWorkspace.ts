import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVaultWorkspace } from "@workspace/api-client-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ROOT = "pub-workspace";
export const pubWorkspaceKey = (userId?: string) => [ROOT, userId] as const;

/** One owner-scoped, live view of the canonical workspace for all PUB features. */
export function usePubWorkspace() {
  const { user } = useAuth();
  const userId = user?.id;
  const qc = useQueryClient();
  useEffect(() => {
    void qc.cancelQueries({ queryKey: [ROOT], predicate: q => q.queryKey[1] !== userId });
    qc.removeQueries({ queryKey: [ROOT], predicate: q => q.queryKey[1] !== userId });
  }, [qc, userId]);
  const query = useQuery({
    queryKey: pubWorkspaceKey(userId), enabled: !!userId,
    queryFn: async ({ signal }) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || session.user.id !== userId) throw new Error("Sesi tidak valid. Silakan masuk kembali.");
      return getVaultWorkspace({ headers: { Authorization: `Bearer ${session.access_token}` }, signal });
    },
    staleTime: 5_000, refetchInterval: 15_000, refetchOnWindowFocus: true, retry: false,
  });
  // A failed refresh must not present stale private data as an authorized current view.
  return { ...query, data: userId && !query.isError ? query.data : undefined, userId };
}

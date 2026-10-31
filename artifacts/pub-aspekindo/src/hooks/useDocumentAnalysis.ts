import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVaultWorkspace, listDocumentAnalyses, analyzeVaultDocument,
  chatDocumentAnalysis, deleteDocumentAnalysis, processVaultOcr,
  type VaultDocument,
} from "@workspace/api-client-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type { DocumentAnalysis, VaultDocument } from "@workspace/api-client-react";
const ROOT = "bedah-dokumen";
export const BEDAH_MAX_BYTES = 50 * 1024 * 1024;
export const BEDAH_ACCEPT = ".pdf,.txt,.jpg,.jpeg,.png";
export function analysisError(error: unknown): string {
  const data = (error as { data?: { error?: unknown } } | null)?.data;
  if (typeof data?.error === "string") return data.error;
  if (error instanceof Error && !("data" in error)) return error.message;
  return "Permintaan belum berhasil. Silakan coba lagi.";
}
export function useDocumentAnalysis() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;
  useEffect(() => {
    void qc.cancelQueries({ queryKey: [ROOT], predicate: q => q.queryKey[1] !== userId });
    qc.removeQueries({ queryKey: [ROOT], predicate: q => q.queryKey[1] !== userId });
  }, [qc, userId]);
  const auth = async (signal?: AbortSignal): Promise<RequestInit> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || session.user.id !== userId) throw new Error("Sesi tidak valid. Silakan masuk kembali.");
    return { headers: { Authorization: `Bearer ${session.access_token}` }, signal };
  };
  const refresh = () => qc.invalidateQueries({ queryKey: [ROOT, userId] });
  const documents = useQuery({
    queryKey: [ROOT, userId, "documents"], enabled: !!userId,
    queryFn: async ({ signal }) => getVaultWorkspace(await auth(signal)),
    refetchOnWindowFocus: true, refetchInterval: 10_000, retry: false,
  });
  const analyses = useQuery({
    queryKey: [ROOT, userId, "analyses"], enabled: !!userId,
    queryFn: async ({ signal }) => listDocumentAnalyses(await auth(signal)),
    refetchOnWindowFocus: true, refetchInterval: 20_000, retry: false,
  });
  const upload = useMutation({
    mutationFn: async (file: File): Promise<VaultDocument> => {
      if (!/\.(pdf|txt|jpg|jpeg|png)$/i.test(file.name)) throw new Error("Pilih PDF, TXT, JPG, atau PNG.");
      if (!file.size || file.size > BEDAH_MAX_BYTES) throw new Error("File harus berisi data dan maksimal 50 MB.");
      const query = new URLSearchParams({ name: file.name, folderId: "default-6" });
      const options = await auth();
      const res = await fetch(`/api/ruang-simpan/documents?${query}`, {
        ...options, method: "POST", body: file,
        headers: { ...options.headers, "Content-Type": "application/octet-stream" },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unggah belum berhasil.");
      return body as VaultDocument;
    }, onSuccess: refresh,
  });
  const analyze = useMutation({
    mutationFn: async (documentId: string) =>
      analyzeVaultDocument({ documentId, consent: true }, await auth()),
    onSettled: refresh,
  });
  const chat = useMutation({
    mutationFn: async ({ id, question }: { id: string; question: string }) =>
      chatDocumentAnalysis(id, { question, consent: true }, await auth()),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => deleteDocumentAnalysis(id, await auth()),
    onSuccess: refresh,
  });
  const ocr = useMutation({
    mutationFn: async (id: string) => processVaultOcr(id, { consent: true, provider: "openrouter-anthropic-v1" }, await auth()),
    onSettled: refresh,
  });
  // Failed refetches must not present old records as current or authorized.
  return { userId, documents: { ...documents, data: documents.isError ? undefined : documents.data },
    analyses: { ...analyses, data: analyses.isError ? undefined : analyses.data },
    upload, analyze, chat, remove, ocr, refresh };
}

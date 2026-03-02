import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type CustomChatbot = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  avatar_url: string;
  mode: string;
  persona: string;
  welcome_message: string;
  tools: any[];
  is_public: boolean;
  share_token: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatbotFormData = {
  name: string;
  description: string;
  avatar_url: string;
  mode: string;
  persona: string;
  welcome_message: string;
  tools: string[];
  is_public: boolean;
  project_id: string | null;
  knowledge_base_ids: string[];
};

export function useCustomChatbots(filterMode?: string) {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState<CustomChatbot[]>([]);
  const [publicBots, setPublicBots] = useState<CustomChatbot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChatbots = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Load user's own bots
    let query = supabase
      .from("custom_chatbots")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (filterMode) {
      query = query.eq("mode", filterMode);
    }

    const { data } = await query;
    setChatbots((data as CustomChatbot[]) || []);

    // Load public profesi marketplace
    const { data: pubData } = await supabase
      .from("custom_chatbots")
      .select("*")
      .eq("is_public", true)
      .eq("mode", "profesi")
      .order("updated_at", { ascending: false });

    setPublicBots((pubData as CustomChatbot[]) || []);
    setLoading(false);
  }, [user, filterMode]);

  useEffect(() => {
    loadChatbots();
  }, [loadChatbots]);

  const createChatbot = useCallback(async (formData: ChatbotFormData) => {
    if (!user) return null;

    const shareToken = crypto.randomUUID().slice(0, 12);

    const { data, error } = await supabase
      .from("custom_chatbots")
      .insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        avatar_url: formData.avatar_url,
        mode: formData.mode,
        persona: formData.persona,
        welcome_message: formData.welcome_message,
        tools: formData.tools as any,
        is_public: formData.is_public,
        share_token: shareToken,
        project_id: formData.project_id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Link knowledge bases
    if (formData.knowledge_base_ids.length > 0 && data) {
      await supabase.from("chatbot_knowledge_links").insert(
        formData.knowledge_base_ids.map((kbId) => ({
          chatbot_id: data.id,
          knowledge_base_id: kbId,
        }))
      );
    }

    await loadChatbots();
    toast({ title: "Berhasil", description: "Chatbot berhasil dibuat!" });
    return data as CustomChatbot;
  }, [user, loadChatbots]);

  const deleteChatbot = useCallback(async (id: string) => {
    await supabase.from("custom_chatbots").delete().eq("id", id);
    await loadChatbots();
    toast({ title: "Dihapus", description: "Chatbot berhasil dihapus." });
  }, [loadChatbots]);

  const getChatbotByShareToken = useCallback(async (token: string) => {
    const { data } = await supabase
      .from("custom_chatbots")
      .select("*")
      .eq("share_token", token)
      .single();
    return data as CustomChatbot | null;
  }, []);

  return {
    chatbots,
    publicBots,
    loading,
    createChatbot,
    deleteChatbot,
    getChatbotByShareToken,
    reload: loadChatbots,
  };
}

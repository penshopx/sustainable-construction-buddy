import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle, Send, Loader2, Bot, User, Trash2,
  Sparkles, HardHat, BookOpen, Shield, DollarSign
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { icon: HardHat, text: "Apa itu WBS dan bagaimana cara membuatnya?" },
  { icon: Shield, text: "Jelaskan langkah-langkah identifikasi risiko proyek konstruksi" },
  { icon: DollarSign, text: "Bagaimana cara membuat RAB yang akurat?" },
  { icon: BookOpen, text: "Apa saja prinsip Good Corporate Governance untuk BUJK?" },
];

const Mentor = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userLevel: profile?.current_level || "Pemula",
        },
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      toast.error("Gagal mengirim pesan");
      setMessages(newMessages); // keep user message
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-pub-amber" />
          Mentor Digital
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Asisten AI ahli manajemen konstruksi — tanyakan apapun seputar kompetensi BUJK.
        </p>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card shadow-card p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-pub-amber/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-pub-amber" />
            </div>
            <h3 className="font-heading font-bold text-foreground text-lg mb-2">
              Halo! Saya Mentor Digital PUB 👷
            </h3>
            <p className="text-sm text-muted-foreground font-body max-w-md mb-6">
              Saya siap membantu Anda memahami konsep manajemen konstruksi, regulasi BUJK, dan meningkatkan kompetensi manajerial Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.text)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-left group"
                >
                  <qp.icon className="w-5 h-5 text-pub-amber shrink-0 mt-0.5" />
                  <span className="text-xs font-body text-muted-foreground group-hover:text-foreground transition-colors">
                    {qp.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-pub-amber/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-pub-amber" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-muted text-foreground rounded-tl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_li]:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm font-body whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-pub-amber/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-pub-amber" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-body">Sedang mengetik...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2">
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="shrink-0 w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
            title="Hapus percakapan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan tentang manajemen konstruksi..."
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground hover:brightness-110 transition-all disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mentor;

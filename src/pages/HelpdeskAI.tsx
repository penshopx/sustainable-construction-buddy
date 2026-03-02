import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Trash2, Sparkles, Plus, MessageSquare, ChevronLeft, Search, X, GraduationCap, Briefcase, FolderKanban, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { useHelpdeskChat, Conversation } from "@/hooks/useHelpdeskChat";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export type PakarMode = "pembelajaran" | "profesi" | "proyek";

const PAKAR_MODES = [
  {
    id: "pembelajaran" as PakarMode,
    name: "Mentor Pembelajaran",
    description: "Pendamping belajar PUB, PANCEK, SMAP, regulasi konstruksi",
    icon: GraduationCap,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    suggestions: [
      "Jelaskan konsep dasar PANCEK dan cara penilaiannya",
      "Apa saja indikator SMAP ISO 37001?",
      "Bagaimana proses sertifikasi kompetensi kerja konstruksi?",
      "Jelaskan perbedaan kualifikasi Kecil, Menengah, dan Besar",
    ],
  },
  {
    id: "profesi" as PakarMode,
    name: "Chatbot Profesi",
    description: "Persiapan SKK & SBU — syarat, proses, strategi kelulusan",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    suggestions: [
      "Syarat perpanjangan SBU untuk BUJK Menengah?",
      "Bagaimana cara mendapatkan SKK untuk jabatan PJT?",
      "Apa perbedaan sub-klasifikasi SBU terbaru?",
      "Strategi persiapan ujian SKK level manajerial",
    ],
  },
  {
    id: "proyek" as PakarMode,
    name: "Chatbot Proyek",
    description: "Analisis & problem solving proyek konstruksi",
    icon: FolderKanban,
    color: "text-pub-amber",
    bgColor: "bg-pub-amber/10",
    suggestions: [
      "Bagaimana cara menghitung earned value proyek?",
      "Analisis risiko keterlambatan proyek dan mitigasinya",
      "Strategi pengendalian biaya proyek konstruksi",
      "Cara menyusun WBS yang efektif untuk proyek infrastruktur",
    ],
  },
];

export default function HelpdeskAI() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<PakarMode>("pembelajaran");
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    loadingConversations,
    sendMessage,
    selectConversation,
    startNewConversation,
    deleteConversation,
  } = useHelpdeskChat(activeMode);

  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const currentPakar = PAKAR_MODES.find(m => m.id === activeMode)!;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Silakan login terlebih dahulu untuk menggunakan Pakar Cerdas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pub-amber/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-pub-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Pakar Cerdas</h1>
            <p className="text-sm text-muted-foreground">Asisten AI agentic dengan knowledge base RAG</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="md:hidden">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PAKAR_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => { setActiveMode(mode.id); startNewConversation(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
              activeMode === mode.id
                ? "bg-primary/10 border-primary/20 text-foreground shadow-sm"
                : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            <mode.icon className={`w-4 h-4 ${mode.color}`} />
            {mode.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3" style={{ height: "calc(100vh - 290px)" }}>
        {/* Conversation sidebar */}
        <div className={`${showSidebar ? "flex" : "hidden"} md:flex flex-col w-full md:w-64 shrink-0 bg-card rounded-xl border border-border`}>
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-0">
              <span className="text-sm font-semibold text-foreground">Riwayat Chat</span>
              <div className="flex gap-1">
                {conversations.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}>
                    {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewConversation}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {showSearch && (
              <div className="mt-2">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari percakapan..."
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
            )}
          </div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {searchQuery ? "Tidak ditemukan" : "Belum ada percakapan"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => { selectConversation(conv.id); setShowSidebar(false); }}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col bg-card rounded-xl border border-border`}>
          {/* Mobile back button */}
          <div className="md:hidden p-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Riwayat
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                <div className={`w-14 h-14 rounded-2xl ${currentPakar.bgColor} flex items-center justify-center mb-4`}>
                  <currentPakar.icon className={`w-7 h-7 ${currentPakar.color}`} />
                </div>
                <p className="font-heading font-semibold text-lg mb-1 text-foreground">{currentPakar.name}</p>
                <p className="text-sm mb-6 text-center max-w-md">{currentPakar.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {currentPakar.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { sendMessage(s); setShowSidebar(false); }}
                      className="text-left text-sm p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/30 transition-colors flex items-start gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${currentPakar.color} mt-0.5 shrink-0`} />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className={`w-8 h-8 rounded-lg ${currentPakar.bgColor} flex items-center justify-center shrink-0 mt-1 mr-2`}>
                        <currentPakar.icon className={`w-4 h-4 ${currentPakar.color}`} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 border border-border"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className={`w-8 h-8 rounded-lg ${currentPakar.bgColor} flex items-center justify-center shrink-0 mr-2`}>
                      <currentPakar.icon className={`w-4 h-4 ${currentPakar.color}`} />
                    </div>
                    <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sedang mengetik...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); setInput(""); setShowSidebar(false); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ketik pertanyaan Anda..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {conversation.title || "Percakapan baru"}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(conversation.updated_at), "d MMM yyyy, HH:mm", { locale: localeId })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="w-3 h-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Trash2, Sparkles, Plus, MessageSquare, ChevronLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { useHelpdeskChat, Conversation } from "@/hooks/useHelpdeskChat";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const SUGGESTIONS = [
  "Apa itu PANCEK dan bagaimana cara penilaiannya?",
  "Syarat perpanjangan SBU untuk BUJK Menengah?",
  "Jelaskan perbedaan kualifikasi Kecil, Menengah, dan Besar",
  "Apa saja indikator SMAP ISO 37001?",
];

export default function HelpdeskAI() {
  const { user } = useAuth();
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
  } = useHelpdeskChat();

  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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
        <p>Silakan login terlebih dahulu untuk menggunakan Helpdesk AI.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Helpdesk AI</h1>
            <p className="text-sm text-muted-foreground">Tanya jawab seputar PUB & regulasi konstruksi</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="md:hidden">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3" style={{ height: "calc(100vh - 220px)" }}>
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
                <Bot className="w-14 h-14 mb-4 opacity-20" />
                <p className="font-heading font-semibold text-lg mb-1">Helpdesk AI siap membantu</p>
                <p className="text-sm mb-6">Tanyakan apa saja tentang PUB, PANCEK, SBU, atau regulasi konstruksi.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { sendMessage(s); setShowSidebar(false); }}
                      className="text-left text-sm p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/30 transition-colors flex items-start gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
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
                    <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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

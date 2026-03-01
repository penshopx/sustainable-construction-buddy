import { Bot, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HelpdeskAI() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pub-emerald/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-pub-emerald" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Helpdesk AI</h1>
          <p className="text-sm text-muted-foreground">Tanya jawab seputar PUB & regulasi konstruksi</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-heading font-semibold">Helpdesk AI siap membantu</p>
            <p className="text-sm">Ketik pertanyaan Anda di bawah ini.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Input placeholder="Ketik pertanyaan Anda..." />
          <Button size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

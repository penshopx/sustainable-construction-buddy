import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeIcon: Record<string, string> = {
    level_up: "🎉",
    certificate: "🏆",
    info: "ℹ️",
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o && unreadCount > 0) markAllRead(); }}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-heading font-bold text-sm text-foreground">Notifikasi</h3>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center font-body">
              Belum ada notifikasi
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-sm ${!n.is_read ? "bg-accent/30" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{typeIcon[n.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-foreground">{n.title}</p>
                      <p className="text-muted-foreground font-body mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => { setOpen(false); navigate("/notifications"); }}
            className="w-full text-center text-xs font-heading font-semibold text-primary hover:underline py-1"
          >
            Lihat semua notifikasi
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

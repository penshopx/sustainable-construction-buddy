import { useRef, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const errorToastId = "pub-logout-error";

export function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const handleLogout = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    toast.dismiss(errorToastId);
    try {
      await signOut();
    } catch {
      toast.error("Gagal keluar. Sesi Anda masih aktif.", {
        id: errorToastId,
        duration: Infinity,
        description: "Jangan tinggalkan perangkat bersama sebelum berhasil keluar. Periksa koneksi lalu coba lagi.",
        action: { label: "Coba lagi", onClick: () => { void handleLogout(); } },
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <SidebarMenuButton
      onClick={() => { void handleLogout(); }}
      disabled={pending}
      aria-busy={pending}
      aria-label={pending ? "Sedang keluar…" : "Keluar"}
      tooltip={pending ? "Sedang keluar…" : "Keluar"}
      className="text-destructive hover:bg-destructive/10"
    >
      {pending
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        : <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />}
      {!collapsed && <span>{pending ? "Sedang keluar…" : "Keluar"}</span>}
    </SidebarMenuButton>
  );
}

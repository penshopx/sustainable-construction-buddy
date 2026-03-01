import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  User,
  Bell,
  LogOut,
  BarChart3,
  FileText,
  MessageCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Award,
  Trophy,
  FolderKanban,
  DollarSign,
  HardHat,
  Building2,
  Briefcase,
  Lightbulb,
  CalendarDays,
  Store,
  Bot,
  ShoppingBag,
  Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import logoPub from "@/assets/logo-pub-new.png";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Project Workspace", url: "/projects", icon: FolderKanban },
  { title: "Risk Register", url: "/risk-register", icon: Shield },
  { title: "Budget Tracker", url: "/budget-tracker", icon: DollarSign },
  { title: "K3 Checklist", url: "/k3-checklist", icon: HardHat },
  { title: "LKUT", url: "/lkut", icon: FileText },
  { title: "Kinerja & Grading", url: "/grading", icon: BarChart3 },
  { title: "Compliance Tracker", url: "/compliance", icon: ShieldCheck },
  { title: "SMAP", url: "/smap", icon: ShieldCheck },
  { title: "Pre-test Assessment", url: "/assessment", icon: ClipboardCheck },
  { title: "E-Course", url: "/courses", icon: GraduationCap },
  { title: "Mentor Digital", url: "/mentor", icon: MessageCircle },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Generator Dokumen", url: "/generator", icon: FileText },
  { title: "Sertifikat", url: "/certificates", icon: Award },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Inovasi PUB", url: "/inovasi", icon: Lightbulb },
  { title: "Program & Kegiatan", url: "/program-kegiatan", icon: CalendarDays },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Direktori Perusahaan", url: "/direktori", icon: Building2 },
  { title: "Helpdesk AI", url: "/helpdesk", icon: Bot },
  { title: "Pesanan Saya", url: "/pesanan", icon: ShoppingBag },
  { title: "Produk Saya", url: "/produk-saya", icon: Package },
  { title: "Notifikasi", url: "/notifications", icon: Bell },
  { title: "Profil Saya", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Corporate Dashboard", url: "/corporate", icon: Building2 },
  { title: "Verifikasi PANCEK", url: "/admin/pancek", icon: ShieldAlert },
  { title: "Kelola Marketplace", url: "/admin/marketplace", icon: Store },
  { title: "Kelola Pesanan", url: "/admin/pesanan", icon: ShoppingBag },
  { title: "Statistik Penjualan", url: "/admin/statistik", icon: BarChart3 },
  { title: "Panel Admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <Sidebar collapsible="icon">
      <div className="flex flex-col items-center gap-2 p-4 border-b border-sidebar-border">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 20px hsl(var(--pub-amber) / 0.6))" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${collapsed ? "w-10 h-10" : "w-[17.5rem] h-[17.5rem]"} flex items-center justify-center cursor-pointer`}
        >
          <img
            src={logoPub}
            alt="PUB ASPEKINDO"
            className={`${collapsed ? "w-10 h-10" : "w-[17.5rem] h-[17.5rem]"} object-contain transition-transform duration-300`}
            style={{ imageRendering: "auto" }}
          />
        </motion.div>
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="text-lg font-extrabold font-heading tracking-wider text-pub-amber uppercase"
          >
            PUB ASPEKINDO
          </motion.p>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {profile && (
          <div className="px-4 py-2 border-t border-sidebar-border">
            {!collapsed ? (
              <>
                <p className="text-xs text-sidebar-foreground/70 font-body truncate">{profile.full_name || "User"}</p>
                <p className="text-xs text-sidebar-primary font-heading">{profile.current_level}</p>
                {profile.position && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-pub-amber/10 border border-pub-amber/20">
                    <Briefcase className="w-3 h-3 text-pub-amber shrink-0" />
                    <p className="text-[10px] text-pub-amber font-heading font-semibold truncate leading-tight">
                      {profile.position.replace("Penanggung Jawab Badan Usaha (PJBU) / Direktur", "PJBU / Direktur").replace("Penanggung Jawab Teknik (PJT)", "PJT").replace("Penanggung Jawab Subklasifikasi (PJSKBU)", "PJSKBU").replace("Manajer Logistik & Rantai Pasok", "Mgr. Logistik").replace("Manajer Pengadaan / Tender", "Mgr. Pengadaan").replace("Manajer Administrasi", "Mgr. Administrasi").replace("Manajer Keuangan", "Mgr. Keuangan")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center" title={profile.position || profile.current_level}>
                <Briefcase className="w-4 h-4 text-pub-amber" />
              </div>
            )}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Keluar</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

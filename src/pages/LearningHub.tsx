import { CalendarDays, GraduationCap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Courses from "./Courses";
import AspekindoLms from "./AspekindoLms";

export default function LearningHub() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab = pathname === "/aspekindo-lms" ? "activities" : "courses";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-card md:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pub-sky">Kompetensi & kegiatan PUB</p>
        <h1 className="mt-2 text-2xl font-bold font-heading text-foreground md:text-3xl">Pusat Pembelajaran PUB</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Satu ruang untuk membangun kompetensi melalui kursus mandiri dan mengikuti kegiatan PUB yang terdokumentasi.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => navigate(value === "activities" ? "/aspekindo-lms" : "/courses", { replace: true })}
      >
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="courses" className="gap-2 py-2.5">
            <GraduationCap className="h-4 w-4" /> Kursus Kompetensi
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2 py-2.5">
            <CalendarDays className="h-4 w-4" /> Kegiatan & Bukti PUB
          </TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6">
          <Courses embedded />
        </TabsContent>
        <TabsContent value="activities" className="mt-6">
          <AspekindoLms />
        </TabsContent>
      </Tabs>
    </div>
  );
}
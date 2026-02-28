import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, ClipboardCheck, GraduationCap, Award, ShieldAlert, Lightbulb } from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminQuestions from "./AdminQuestions";
import AdminModules from "./AdminModules";
import AdminCertificates from "./AdminCertificates";
import AdminRoleConflicts from "./AdminRoleConflicts";
import AdminInnovationReview from "./AdminInnovationReview";

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola soal, modul, pengguna, dan sertifikat</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Pengguna</TabsTrigger>
          <TabsTrigger value="questions" className="gap-2"><ClipboardCheck className="w-4 h-4" /> Soal</TabsTrigger>
          <TabsTrigger value="modules" className="gap-2"><GraduationCap className="w-4 h-4" /> Modul</TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2"><Award className="w-4 h-4" /> Sertifikat</TabsTrigger>
          <TabsTrigger value="conflicts" className="gap-2"><ShieldAlert className="w-4 h-4" /> Konflik Jabatan</TabsTrigger>
          <TabsTrigger value="innovation" className="gap-2"><Lightbulb className="w-4 h-4" /> Inovasi</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="questions"><AdminQuestions /></TabsContent>
        <TabsContent value="modules"><AdminModules /></TabsContent>
        <TabsContent value="certificates"><AdminCertificates /></TabsContent>
        <TabsContent value="conflicts"><AdminRoleConflicts /></TabsContent>
        <TabsContent value="innovation"><AdminInnovationReview /></TabsContent>
      </Tabs>
    </div>
  );
}
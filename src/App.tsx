import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Courses from "./pages/Courses";
import Analytics from "./pages/Analytics";
import Generator from "./pages/Generator";
import Mentor from "./pages/Mentor";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CorporateDashboard from "./pages/admin/CorporateDashboard";
import AdminPancekVerification from "./pages/admin/AdminPancekVerification";
import Certificates from "./pages/Certificates";
import Leaderboard from "./pages/Leaderboard";
import Projects from "./pages/Projects";
import RiskRegister from "./pages/RiskRegister";
import BudgetTracker from "./pages/BudgetTracker";
import K3Checklist from "./pages/K3Checklist";
import LkutReport from "./pages/LkutReport";
import PerformanceGrade from "./pages/PerformanceGrade";
import ComplianceTracker from "./pages/ComplianceTracker";
import SmapDashboard from "./pages/SmapDashboard";
import Notifications from "./pages/Notifications";
import AdminGuard from "./components/AdminGuard";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Innovation from "./pages/Innovation";
import AdminInnovationReview from "./pages/admin/AdminInnovationReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/assessment" element={<DashboardLayout><Assessment /></DashboardLayout>} />
            <Route path="/courses" element={<DashboardLayout><Courses /></DashboardLayout>} />
            <Route path="/mentor" element={<DashboardLayout><Mentor /></DashboardLayout>} />
            <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/generator" element={<DashboardLayout><Generator /></DashboardLayout>} />
            <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
            <Route path="/certificates" element={<DashboardLayout><Certificates /></DashboardLayout>} />
            <Route path="/leaderboard" element={<DashboardLayout><Leaderboard /></DashboardLayout>} />
            <Route path="/notifications" element={<DashboardLayout><Notifications /></DashboardLayout>} />
            <Route path="/projects" element={<DashboardLayout><Projects /></DashboardLayout>} />
            <Route path="/risk-register" element={<DashboardLayout><RiskRegister /></DashboardLayout>} />
            <Route path="/budget-tracker" element={<DashboardLayout><BudgetTracker /></DashboardLayout>} />
            <Route path="/k3-checklist" element={<DashboardLayout><K3Checklist /></DashboardLayout>} />
            <Route path="/lkut" element={<DashboardLayout><LkutReport /></DashboardLayout>} />
            <Route path="/grading" element={<DashboardLayout><PerformanceGrade /></DashboardLayout>} />
            <Route path="/compliance" element={<DashboardLayout><ComplianceTracker /></DashboardLayout>} />
            <Route path="/smap" element={<DashboardLayout><SmapDashboard /></DashboardLayout>} />
            <Route path="/pancek" element={<DashboardLayout><SmapDashboard /></DashboardLayout>} />
            <Route path="/admin" element={<DashboardLayout><AdminGuard><AdminDashboard /></AdminGuard></DashboardLayout>} />
            <Route path="/corporate" element={<DashboardLayout><AdminGuard><CorporateDashboard /></AdminGuard></DashboardLayout>} />
            <Route path="/admin/pancek" element={<DashboardLayout><AdminGuard><AdminPancekVerification /></AdminGuard></DashboardLayout>} />
            <Route path="/admin/inovasi" element={<DashboardLayout><AdminGuard><AdminInnovationReview /></AdminGuard></DashboardLayout>} />
            <Route path="/inovasi" element={<Innovation />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

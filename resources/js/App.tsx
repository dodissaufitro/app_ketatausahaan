import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/dashboard/Employees";
import Agenda from "./pages/dashboard/Agenda";
import Attendance from "./pages/dashboard/Attendance";
import Leave from "./pages/dashboard/Leave";
import MyLeave from "./pages/dashboard/MyLeave";
import Payroll from "./pages/dashboard/Payroll";
import Users from "./pages/dashboard/Users";
import UserRoles from "./pages/dashboard/UserRoles";
import IncomingMail from "./pages/dashboard/IncomingMail";
import OutgoingMail from "./pages/dashboard/OutgoingMail";
import DokumenPengadaanLangsung from "./pages/dashboard/DokumenPengadaanLangsung";
import Pengadaan from "./pages/dashboard/Pengadaan";
import DokumenChecklistPengadaan from "./pages/dashboard/DokumenChecklistPengadaan";
import AngkutanUmum from "./pages/AngkutanUmum/Index";
import AngkutanUmumCreate from "./pages/AngkutanUmum/Create";
import AngkutanUmumEdit from "./pages/AngkutanUmum/Edit";
import AngkutanUmumShow from "./pages/AngkutanUmum/Show";
import DownloadPermissions from "./pages/admin/DownloadPermissions";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={
          <PermissionGuard permission="manage_employees">
            <Employees />
          </PermissionGuard>
        } />
        <Route path="agenda" element={
          <PermissionGuard permission="manage_agendas">
            <Agenda />
          </PermissionGuard>
        } />
        <Route path="attendance" element={
          <PermissionGuard permission={['manage_attendances', 'view_own_attendance']}>
            <Attendance />
          </PermissionGuard>
        } />
        <Route path="leave" element={
          <PermissionGuard permission={['manage_leaves', 'view_own_leave', 'submit_leave_request']}>
            <Leave />
          </PermissionGuard>
        } />
        <Route path="my-leave" element={
          <PermissionGuard permission={['submit_leave_request', 'view_own_leave']}>
            <MyLeave />
          </PermissionGuard>
        } />
        <Route path="payroll" element={
          <PermissionGuard permission={['manage_payrolls', 'view_own_payroll']}>
            <Payroll />
          </PermissionGuard>
        } />
        <Route path="users" element={
          <PermissionGuard permission="manage_users" role="superadmin">
            <Users />
          </PermissionGuard>
        } />
        <Route path="user-roles" element={
          <PermissionGuard permission="manage_roles" role="superadmin">
            <UserRoles />
          </PermissionGuard>
        } />
        <Route path="download-permissions" element={
          <PermissionGuard role="superadmin">
            <DownloadPermissions />
          </PermissionGuard>
        } />
        <Route path="incoming-mail" element={
          <PermissionGuard permission="manage_incoming_mails">
            <IncomingMail />
          </PermissionGuard>
        } />
        <Route path="outgoing-mail" element={
          <PermissionGuard permission="manage_outgoing_mails">
            <OutgoingMail />
          </PermissionGuard>
        } />
        <Route path="dokumen-pengadaan-langsung" element={
          <PermissionGuard permission="manage_dokumen_pengadaan">
            <DokumenPengadaanLangsung />
          </PermissionGuard>
        } />
        <Route path="pengadaan" element={
          <PermissionGuard permission="manage_pengadaan">
            <Pengadaan />
          </PermissionGuard>
        } />
        <Route path="pengadaan/:id/dokumen-checklist" element={
          <PermissionGuard permission="manage_pengadaan">
            <DokumenChecklistPengadaan />
          </PermissionGuard>
        } />
        <Route path="angkutan-umum" element={<AngkutanUmum />} />
        <Route path="angkutan-umum/create" element={<AngkutanUmumCreate />} />
        <Route path="angkutan-umum/:id" element={<AngkutanUmumShow />} />
        <Route path="angkutan-umum/:id/edit" element={<AngkutanUmumEdit />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

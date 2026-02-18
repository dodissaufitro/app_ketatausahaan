import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DebugUserPermissions } from '@/components/DebugUserPermissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Building2,
  Mail,
  Send,
  Shield,
  UserCog,
  FileText,
  ShoppingCart,
  Bus,
  Download,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Karyawan', href: '/dashboard/employees', icon: Users, permission: 'manage_employees' },
  { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar, permission: 'manage_agendas' },
  { name: 'Kehadiran', href: '/dashboard/attendance', icon: Clock, permission: 'manage_attendances' },
  { name: 'Cuti', href: '/dashboard/leave', icon: Calendar, permissions: ['manage_leaves', 'view_own_leave', 'submit_leave_request'] },
  { name: 'Penggajian', href: '/dashboard/payroll', icon: Wallet, permissions: ['manage_payrolls', 'view_own_payroll'] },
  { name: 'Surat Masuk', href: '/dashboard/incoming-mail', icon: Mail, permission: 'manage_incoming_mails' },
  { name: 'Surat Keluar', href: '/dashboard/outgoing-mail', icon: Send, permission: 'manage_outgoing_mails' },
  // Public access - no permission required
  { name: 'Pengadaan', href: '/dashboard/pengadaan', icon: ShoppingCart },
  { name: 'Dokumen Pengadaan', href: '/dashboard/dokumen-pengadaan-langsung', icon: FileText },
  { name: 'Angkutan Umum', href: '/dashboard/angkutan-umum', icon: Bus, wednesdayOnly: true },
  { 
    name: 'Manajemen Pengguna',
    icon: Shield,
    role: 'superadmin',
    children: [
      { name: 'Daftar Users', href: '/dashboard/users', icon: UserCog },
      { name: 'Role & Hak Akses', href: '/dashboard/user-roles', icon: Shield },
      { name: 'Hak Akses Download', href: '/dashboard/download-permissions', icon: Download },
    ],
  },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  // Check if today is Wednesday (3 = Wednesday in JS)
  const isWednesday = () => {
    return new Date().getDay() === 3;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sidebar-primary/20">
              <Building2 className="h-6 w-6 text-sidebar-primary" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-sidebar-foreground">HRIS Pro</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            // Superadmin bypasses all checks
            const isSuperAdmin = user?.role === 'superadmin';
            
            // Check role-based access
            if (item.role && !isSuperAdmin && user?.role !== item.role) {
              return null;
            }

            // Check permission-based access (skip if superadmin or no permission required)
            // Support both single permission and multiple permissions (any match)
            if (!isSuperAdmin) {
              if (item.permission && !user?.permissions?.includes(item.permission)) {
                return null;
              }
              if ((item as any).permissions) {
                const hasAnyPermission = (item as any).permissions.some((p: string) => 
                  user?.permissions?.includes(p)
                );
                if (!hasAnyPermission) {
                  return null;
                }
              }
            }

            // Check wednesdayOnly for regular users (not admin/superadmin)
            if ((item as any).wednesdayOnly && user?.role === 'user' && !isWednesday()) {
              return null;
            }

            // Handle nested menu
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1">
                  <div className={cn(
                    "flex items-center gap-3 h-11 px-3 font-medium text-sidebar-foreground/50 text-sm",
                    sidebarCollapsed && "justify-center px-2"
                  )}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.children.map((child) => {
                    // Check child permission (skip if superadmin or no permission required)
                    if ((child as any).permission && !isSuperAdmin && !user?.permissions?.includes((child as any).permission)) {
                      return null;
                    }
                    
                    return (
                      <Button
                        key={child.name}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-10 font-medium transition-all pl-11",
                          isActive(child.href)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                        onClick={() => {
                          navigate(child.href);
                          setSidebarOpen(false);
                        }}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        <span>{child.name}</span>
                      </Button>
                    );
                  })}
                </div>
              );
            }

            // Regular menu item
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 font-medium transition-all",
                  sidebarCollapsed && "justify-center px-2",
                  isActive(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Collapse button - desktop only */}
        <div className="hidden lg:block p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              sidebarCollapsed && "px-2"
            )}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              sidebarCollapsed ? "rotate-0" : "rotate-180"
            )} />
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Debug component - only shows in development */}
      <DebugUserPermissions />
    </div>
  );
}

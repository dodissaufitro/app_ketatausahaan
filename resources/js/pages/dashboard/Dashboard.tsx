import { useState, useEffect } from 'react';
import axios from 'axios';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  Mail,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardData {
  stats: {
    totalEmployees: number;
    presentToday: number;
    onLeave: number;
    pendingLeaveRequests: number;
    newHiresThisMonth: number;
    upcomingBirthdays: number;
    unreadMails: number;
    pendingPayrolls: number;
  };
  attendanceData: Array<{
    name: string;
    hadir: number;
    terlambat: number;
    cuti: number;
  }>;
  departmentData: Array<{
    name: string;
    count: number;
  }>;
  pendingLeaves: any[];
  recentAttendance: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang! Berikut ringkasan data hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Karyawan"
          value={data.stats.totalEmployees}
          subtitle="Aktif"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Hadir Hari Ini"
          value={data.stats.presentToday}
          subtitle={`${data.stats.totalEmployees > 0 ? Math.round((data.stats.presentToday / data.stats.totalEmployees) * 100) : 0}% kehadiran`}
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Sedang Cuti"
          value={data.stats.onLeave}
          subtitle="Karyawan"
          icon={Calendar}
          variant="warning"
        />
        <StatsCard
          title="Pengajuan Cuti"
          value={data.stats.pendingLeaveRequests}
          subtitle="Menunggu persetujuan"
          icon={Clock}
          variant="info"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Karyawan Baru"
          value={data.stats.newHiresThisMonth}
          subtitle="Bulan ini"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Surat Masuk"
          value={data.stats.unreadMails}
          subtitle="Belum dibaca"
          icon={Mail}
          variant="warning"
        />
        <StatsCard
          title="Penggajian"
          value={data.stats.pendingPayrolls}
          subtitle="Pending"
          icon={DollarSign}
          variant="info"
        />
        <StatsCard
          title="Hari Ini"
          value={new Date().getDate()}
          subtitle={new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          icon={Calendar}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Kehadiran Mingguan</CardTitle>
            <Badge variant="secondary" className="font-normal">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.attendanceData}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hadir"
                    stroke="hsl(217, 91%, 45%)"
                    fillOpacity={1}
                    fill="url(#colorHadir)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribusi per Departemen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(174, 72%, 40%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pengajuan Cuti Pending</CardTitle>
            <Badge variant="secondary">{data.pendingLeaves.length} pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pendingLeaves.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Tidak ada pengajuan cuti pending
                </p>
              ) : (
                data.pendingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {leave.employeeName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{leave.employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {leave.startDate} - {leave.endDate}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {leave.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Aktivitas Terbaru</CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              Lihat semua <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentAttendance.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Belum ada data kehadiran hari ini
                </p>
              ) : (
                data.recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {record.employeeName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{record.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        Check-in: {record.checkIn}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      record.status === 'present'
                        ? 'default'
                        : record.status === 'late'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      record.status === 'present'
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : record.status === 'late'
                        ? 'bg-warning/10 text-warning hover:bg-warning/20'
                        : ''
                    }
                  >
                    {record.status === 'present'
                      ? 'Hadir'
                      : record.status === 'late'
                      ? 'Terlambat'
                      : 'Absen'}
                  </Badge>
                </div>
              )))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

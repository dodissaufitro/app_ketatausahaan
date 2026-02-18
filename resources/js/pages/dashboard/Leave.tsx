import { useState, useEffect } from 'react';
import axios from 'axios';
import { LeaveRequest } from '@/types/hris';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  CalendarDays,
  Stethoscope,
  User,
  Baby,
} from 'lucide-react';

export default function LeavePage() {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const canManageLeaves = hasPermission('manage_leaves');
  const canSubmitLeave = hasPermission('submit_leave_request') || hasPermission('view_own_leave') || canManageLeaves;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaves', {
        params: {
          status: filterStatus,
        },
      });
      setLeaveList(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data cuti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const filteredLeaves = leaveList.filter((leave) => {
    const matchesSearch =
      leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    pending: leaveList.filter((l) => l.status === 'pending').length,
    approved: leaveList.filter((l) => l.status === 'approved').length,
    rejected: leaveList.filter((l) => l.status === 'rejected').length,
  };

  const leaveTypes = [
    { value: 'annual', label: 'Cuti Tahunan', icon: CalendarDays },
    { value: 'sick', label: 'Cuti Sakit', icon: Stethoscope },
    { value: 'personal', label: 'Cuti Pribadi', icon: User },
    { value: 'maternity', label: 'Cuti Melahirkan', icon: Baby },
  ];

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const config = {
      pending: {
        icon: Clock,
        label: 'Pending',
        className: 'bg-warning/10 text-warning hover:bg-warning/20',
      },
      approved: {
        icon: CheckCircle,
        label: 'Disetujui',
        className: 'bg-success/10 text-success hover:bg-success/20',
      },
      rejected: {
        icon: XCircle,
        label: 'Ditolak',
        className: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
    };
    const { icon: Icon, label, className } = config[status];
    return (
      <Badge variant="secondary" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getTypeBadge = (type: LeaveRequest['type']) => {
    const labels = {
      annual: 'Tahunan',
      sick: 'Sakit',
      personal: 'Pribadi',
      maternity: 'Melahirkan',
      paternity: 'Ayah',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const handleAddLeave = async () => {
    try {
      // For regular users, employee_id will be auto-filled by backend based on user email
      const payload: any = {
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        applied_date: new Date().toISOString().split('T')[0],
      };
      
      // Only include employee_id if user can manage leaves (admin)
      if (canManageLeaves && formData.employee_id) {
        payload.employee_id = formData.employee_id;
      }
      
      await axios.post('/api/leaves', payload);

      await fetchLeaves();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Pengajuan cuti berhasil dibuat',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal membuat pengajuan cuti',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/leaves/${id}/approve`);
      await fetchLeaves();
      toast({
        title: 'Disetujui',
        description: 'Pengajuan cuti telah disetujui dan kehadiran otomatis dibuat',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menyetujui cuti',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.post(`/api/leaves/${id}/reject`);
      await fetchLeaves();
      toast({
        title: 'Ditolak',
        description: 'Pengajuan cuti telah ditolak',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menolak cuti',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      type: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {canManageLeaves ? 'Manajemen Cuti' : 'Cuti Saya'}
          </h1>
          <p className="text-muted-foreground">
            {canManageLeaves ? 'Kelola pengajuan cuti karyawan' : 'Lihat dan ajukan cuti Anda'}
          </p>
        </div>
        {canSubmitLeave && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajukan Cuti
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pengajuan Cuti Baru</DialogTitle>
              <DialogDescription>
                Isi form berikut untuk mengajukan cuti
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {canManageLeaves && (
                <div className="space-y-2">
                  <Label htmlFor="employee_id">ID Karyawan</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="Masukkan ID karyawan (mis: 1, 2, 3)"
                    type="number"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika mengajukan untuk diri sendiri
                  </p>
                </div>
              )}
              {!canManageLeaves && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Mengajukan cuti untuk: <span className="font-medium text-foreground">{user?.name}</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Jenis Cuti</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Selesai</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Alasan</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Jelaskan alasan pengajuan cuti..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button variant="gradient" onClick={handleAddLeave}>
                  Ajukan Cuti
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Pengajuan Cuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageLeaves && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canManageLeaves ? 6 : 5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageLeaves ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pengajuan cuti
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {leave.employeeName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{leave.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {leave.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(leave.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{leave.startDate}</p>
                          <p className="text-muted-foreground">s/d {leave.endDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {leave.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      {canManageLeaves && (
                        <TableCell className="text-right">
                          {leave.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success hover:text-success hover:bg-success/10"
                              onClick={() => handleApprove(leave.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(leave.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

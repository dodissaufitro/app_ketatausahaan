import { useState, useEffect } from 'react';
import axios from 'axios';
import { LeaveRequest } from '@/types/hris';
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
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  CalendarDays,
  Stethoscope,
  User,
  Baby,
  Filter,
} from 'lucide-react';

export default function MyLeavePage() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchMyLeaves = async () => {
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
    fetchMyLeaves();
  }, [filterStatus]);

  const filteredLeaves = leaveList;

  const stats = {
    total: leaveList.length,
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
        label: 'Menunggu',
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

  const handleSubmitLeave = async () => {
    try {
      if (!formData.type || !formData.startDate || !formData.endDate || !formData.reason) {
        toast({
          title: 'Error',
          description: 'Semua field harus diisi',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        applied_date: new Date().toISOString().split('T')[0],
      };

      await axios.post('/api/leaves', payload);

      await fetchMyLeaves();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Pengajuan cuti Anda telah dikirim dan menunggu persetujuan',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengajukan cuti',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cuti Saya</h1>
          <p className="text-muted-foreground">
            Kelola pengajuan cuti Anda dan lihat riwayat cuti
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ajukan Cuti Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pengajuan Cuti Baru</DialogTitle>
              <DialogDescription>
                Isi formulir berikut untuk mengajukan cuti Anda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm text-muted-foreground">
                  Pengajuan untuk: <span className="font-medium text-foreground">{user?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.email}
                </p>
              </div>
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
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Selesai</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {formData.startDate && formData.endDate && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Durasi: </span>
                    <span className="font-medium">{getDuration(formData.startDate, formData.endDate)} hari</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Cuti</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Jelaskan alasan pengajuan cuti Anda..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button variant="gradient" onClick={handleSubmitLeave}>
                  Ajukan Cuti
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Cuti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Menunggu</p>
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

      {/* Filter */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Label>Filter Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave History Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Pengajuan Cuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tanggal Ajuan</TableHead>
                  <TableHead>Jenis Cuti</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Anda belum memiliki riwayat cuti</p>
                        <p className="text-sm text-muted-foreground">
                          Klik tombol "Ajukan Cuti Baru" untuk membuat pengajuan
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{leave.appliedDate}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(leave.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{leave.startDate}</p>
                          <p className="text-muted-foreground text-xs">s/d {leave.endDate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {getDuration(leave.startDate, leave.endDate)} hari
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                      </TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Attendance } from '@/types/hris';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SyncX601Modal } from '@/components/attendance/SyncX601Modal';
import { MonthlySummaryModal } from '@/components/attendance/MonthlySummaryModal';
import { usePermission } from '@/hooks/usePermission';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Cpu,
  User,
  BarChart3,
  CalendarDays,
  Stethoscope,
  Baby,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// ====== CONSTANT JAM KANTOR ======
const JAM_MASUK = "07:30:00";
const JAM_PULANG = "16:30:00";

// ====== HELPER FUNCTION ======
function calculateAttendance(record: Attendance) {
  if (!record.checkIn || !record.checkOut) {
    return {
      workHours: 0,
      status: 'absent' as const,
    };
  }

  const checkIn = record.checkIn;
  const checkOut = record.checkOut;

  // normalisasi jam kerja
  const realMasuk = checkIn < JAM_MASUK ? JAM_MASUK : checkIn;
  const realPulang = checkOut > JAM_PULANG ? JAM_PULANG : checkOut;

  const masuk = new Date(`1970-01-01T${realMasuk}`);
  const pulang = new Date(`1970-01-01T${realPulang}`);

  let diff = (pulang.getTime() - masuk.getTime()) / 1000 / 60 / 60;
  if (diff < 0) diff = 0;

  // status
  let status: Attendance['status'] = 'present';

  const isLate = checkIn > JAM_MASUK;
  const isEarlyLeave = checkOut < JAM_PULANG;

  if (isLate && isEarlyLeave) {
    status = 'half-day';
  } else if (isLate) {
    status = 'late';
  } else if (isEarlyLeave) {
    status = 'half-day';
  } else {
    status = 'present';
  }

  return {
    workHours: parseFloat(diff.toFixed(2)),
    status,
  };
}

// ====== COMPONENT ======
export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'x601' | 'manual'>('x601');
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [monthlySummaryModalOpen, setMonthlySummaryModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Export state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportEmployeeId, setExportEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canManageAttendances = hasPermission('manage_attendances');

  // ====== FETCH DATA ======
  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: filterStatus,
      };
      
      if (filterDate) {
        params.date = filterDate;
      }

      if (filterSource !== 'all') {
        params.source = filterSource;
      }
      
      const response = await axios.get('/api/attendances', { params });
      setAttendanceList(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data kehadiran',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [filterDate, filterStatus, filterSource]);

  // Reset ke halaman 1 saat filter/pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, filterSource, itemsPerPage]);

  // ====== FETCH EMPLOYEES ======
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await axios.get('/api/employees');
      setEmployees(response.data.data || response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data karyawan',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (exportModalOpen) {
      fetchEmployees();
      // Set default dates (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setExportStartDate(firstDay.toISOString().split('T')[0]);
      setExportEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [exportModalOpen]);

  // ====== DOWNLOAD EXCEL ======
  const handleDownloadExcel = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        title: 'Error',
        description: 'Tanggal mulai dan tanggal akhir harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      setDownloadingExcel(true);
      
      const params: any = {
        start_date: exportStartDate,
        end_date: exportEndDate,
      };

      if (exportEmployeeId) {
        params.employee_id = exportEmployeeId;
      }

      const response = await axios.get('/api/attendances/export-excel', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Laporan_Kehadiran.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Berhasil',
        description: 'Data kehadiran berhasil diunduh',
      });

      setExportModalOpen(false);
    } catch (error:any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengunduh data kehadiran',
        variant: 'destructive',
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  // ====== PROSES DATA ======
  const processedAttendance = attendanceList.map((record) => {
    const calc = calculateAttendance(record);
    return {
      ...record,
      workHours: calc.workHours,
      status: calc.status,
    };
  });

  const filteredAttendance = processedAttendance.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / itemsPerPage));
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    present: processedAttendance.filter((a) => a.status === 'present').length,
    late: processedAttendance.filter((a) => a.status === 'late').length,
    absent: processedAttendance.filter((a) => a.status === 'absent').length,
    halfDay: processedAttendance.filter((a) => a.status === 'half-day').length,
  };

  const getStatusBadge = (status: Attendance['status']) => {
    const config = {
      present: {
        icon: CheckCircle,
        label: 'Tepat Waktu',
        className: 'bg-success/10 text-success',
      },
      late: {
        icon: AlertCircle,
        label: 'Terlambat',
        className: 'bg-warning/10 text-warning',
      },
      absent: {
        icon: XCircle,
        label: 'Absen',
        className: 'bg-destructive/10 text-destructive',
      },
      'half-day': {
        icon: Clock,
        label: 'Pulang Cepat',
        className: 'bg-info/10 text-info',
      },
      'on-leave': {
        icon: CalendarDays,
        label: 'Cuti',
        className: 'bg-blue-500/10 text-blue-600',
      },
      'sick-leave': {
        icon: Stethoscope,
        label: 'Sakit',
        className: 'bg-orange-500/10 text-orange-600',
      },
      'personal-leave': {
        icon: User,
        label: 'Izin',
        className: 'bg-purple-500/10 text-purple-600',
      },
      'maternity-leave': {
        icon: Baby,
        label: 'Cuti Melahirkan',
        className: 'bg-pink-500/10 text-pink-600',
      },
      'paternity-leave': {
        icon: Heart,
        label: 'Cuti Ayah',
        className: 'bg-indigo-500/10 text-indigo-600',
      },
    };
    const { icon: Icon, label, className } = config[status] || config.absent;
    return (
      <Badge variant="secondary" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getSourceBadge = (source: Attendance['source']) => {
    const config = {
      x601: {
        icon: Cpu,
        label: 'X601',
        className: 'bg-blue-500/10 text-blue-600',
      },
      manual: {
        icon: User,
        label: 'Manual',
        className: 'bg-gray-500/10 text-gray-600',
      },
      system: {
        icon: AlertCircle,
        label: 'Tidak Hadir',
        className: 'bg-red-500/10 text-red-600',
      },
      leave: {
        icon: CalendarDays,
        label: 'Cuti atau Izin',
        className: 'bg-green-500/10 text-green-600',
      },
    };
    const { icon: Icon, label, className } = config[source] || config.manual;
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleSyncSuccess = () => {
    fetchAttendances();
  };

  return (
    <div className="space-y-6">
      <SyncX601Modal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSuccess={handleSyncSuccess}
      />
      <MonthlySummaryModal
        isOpen={monthlySummaryModalOpen}
        onClose={() => setMonthlySummaryModalOpen(false)}
      />

      {/* Export Excel Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data Kehadiran</DialogTitle>
            <DialogDescription>
              Filter data kehadiran berdasarkan tanggal dan karyawan, lalu unduh dalam format Excel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end-date">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="employee">Karyawan (Opsional)</Label>
              <Select
                value={exportEmployeeId}
                onValueChange={setExportEmployeeId}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Semua Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Karyawan</SelectItem>
                  {loadingEmployees ? (
                    <SelectItem value="" disabled>Loading...</SelectItem>
                  ) : (
                    employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.employee_id} - {emp.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportModalOpen(false)}
              disabled={downloadingExcel}
            >
              Batal
            </Button>
            <Button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel || !exportStartDate || !exportEndDate}
            >
              {downloadingExcel ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Unduh Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kehadiran Karyawan</h1>
          <p className="text-muted-foreground">
            Pantau dan kelola kehadiran harian karyawan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMonthlySummaryModalOpen(true)} className="gap-2">
            <BarChart3 className="h-4 w-4" /> Rangkuman Bulanan
          </Button>
          {canManageAttendances && (
            <Button variant="outline" onClick={() => setSyncModalOpen(true)} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Sinkron X601
            </Button>
          )}
         
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10"><CheckCircle className="h-6 w-6 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10"><AlertCircle className="h-6 w-6 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Terlambat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10"><XCircle className="h-6 w-6 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10"><Clock className="h-6 w-6 text-info" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.halfDay}</p>
                <p className="text-sm text-muted-foreground">Setengah Hari</p>
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
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  type="date"
                  className="w-44"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Tampilkan semua tanggal"
                  >
                    ×
                  </button>
                )}
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="present">Hadir</SelectItem>
                  <SelectItem value="late">Terlambat</SelectItem>
                  <SelectItem value="absent">Absen</SelectItem>
                  <SelectItem value="half-day">Setengah Hari</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={(value) => setFilterSource(value as 'all' | 'x601' | 'manual')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sumber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="x601">X601</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!filterDate && filterSource === 'all' && (
            <p className="text-xs text-muted-foreground mt-2">
              Menampilkan semua data kehadiran. Pilih tanggal atau sumber untuk memfilter.
            </p>
          )}
          {filterSource !== 'all' && (
            <p className="text-xs text-blue-600 mt-2">
              Menampilkan data dari sumber: <strong>{filterSource === 'x601' ? 'Mesin X601' : 'Input Manual'}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Data Kehadiran ({filteredAttendance.length} data)
            {filterSource === 'x601' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                <Cpu className="h-3 w-3 mr-1" />
                Dari Mesin X601
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Jam Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sumber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data kehadiran
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {record.employeeName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <span className={record.checkIn > JAM_MASUK ? 'text-warning font-semibold' : ''}>
                          {record.checkIn || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={record.checkOut < JAM_PULANG ? 'text-warning font-semibold' : ''}>
                          {record.checkOut || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{record.workHours > 0 ? `${record.workHours} jam` : '-'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{getSourceBadge(record.source)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && filteredAttendance.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Baris per halaman:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => setItemsPerPage(Number(v))}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAttendance.length)} dari {filteredAttendance.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
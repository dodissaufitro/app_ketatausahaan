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
import { useToast } from '@/hooks/use-toast';
import { SyncX601Modal } from '@/components/attendance/SyncX601Modal';
import { MonthlySummaryModal } from '@/components/attendance/MonthlySummaryModal';
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
  const { toast } = useToast();

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
    };
    const { icon: Icon, label, className } = config[status];
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
    };
    const { icon: Icon, label, className } = config[source];
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const handleExport = () => {
    toast({
      title: 'Export Data',
      description: 'Data kehadiran sedang diunduh...',
    });
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
          <Button variant="outline" onClick={() => setSyncModalOpen(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Sinkron X601
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export Data
          </Button>
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
                  <TableHead>ID</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data kehadiran
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record) => (
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
                      <TableCell className="font-mono text-sm">{record.employeeId}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
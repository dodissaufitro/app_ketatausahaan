import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Search,
} from 'lucide-react';

interface MonthlySummaryData {
  year: number;
  month: number;
  month_name: string;
  working_days: number;
  employees: EmployeeSummary[];
  generated_at: string;
}

interface EmployeeSummary {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string | null;
  position: string | null;
  stats: {
    present: number;
    late: number;
    absent: number;
    half_day: number;
    total_work_hours: number;
    average_work_hours: number;
  };
  daily_records: any[];
  total_days: number;
  present_percentage: number;
}

interface MonthlySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonthlySummaryModal({ isOpen, onClose }: MonthlySummaryModalProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [nameFilter, setNameFilter] = useState('');
  const [summary, setSummary] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingEmployee, setDownloadingEmployee] = useState<string | null>(null);
  
  // Date range picker dialog state
  const [dateRangeDialogOpen, setDateRangeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const { toast } = useToast();

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i, 1).toLocaleDateString('id-ID', { month: 'long' })
  }));

  const fetchSummary = async () => {
    if (!year || !month) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/attendance-summary/monthly', {
        params: { year, month }
      });
      setSummary(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat rangkuman bulanan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(true);
    try {
      const response = await axios.get('/api/attendances/export-monthly', {
        params: { year, month, format },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `absensi_${year}_${month}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Berhasil',
        description: `File absensi telah didownload`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengunduh file',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadEmployee = (employee: EmployeeSummary) => {
    setSelectedEmployee(employee);
    // Set default date range to current month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setDateRangeDialogOpen(true);
  };

  const handleConfirmDownloadEmployee = async () => {
    if (!selectedEmployee || !customStartDate || !customEndDate) return;

    setDownloadingEmployee(selectedEmployee.employee_id);
    try {
      const response = await axios.get('/api/attendances/export-excel', {
        params: {
          start_date: customStartDate,
          end_date: customEndDate,
          employee_id: selectedEmployee.id,
        },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Laporan_Kehadiran_${selectedEmployee.employee_name.replace(/ /g, '_')}_${customStartDate}_${customEndDate}.xlsx`;
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
        description: `Laporan kehadiran ${selectedEmployee.employee_name} berhasil diunduh`,
      });

      // Close dialog and reset
      setDateRangeDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Gagal mengunduh laporan',
        variant: 'destructive',
      });
    } finally {
      setDownloadingEmployee(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, year, month]);

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-100 text-green-800">Sangat Baik</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-100 text-blue-800">Baik</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Cukup</Badge>;
    return <Badge className="bg-red-100 text-red-800">Perlu Perhatian</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rangkuman Absensi Bulanan
            </DialogTitle>
          </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="year">Tahun</Label>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="month">Bulan</Label>
            <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Filter Nama</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama karyawan..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={fetchSummary} disabled={loading}>
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {/* Export Buttons */}
        {summary && (
          <div className="flex gap-2 mb-6">
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting ? 'Mengunduh...' : 'Download Excel'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {exporting ? 'Mengunduh...' : 'Download CSV'}
            </Button>
          </div>
        )}

        {/* Summary Overview */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.working_days}</p>
                    <p className="text-sm text-muted-foreground">Hari Kerja</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.employees.length}</p>
                    <p className="text-sm text-muted-foreground">Total Karyawan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {summary.employees.reduce((sum, emp) => sum + emp.stats.total_work_hours, 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Jam Kerja</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(summary.employees.reduce((sum, emp) => sum + emp.present_percentage, 0) / summary.employees.length).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Rata-rata Kehadiran</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employee Details Table */}
        {summary && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Karyawan</h3>
            <div className="grid gap-4">
              {summary.employees
                .filter((emp) =>
                  nameFilter.trim() === '' ||
                  emp.employee_name
                    .toLowerCase()
                    .includes(nameFilter.toLowerCase())
                )
                .map((employee) => (
                <Card key={employee.employee_id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{employee.employee_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {employee.employee_id}
                          {employee.department && ` • ${employee.department}`}
                          {employee.position && ` • ${employee.position}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(employee.present_percentage)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadEmployee(employee)}
                          disabled={downloadingEmployee === employee.employee_id}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          {downloadingEmployee === employee.employee_id ? 'Downloading...' : 'Excel'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{employee.stats.present}</div>
                        <div className="text-muted-foreground">Hadir</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{employee.stats.late}</div>
                        <div className="text-muted-foreground">Terlambat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{employee.stats.absent}</div>
                        <div className="text-muted-foreground">Absen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{employee.stats.half_day}</div>
                        <div className="text-muted-foreground">Setengah Hari</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Jam Kerja:</span>
                        <span className="ml-2 font-semibold">{employee.stats.total_work_hours.toFixed(1)} jam</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rata-rata:</span>
                        <span className="ml-2 font-semibold">{employee.stats.average_work_hours.toFixed(1)} jam/hari</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!summary && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Pilih tahun dan bulan untuk melihat rangkuman absensi
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Date Range Picker Dialog */}
    <Dialog open={dateRangeDialogOpen} onOpenChange={setDateRangeDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Rentang Waktu</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selectedEmployee && `Download laporan kehadiran ${selectedEmployee.employee_name}`}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="custom-start-date">Tanggal Mulai</Label>
            <Input
              id="custom-start-date"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custom-end-date">Tanggal Akhir</Label>
            <Input
              id="custom-end-date"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Default: {new Date(year, month - 1, 1).toLocaleDateString('id-ID')} - {new Date(year, month, 0).toLocaleDateString('id-ID')}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDateRangeDialogOpen(false);
              setSelectedEmployee(null);
            }}
            disabled={downloadingEmployee !== null}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirmDownloadEmployee}
            disabled={downloadingEmployee !== null || !customStartDate || !customEndDate}
          >
            {downloadingEmployee ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Unduh Excel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
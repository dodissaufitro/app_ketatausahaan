import { useState, useEffect } from 'react';
import axios from 'axios';
import { Payroll } from '@/types/hris';
import { usePermission } from '@/hooks/usePermission';
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
import {
  Search,
  Download,
  Filter,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

export default function PayrollPage() {
  const { hasPermission } = usePermission();
  const canManagePayrolls = hasPermission('manage_payrolls');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollList, setPayrollList] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payrolls', {
        params: {
          month: filterMonth,
          status: filterStatus,
        },
      });
      setPayrollList(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data penggajian',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [filterMonth, filterStatus]);

  const filteredPayroll = payrollList.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPayroll = payrollList.reduce((sum, p) => sum + p.netSalary, 0);
  const totalAllowances = payrollList.reduce((sum, p) => sum + p.allowances, 0);
  const totalDeductions = payrollList.reduce(
    (sum, p) => sum + p.deductions + (p.lateDeductions || 0),
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Payroll['status']) => {
    const config = {
      pending: {
        icon: Clock,
        label: 'Pending',
        className: 'bg-warning/10 text-warning hover:bg-warning/20',
      },
      processed: {
        icon: FileText,
        label: 'Diproses',
        className: 'bg-info/10 text-info hover:bg-info/20',
      },
      paid: {
        icon: CheckCircle,
        label: 'Dibayar',
        className: 'bg-success/10 text-success hover:bg-success/20',
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

  const handleProcessPayroll = async (id: string) => {
    try {
      await axios.post(`/api/payrolls/${id}/mark-as-paid`);
      await fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Penggajian telah diproses',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memproses penggajian',
        variant: 'destructive',
      });
    }
  };

  const handlePayPayroll = async (id: string) => {
    try {
      await axios.post(`/api/payrolls/${id}/mark-as-paid`);
      await fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Penggajian telah dibayar',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal membayar gaji',
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/payrolls/process-all', {
        month: filterMonth,
      });
      await fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: `Penggajian berhasil dibuat untuk ${response.data.count} karyawan`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal membuat penggajian',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export Data',
      description: 'Data penggajian sedang diunduh...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penggajian</h1>
          <p className="text-muted-foreground">
            Kelola penggajian bulanan karyawan (Gaji otomatis dari data karyawan)
          </p>
        </div>
        <div className="flex gap-2">
          {canManagePayrolls && (
            <Button variant="gradient" onClick={handleGeneratePayroll}>
              <Wallet className="h-4 w-4 mr-2" />
              Generate Payroll
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md gradient-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-foreground/80">Total Gaji Bulan Ini</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPayroll)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary-foreground/20">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tunjangan</p>
                <p className="text-2xl font-bold mt-1 text-success">
                  {formatCurrency(totalAllowances)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Potongan</p>
                <p className="text-2xl font-bold mt-1 text-destructive">
                  {formatCurrency(totalDeductions)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      {canManagePayrolls && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Cara Kerja Penggajian</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Gaji dasar diambil otomatis dari data karyawan</li>
                  <li>• Potongan keterlambatan: Rp 50.000 per jam keterlambatan</li>
                  <li>• Potongan absen: Gaji harian per hari absen (gaji/22 hari kerja)</li>
                  <li>• Jam standar masuk: 08:00 (terlambat dihitung dari jam ini)</li>
                  <li>• Klik "Generate Payroll" untuk membuat slip gaji bulan ini</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Input
                type="month"
                className="w-44"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Diproses</SelectItem>
                  <SelectItem value="paid">Dibayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Data Penggajian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Gaji Pokok</TableHead>
                  <TableHead className="text-right">Tunjangan</TableHead>
                  <TableHead className="text-right">Potongan</TableHead>
                  <TableHead className="text-right">Gaji Bersih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                ) : filteredPayroll.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data penggajian
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayroll.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {record.employeeName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.month}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        +{formatCurrency(record.allowances)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        <div className="space-y-0.5">
                          <div className="font-medium">
                            -{formatCurrency(record.deductions + record.lateDeductions + record.absentDeductions)}
                          </div>
                          {(record.lateDeductions > 0 || record.absentDeductions > 0) && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {record.lateDeductions > 0 && (
                                <div>Terlambat: {record.lateCount}× ({record.lateHours}j) = {formatCurrency(record.lateDeductions)}</div>
                              )}
                              {record.absentDeductions > 0 && (
                                <div>Absen: {record.absentCount}× = {formatCurrency(record.absentDeductions)}</div>
                              )}
                              {record.deductions > 0 && (
                                <div>Lainnya: {formatCurrency(record.deductions)}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(record.netSalary)}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                      {record.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-info hover:text-info hover:bg-info/10"
                          onClick={() => handleProcessPayroll(record.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Proses
                        </Button>
                      )}
                      {record.status === 'processed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:text-success hover:bg-success/10"
                          onClick={() => handlePayPayroll(record.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Bayar
                        </Button>
                      )}
                      </TableCell>
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

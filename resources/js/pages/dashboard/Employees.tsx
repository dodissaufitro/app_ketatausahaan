import { useState, useEffect } from 'react';
import { Employee } from '@/types/hris';
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
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Filter,
} from 'lucide-react';
import axios from 'axios';

interface AvailableUser {
  id: number;
  name: string;
  email: string;
}

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextEmployeeId, setNextEmployeeId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    user_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    join_date: '',
  });

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      const data = response.data.map((emp: any) => ({
        id: emp.id.toString(),
        employeeId: emp.employee_id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        position: emp.position,
        joinDate: emp.join_date,
        status: emp.status,
        salary: parseFloat(emp.salary),
        avatar: emp.avatar,
      }));
      setEmployeeList(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data karyawan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNextEmployeeId = async () => {
    try {
      const response = await axios.get('/api/employees/next-id/get');
      setNextEmployeeId(response.data.next_id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mendapatkan ID karyawan',
        variant: 'destructive',
      });
    }
  };

  const departments = [...new Set(employeeList.map((e) => e.department))];

  const filteredEmployees = employeeList.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      filterDepartment === 'all' || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get('/api/employees/available-users/list');
      console.log('Available users response:', response.data);
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast({
        title: 'Error',
        description: `Gagal memuat daftar user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleAddEmployee = async () => {
    try {
      if (!formData.user_id) {
        toast({
          title: 'Error',
          description: 'Pilih user terlebih dahulu',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.name) {
        toast({
          title: 'Error',
          description: 'Masukkan nama karyawan',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.email) {
        toast({
          title: 'Error',
          description: 'Masukkan email karyawan',
          variant: 'destructive',
        });
        return;
      }

      const response = await axios.post('/api/employees', {
        user_id: parseInt(formData.user_id),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        join_date: formData.join_date || new Date().toISOString().split('T')[0],
        status: 'active',
        salary: parseFloat(formData.salary) || 0,
      });

      await fetchEmployees();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Karyawan baru berhasil ditambahkan',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menambahkan karyawan',
        variant: 'destructive',
      });
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;

    try {
      await axios.put(`/api/employees/${editingEmployee.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        join_date: formData.join_date,
        status: 'active',
        salary: parseFloat(formData.salary) || 0,
      });

      await fetchEmployees();
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Data karyawan berhasil diperbarui',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memperbarui karyawan',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) return;

    try {
      await axios.delete(`/api/employees/${id}`);
      await fetchEmployees();
      toast({
        title: 'Berhasil',
        description: 'Karyawan berhasil dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus karyawan',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employeeId,
      user_id: '',
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      salary: employee.salary.toString(),
      join_date: employee.joinDate,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      user_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: '',
      join_date: '',
    });
  };

  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      active: 'bg-success/10 text-success hover:bg-success/20',
      inactive: 'bg-muted text-muted-foreground',
      'on-leave': 'bg-warning/10 text-warning hover:bg-warning/20',
    };
    const labels = {
      active: 'Aktif',
      inactive: 'Tidak Aktif',
      'on-leave': 'Cuti',
    };
    return (
      <Badge variant="secondary" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Karyawan</h1>
          <p className="text-muted-foreground">
            Kelola data karyawan perusahaan Anda
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            resetForm();
            fetchNextEmployeeId();
            fetchAvailableUsers();
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Karyawan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Karyawan Baru</DialogTitle>
              <DialogDescription>
                Isi form berikut untuk menambahkan karyawan baru
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="next_employee_id">ID Karyawan (Otomatis)</Label>
                <Input
                  id="next_employee_id"
                  value={nextEmployeeId}
                  disabled
                  className="bg-muted font-mono"
                  placeholder="Loading..."
                />
                <p className="text-xs text-muted-foreground">
                  ID akan dibuat otomatis saat menyimpan
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 xxx-xxxx-xxxx"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departemen</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Masukkan departemen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posisi</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Masukkan posisi"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="join_date">Tanggal Bergabung</Label>
                  <Input
                    id="join_date"
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Gaji Pokok</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}>
                  Batal
                </Button>
                <Button variant="gradient" onClick={handleAddEmployee}>
                  Tambah Karyawan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, email, atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">
            Daftar Karyawan ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Karyawan</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gaji</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {employee.department}
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Karyawan</DialogTitle>
            <DialogDescription>
              Perbarui data karyawan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_employee_id">ID Karyawan</Label>
                <Input
                  id="edit_employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="EMP001"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nama</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">No. Telepon</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 xxx-xxxx-xxxx"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_department">Departemen</Label>
                <Input
                  id="edit_department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Masukkan departemen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_position">Posisi</Label>
                <Input
                  id="edit_position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Masukkan posisi"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_join_date">Tanggal Bergabung</Label>
                <Input
                  id="edit_join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_salary">Gaji Pokok</Label>
                <Input
                  id="edit_salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEmployee(null);
                resetForm();
              }}>
                Batal
              </Button>
              <Button variant="gradient" onClick={handleEditEmployee}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

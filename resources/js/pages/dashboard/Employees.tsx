import { useState, useEffect } from 'react';
import { Employee, UserRole } from '@/types/hris';
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

// Add custom CSS for 3D animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(1deg); }
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-1deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.5), 0 0 30px rgba(14, 165, 233, 0.3); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .neumorphism {
    background: #f0f0f0;
    box-shadow: 20px 20px 60px #cbcbcb, -20px -20px 60px #ffffff;
  }
  
  .dark .neumorphism {
    background: #2d3748;
    box-shadow: 20px 20px 60px #252a35, -20px -20px 60px #35405b;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'employee-3d-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
  }
}

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
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
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
    username: '',
    password: '',
    role: 'employee',
    user_role_id: '',
    create_user: true,
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

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get('/api/employees/available-users/list');
      setAvailableUsers(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar user',
        variant: 'destructive',
      });
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get('/api/user-roles');
      setUserRoles(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data user roles',
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

  const handleAddEmployee = async () => {
    try {
      if (!formData.name || !formData.email) {
        toast({
          title: 'Error',
          description: 'Nama dan email wajib diisi',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        join_date: formData.join_date || new Date().toISOString().split('T')[0],
        status: 'active',
        salary: parseFloat(formData.salary) || 0,
        role: formData.role,
        username: formData.username,
        password: formData.password,
        user_role_id: formData.user_role_id,
      };

      const response = await axios.post('/api/employees', payload);

      await fetchEmployees();
      setIsAddDialogOpen(false);
      resetForm();
      
      if (response.data.default_password) {
        toast({
          title: 'Berhasil',
          description: `Karyawan baru berhasil ditambahkan! Password default: "${response.data.default_password}"`,
          duration: 8000,
        });
      } else {
        toast({
          title: 'Berhasil',
          description: 'Karyawan berhasil ditambahkan',
        });
      }
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
      username: '',
      password: '',
      role: 'employee',
      user_role_id: '',
      create_user: false,
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
      username: '',
      password: '',
      role: 'employee',
      user_role_id: '',
      create_user: true,
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
      {/* Enhanced Page Header with 3D Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-sky-500/12 to-teal-500/12 rounded-2xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition-all duration-300 shadow-lg">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-teal-600 bg-clip-text text-transparent">
                Manajemen Karyawan
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                🏢 Kelola data karyawan dengan sistem profesional
              </p>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-2 right-2 w-8 h-8 bg-sky-400/20 rounded-full animate-float"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 bg-teal-400/20 rounded-full animate-float-delayed"></div>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <div className="flex justify-center">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            resetForm();
            fetchNextEmployeeId();
            fetchAvailableUsers();
            fetchUserRoles();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="h-14 px-8 bg-gradient-to-r from-blue-500 via-sky-500 to-teal-500 hover:from-blue-600 hover:via-sky-600 hover:to-teal-600 text-white font-bold transform hover:scale-110 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group animate-pulse-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center transform group-hover:rotate-180 transition-transform duration-500">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-lg">Tambah Karyawan Baru</span>
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-sky-500 to-teal-500 -m-6 mb-6 p-8">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        Tambah Karyawan Baru
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-sky-200 rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-teal-200 rounded-full animate-pulse delay-200"></div>
                        </div>
                      </DialogTitle>
                      <DialogDescription className="text-blue-100">
                        Isi form berikut untuk menambahkan karyawan baru dengan desain profesional
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-float-delayed"></div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-200px)] pr-2 space-y-6">
              {/* Employee ID Card with 3D Effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 transform group-hover:scale-105"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">ID</span>
                    </div>
                    <div className="flex-1">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        🏷️ ID Karyawan (Otomatis Generated)
                      </Label>
                      <Input
                        value={nextEmployeeId}
                        disabled
                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 font-mono text-lg border-2 border-dashed border-blue-400 mt-2"
                        placeholder="Loading..."
                      />
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        ⚡ ID akan dibuat otomatis saat menyimpan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Data Section with 3D Cards */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                      <span className="text-white text-lg">👤</span>
                    </div>
                    Data Karyawan
                    <div className="flex-1 h-px bg-gradient-to-r from-teal-400 to-blue-500"></div>
                  </h3>
                  
                  <div className="space-y-6">
                    {/* First Row - Name & Email */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          ✨ Nama Lengkap <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Masukkan nama lengkap"
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all duration-300 group-hover/field:shadow-lg"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-slate-600 transition-colors">
                            👨‍💼
                          </div>
                        </div>
                      </div>
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          📧 Email <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="nama@company.com"
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all duration-300 group-hover/field:shadow-lg"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-slate-600 transition-colors">
                            📬
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone, Department, Position */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          📱 No. Telepon
                        </Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+62 8xx-xxxx-xxxx"
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 group-hover/field:shadow-lg"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-green-500 transition-all duration-300">
                            📞
                          </div>
                        </div>
                      </div>
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          🏢 Departemen <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="IT, HR, Marketing, etc."
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 group-hover/field:shadow-lg"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-indigo-500 transition-all duration-300">
                            🏭
                          </div>
                        </div>
                      </div>
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          💼 Posisi <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            placeholder="Manager, Developer, etc."
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-300 group-hover/field:shadow-lg"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-violet-500 transition-all duration-300">
                            👔
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date & Salary */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          📅 Tanggal Bergabung
                        </Label>
                        <div className="relative">
                          <Input
                            id="join_date"
                            type="date"
                            value={formData.join_date}
                            onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 group-hover/field:shadow-lg"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-orange-500 transition-all duration-300">
                            🗓️
                          </div>
                        </div>
                      </div>
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          💰 Gaji Pokok
                        </Label>
                        <div className="relative">
                          <Input
                            id="salary"
                            type="number"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            placeholder="5000000"
                            className="pl-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 group-hover/field:shadow-lg"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/field:text-emerald-500 transition-all duration-300">
                            💵
                          </div>
                          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                            Rp
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Account Section */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                      <span className="text-white text-lg">🔐</span>
                    </div>
                    Akun Login (Opsional)
                    <div className="flex-1 h-px bg-gradient-to-r from-sky-400 to-blue-500"></div>
                  </h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 p-6 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">ℹ️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sistem akan membuat akun user secara otomatis
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email sebagai username • Password default: <span className="font-mono font-bold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">password123</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-4">
                    <div className="group/select">
                      <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                        🎯 Role Sistem
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 group-hover/select:shadow-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="employee">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">👨‍💼</span>
                              <div>
                                <div className="font-semibold">Employee</div>
                                <div className="text-xs text-gray-500">Employee Access (Default)</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">👤</span>
                              <div>
                                <div className="font-semibold">User</div>
                                <div className="text-xs text-gray-500">Basic Access</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">⚡</span>
                              <div>
                                <div className="font-semibold">Admin</div>
                                <div className="text-xs text-gray-500">Management Access</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="superadmin">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">👑</span>
                              <div>
                                <div className="font-semibold">Super Admin</div>
                                <div className="text-xs text-gray-500">Full Access</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Username & Password */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          👤 Username (Opsional)
                        </Label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Kosongkan untuk gunakan email"
                          className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all duration-300 group-hover/field:shadow-lg"
                        />
                      </div>
                      <div className="group/field">
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          🔐 Password (Opsional)
                        </Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min. 6 karakter"
                          className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all duration-300 group-hover/field:shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                  className="h-12 px-8 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <span className="mr-2">❌</span>
                  Batal
                </Button>
                <Button 
                  onClick={handleAddEmployee}
                  className="h-12 px-8 bg-gradient-to-r from-blue-500 via-sky-500 to-teal-500 hover:from-blue-600 hover:via-sky-600 hover:to-teal-600 text-white font-bold transform hover:scale-105 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    <span className="text-lg">➕</span>
                    Tambah Karyawan
                  </span>
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
              <Button onClick={handleEditEmployee}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
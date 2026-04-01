import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types/hris';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    user_role_id: '',
    is_active: true,
  });

  useEffect(() => {
    console.log('Users component mounted');
    fetchUsers();
    fetchUserRoles();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users with filters:', { filterRole, filterStatus });
      const response = await axios.get('/api/users', {
        params: {
          role: filterRole !== 'all' ? filterRole : undefined,
          is_active: filterStatus !== 'all' ? filterStatus : undefined,
        },
      });
      console.log('Users response received:', response.data);
      console.log('Number of users:', response.data?.length);
      setUsers(response.data || []);
      console.log('Users state updated');
    } catch (error: any) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengambil data users',
        variant: 'destructive',
      });
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get('/api/user-roles');
      console.log('User roles fetched:', response.data);
      setUserRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data user roles',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEdit(true);
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        user_role_id: user.userRoleId || '',
        is_active: user.isActive,
      });
    } else {
      setIsEdit(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        user_role_id: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setIsEdit(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEdit && selectedUser) {
        await axios.put(`/api/users/${selectedUser.id}`, formData);
        toast({
          title: 'Berhasil',
          description: 'User berhasil diupdate',
        });
      } else {
        await axios.post('/api/users', formData);
        toast({
          title: 'Berhasil',
          description: 'User berhasil ditambahkan',
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menyimpan data user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      await axios.delete(`/api/users/${id}`);
      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus user',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axios.post(`/api/users/${id}/toggle-status`);
      toast({
        title: 'Berhasil',
        description: 'Status user berhasil diupdate',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengupdate status',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadge = (role: User['role']) => {
    const config = {
      superadmin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700' },
      admin: { label: 'Admin', className: 'bg-blue-100 text-blue-700' },
      user: { label: 'User', className: 'bg-gray-100 text-gray-700' },
      employee: { label: 'Employee', className: 'bg-green-100 text-green-700' },
    };
    const { label, className } = config[role] || config.user;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Kelola akun user dan hak akses</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari user..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>User Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Tidak ada data user
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.userRoleName || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={user.isActive ? 'bg-success/10 text-success' : ''}
                      >
                        {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          className={user.isActive ? 'text-warning' : 'text-success'}
                        >
                          {user.isActive ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit User' : 'Tambah User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama<span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="email">Email<span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">
                Password<span className="text-destructive">*</span> {isEdit && <span className="text-muted-foreground text-sm">(kosongkan jika tidak diubah)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔐 Role & Hak Akses
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Role Sistem<span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Super Admin</span>
                          <span className="text-xs text-muted-foreground">- Full Access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Admin</span>
                          <span className="text-xs text-muted-foreground">- Management Access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">User</span>
                          <span className="text-xs text-muted-foreground">- Basic Access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="employee">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Employee</span>
                          <span className="text-xs text-muted-foreground">- Employee Access</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role sistem untuk kontrol akses dasar
                  </p>
                </div>

                <div>
                  <Label htmlFor="user_role_id">Role Akses Custom (Opsional)</Label>
                  <Select
                    value={formData.user_role_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, user_role_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role akses custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Tidak menggunakan role custom</span>
                      </SelectItem>
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.displayName}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role custom dengan permissions spesifik (jika diperlukan)
                  </p>
                  
                  {formData.user_role_id && formData.user_role_id !== 'none' && (() => {
                    const selectedRole = userRoles.find(r => r.id === formData.user_role_id);
                    return selectedRole ? (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-semibold mb-2">Permissions yang dimiliki:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRole.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Aktifkan user setelah dibuat
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                User yang tidak aktif tidak dapat login ke sistem
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {isEdit ? 'Update User' : 'Tambah User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

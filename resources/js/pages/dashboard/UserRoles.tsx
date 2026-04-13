import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/hris';

export default function UserRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchUserRoles();
    fetchPermissions();
  }, []);

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/user-roles');
      setUserRoles(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('/api/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleOpenDialog = (role?: UserRole) => {
    if (role) {
      setIsEdit(true);
      setSelectedRole(role);
      setFormData({
        name: role.name,
        display_name: role.displayName,
        description: role.description || '',
        permissions: role.permissions || [],
        is_active: role.isActive,
      });
    } else {
      setIsEdit(false);
      setSelectedRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRole(null);
    setIsEdit(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEdit && selectedRole) {
        await axios.put(`/api/user-roles/${selectedRole.id}`, formData);
        toast({
          title: 'Berhasil',
          description: 'Role berhasil diupdate',
        });
      } else {
        await axios.post('/api/user-roles', formData);
        toast({
          title: 'Berhasil',
          description: 'Role berhasil ditambahkan',
        });
      }
      handleCloseDialog();
      fetchUserRoles();
      // Refresh permissions user yang login jika rolenya berubah
      refreshUser();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menyimpan data role',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus role ini?')) return;

    try {
      await axios.delete(`/api/user-roles/${id}`);
      toast({
        title: 'Berhasil',
        description: 'Role berhasil dihapus',
      });
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus role',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const filteredRoles = userRoles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Roles</h1>
          <p className="text-muted-foreground">Kelola role dan permissions</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari role..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Role</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data role
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.displayName}</p>
                        <p className="text-sm text-muted-foreground">{role.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm line-clamp-2">{role.description || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.permissions.length} permissions</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{role.usersCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.isActive ? 'default' : 'secondary'}
                        className={role.isActive ? 'bg-success/10 text-success' : ''}
                      >
                        {role.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(role.id)}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Role' : 'Tambah Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name (key)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="admin, manager, etc"
                disabled={isEdit}
              />
            </div>
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Administrator, Manager, etc"
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi role"
                rows={3}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 mt-2 space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(permissions).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData.permissions.includes(key)}
                      onCheckedChange={() => handlePermissionToggle(key)}
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

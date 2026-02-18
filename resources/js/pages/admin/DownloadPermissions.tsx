import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Shield, Users, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display?: string;
  can_download: boolean;
}

export default function DownloadPermissions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedModule, setSelectedModule] = useState('angkutan_umum');
  const [loading, setLoading] = useState(false);

  // Only allow superadmin
  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">
            Hanya Super Admin yang dapat mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, [selectedModule]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/download-permissions', {
        params: { module: selectedModule }
      });
      setUsers(response.data.users);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memuat data user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (userId: number, canDownload: boolean) => {
    try {
      await axios.post('/api/download-permissions/update', {
        user_id: userId,
        module: selectedModule,
        can_download: canDownload
      });

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, can_download: canDownload } : u
      ));

      toast({
        title: 'Berhasil',
        description: `Permission download ${canDownload ? 'diberikan' : 'dicabut'} untuk user ini`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengupdate permission',
        variant: 'destructive',
      });
    }
  };

  const moduleOptions = [
    { value: 'angkutan_umum', label: 'Angkutan Umum' },
    { value: 'employees', label: 'Data Karyawan' },
    { value: 'attendance', label: 'Data Kehadiran' },
    { value: 'payroll', label: 'Data Penggajian' },
    { value: 'agenda', label: 'Data Agenda' },
    { value: 'leave', label: 'Data Cuti' },
    { value: 'incoming_mail', label: 'Surat Masuk' },
    { value: 'outgoing_mail', label: 'Surat Keluar' },
    { value: 'pengadaan', label: 'Data Pengadaan' },
    { value: 'dokumen_pengadaan', label: 'Dokumen Pengadaan' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Download Permissions</h1>
          <p className="text-muted-foreground">
            Atur hak akses download untuk semua level user pada modul tertentu
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem mendukung semua role yang ada (admin, user, dan role custom lainnya)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Super Admin Only</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manajemen Permission Download
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="module-select">Modul:</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Can Download</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">Tidak ada user ditemukan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((userItem, index) => (
                      <TableRow key={userItem.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{userItem.name}</TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              userItem.role === 'admin' 
                                ? 'bg-blue-100 text-blue-800' 
                                : userItem.role === 'user'
                                ? 'bg-green-100 text-green-800'
                                : userItem.role.includes('manager') || userItem.role.includes('supervisor')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {userItem.role_display || userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {userItem.can_download ? (
                              <Download className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={userItem.can_download}
                              onCheckedChange={(checked) => 
                                updatePermission(userItem.id, checked)
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm">Informasi Permission</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Semua level user (admin, user, dan role custom) dapat diberikan permission download</li>
                <li>• <strong>Super Admin</strong> selalu memiliki akses download tanpa perlu permission</li>
                <li>• Permission dapat diatur per-modul untuk kontrol yang lebih granular</li>
                <li>• Toggle permission akan langsung tersimpan secara otomatis</li>
                <li>• Permission bersifat per-modul (Angkutan Umum, Attendance, dll)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
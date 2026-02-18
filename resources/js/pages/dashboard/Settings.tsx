import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [companySettings, setCompanySettings] = useState({
    name: 'PT Teknologi Indonesia',
    email: 'info@teknologi.co.id',
    phone: '+62 21 1234 5678',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan',
    website: 'https://teknologi.co.id',
  });

  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+62 812 3456 7890',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    leaveRequests: true,
    attendanceAlerts: true,
    payrollReminders: true,
    newEmployees: false,
  });

  const handleSaveCompany = () => {
    toast({
      title: 'Berhasil',
      description: 'Pengaturan perusahaan berhasil disimpan',
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: 'Berhasil',
      description: 'Profil berhasil diperbarui',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Berhasil',
      description: 'Pengaturan notifikasi berhasil disimpan',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengaturan aplikasi dan profil Anda
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Perusahaan
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Perusahaan
              </CardTitle>
              <CardDescription>
                Kelola informasi dasar perusahaan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nama Perusahaan</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email Perusahaan</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyEmail"
                      type="email"
                      className="pl-10"
                      value={companySettings.email}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">No. Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyPhone"
                      className="pl-10"
                      value={companySettings.phone}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyWebsite"
                      className="pl-10"
                      value={companySettings.website}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, website: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Alamat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="companyAddress"
                    className="pl-10 min-h-20"
                    value={companySettings.address}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, address: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSaveCompany}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Saya
              </CardTitle>
              <CardDescription>
                Kelola informasi profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Nama Lengkap</Label>
                  <Input
                    id="profileName"
                    value={profileSettings.name}
                    onChange={(e) =>
                      setProfileSettings({ ...profileSettings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email</Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) =>
                      setProfileSettings({ ...profileSettings, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">No. Telepon</Label>
                  <Input
                    id="profilePhone"
                    value={profileSettings.phone}
                    onChange={(e) =>
                      setProfileSettings({ ...profileSettings, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>
                Kelola preferensi notifikasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Notifikasi Email</p>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi melalui email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Pengajuan Cuti</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat ada pengajuan cuti baru
                    </p>
                  </div>
                  <Switch
                    checked={notifications.leaveRequests}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, leaveRequests: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Alert Kehadiran</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi untuk keterlambatan atau ketidakhadiran
                    </p>
                  </div>
                  <Switch
                    checked={notifications.attendanceAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, attendanceAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Pengingat Penggajian</p>
                    <p className="text-sm text-muted-foreground">
                      Pengingat untuk proses penggajian bulanan
                    </p>
                  </div>
                  <Switch
                    checked={notifications.payrollReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, payrollReminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Karyawan Baru</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat ada karyawan baru bergabung
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newEmployees}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newEmployees: checked })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>
                Kelola keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="gradient">
                  <Save className="h-4 w-4 mr-2" />
                  Ubah Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

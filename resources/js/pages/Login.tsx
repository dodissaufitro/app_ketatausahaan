import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Lock, Mail, ArrowRight, Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang di HRIS Dashboard',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login Gagal',
          description: 'Email atau password salah',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-sidebar-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-sidebar-primary/20 backdrop-blur-sm">
              <Building2 className="h-10 w-10" />
            </div>
            <span className="text-3xl font-bold">HRIS Pro</span>
          </div>
          
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Kelola SDM Perusahaan<br />dengan Mudah & Efisien
          </h1>
          
          <p className="text-lg text-sidebar-foreground/80 mb-8 max-w-md">
            Sistem Manajemen Sumber Daya Manusia terintegrasi untuk mengelola karyawan, kehadiran, cuti, dan penggajian dalam satu platform.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Users, label: 'Manajemen Karyawan' },
              { icon: Lock, label: 'Keamanan Data' },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-sidebar-accent/50 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-sidebar-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 rounded-xl gradient-primary">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">HRIS Pro</span>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Selamat Datang</CardTitle>
              <CardDescription className="text-center">
                Masuk ke akun Anda untuk melanjutkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  variant="gradient"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Masuk
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium">Admin:</span> admin@company.com / admin123</p>
                  <p><span className="font-medium">HR:</span> hr@company.com / hr123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

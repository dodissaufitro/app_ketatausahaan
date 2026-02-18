import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface Props {
  auth: any;
}

const JABATAN_OPTIONS = [
  'Staff',
  'Supervisor',
  'Manager',
  'Kepala Bagian',
  'Kepala Divisi',
  'Direktur',
  'Sekretaris',
  'Administrasi',
  'Teknisi',
  'Operator',
  'Analis',
  'Konsultan',
  'Koordinator',
  'Asisten',
  'Lainnya',
];

export default function Create() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [data, setData] = useState({
    nama_lengkap: '',
    tanggal_pelaksanaan: '',
    jabatan: '',
    angkutan_umum_digunakan: '',
    foto_timestamp_keberangkatan: null as File | null,
    foto_timestamp_kepulangan: null as File | null,
  });

  // Auto-fill data from logged in user
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      nama_lengkap: user?.employee?.name || user?.name || '',
      tanggal_pelaksanaan: today,
      jabatan: user?.employee?.position || '',
    }));
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    const formData = new FormData();
    formData.append('nama_lengkap', data.nama_lengkap);
    formData.append('tanggal_pelaksanaan', data.tanggal_pelaksanaan);
    formData.append('jabatan', data.jabatan);
    formData.append('angkutan_umum_digunakan', data.angkutan_umum_digunakan);
    if (data.foto_timestamp_keberangkatan) {
      formData.append('foto_timestamp_keberangkatan', data.foto_timestamp_keberangkatan);
    }
    if (data.foto_timestamp_kepulangan) {
      formData.append('foto_timestamp_kepulangan', data.foto_timestamp_kepulangan);
    }
    
    try {
      await axios.post('/api/angkutan-umum', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'Berhasil',
        description: 'Data berhasil ditambahkan',
      });
      navigate('/dashboard/angkutan-umum');
    } catch (error: any) {
      setErrors(error.response?.data?.errors || {});
      toast({
        title: 'Error',
        description: 'Gagal menambahkan data',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Tambah Data Angkutan Umum</h2>
      </div>
      <div className="py-4">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/dashboard/angkutan-umum')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Form Tambah Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                  <Input
                    id="nama_lengkap"
                    value={data.nama_lengkap}
                    onChange={(e) => setData({ ...data, nama_lengkap: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    readOnly
                    className="bg-gray-50"
                    required
                  />
                  {errors.nama_lengkap && (
                    <p className="text-sm text-red-600">{errors.nama_lengkap}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Nama terisi otomatis dari data karyawan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_pelaksanaan">
                    Tanggal Pelaksanaan *
                  </Label>
                  <Input
                    id="tanggal_pelaksanaan"
                    type="date"
                    value={data.tanggal_pelaksanaan}
                    onChange={(e) =>
                      setData({ ...data, tanggal_pelaksanaan: e.target.value })
                    }
                    readOnly
                    className="bg-gray-50"
                    required
                  />
                  {errors.tanggal_pelaksanaan && (
                    <p className="text-sm text-red-600">
                      {errors.tanggal_pelaksanaan}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Tanggal terisi otomatis dengan hari ini
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <Select
                    value={data.jabatan}
                    onValueChange={(value) => setData({ ...data, jabatan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {JABATAN_OPTIONS.map((jabatan) => (
                        <SelectItem key={jabatan} value={jabatan}>
                          {jabatan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jabatan && (
                    <p className="text-sm text-red-600">{errors.jabatan}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Jabatan terisi otomatis dari data karyawan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="angkutan_umum_digunakan">
                    Angkutan Umum Yang Digunakan *
                  </Label>
                  <Input
                    id="angkutan_umum_digunakan"
                    value={data.angkutan_umum_digunakan}
                    onChange={(e) =>
                      setData({ ...data, angkutan_umum_digunakan: e.target.value })
                    }
                    placeholder="Contoh: Bus, Kereta, Angkot, dll"
                    required
                  />
                  {errors.angkutan_umum_digunakan && (
                    <p className="text-sm text-red-600">
                      {errors.angkutan_umum_digunakan}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto_timestamp_keberangkatan">
                    Foto Timestamp Keberangkatan
                  </Label>
                  <Input
                    id="foto_timestamp_keberangkatan"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setData({
                        ...data,
                        foto_timestamp_keberangkatan: e.target.files?.[0] || null,
                      })
                    }
                  />
                  {errors.foto_timestamp_keberangkatan && (
                    <p className="text-sm text-red-600">
                      {errors.foto_timestamp_keberangkatan}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Format: JPG, PNG, JPEG. Maksimal 2MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto_timestamp_kepulangan">
                    Foto Timestamp Kepulangan
                  </Label>
                  <Input
                    id="foto_timestamp_kepulangan"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setData({
                        ...data,
                        foto_timestamp_kepulangan: e.target.files?.[0] || null,
                      })
                    }
                  />
                  {errors.foto_timestamp_kepulangan && (
                    <p className="text-sm text-red-600">
                      {errors.foto_timestamp_kepulangan}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Format: JPG, PNG, JPEG. Maksimal 2MB
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/angkutan-umum')}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

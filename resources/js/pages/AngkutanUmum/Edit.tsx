import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface AngkutanUmumData {
  id: number;
  nama_lengkap: string;
  tanggal_pelaksanaan: string;
  jabatan: string;
  angkutan_umum_digunakan: string;
  foto_timestamp_keberangkatan: string | null;
  foto_timestamp_kepulangan: string | null;
}

interface Props {
  auth: any;
  angkutanUmum: AngkutanUmumData;
}

export default function Edit() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [angkutanUmum, setAngkutanUmum] = useState<AngkutanUmumData | null>(null);
  const [data, setData] = useState({
    nama_lengkap: '',
    tanggal_pelaksanaan: '',
    jabatan: '',
    angkutan_umum_digunakan: '',
    foto_timestamp_keberangkatan: null as File | null,
    foto_timestamp_kepulangan: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/angkutan-umum/${id}`);
      const item = response.data.angkutanUmum;
      setAngkutanUmum(item);
      
      // Set tanggal pelaksanaan ke hari ini
      const today = new Date().toISOString().split('T')[0];
      
      setData({
        nama_lengkap: item.nama_lengkap,
        tanggal_pelaksanaan: today,
        jabatan: item.jabatan,
        angkutan_umum_digunakan: item.angkutan_umum_digunakan,
        foto_timestamp_keberangkatan: null,
        foto_timestamp_kepulangan: null,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    }
  };

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
      await axios.post(`/api/angkutan-umum/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'Berhasil',
        description: 'Data berhasil diperbarui',
      });
      navigate('/dashboard/angkutan-umum');
    } catch (error: any) {
      setErrors(error.response?.data?.errors || {});
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!angkutanUmum) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Edit Data Angkutan Umum</h2>
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
                <CardTitle>Form Edit Data</CardTitle>
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
                    required
                  />
                  {errors.nama_lengkap && (
                    <p className="text-sm text-red-600">{errors.nama_lengkap}</p>
                  )}
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
                    Tanggal otomatis diubah ke hari ini
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <Input
                    id="jabatan"
                    value={data.jabatan}
                    onChange={(e) => setData({ ...data, jabatan: e.target.value })}
                    placeholder="Masukkan jabatan"
                    required
                  />
                  {errors.jabatan && (
                    <p className="text-sm text-red-600">{errors.jabatan}</p>
                  )}
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
                  {angkutanUmum.foto_timestamp_keberangkatan && (
                    <div className="mb-2">
                      <img
                        src={`/storage/${angkutanUmum.foto_timestamp_keberangkatan}`}
                        alt="Foto Keberangkatan"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Foto saat ini
                      </p>
                    </div>
                  )}
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
                    Format: JPG, PNG, JPEG. Maksimal 2MB. Biarkan kosong jika
                    tidak ingin mengubah foto.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto_timestamp_kepulangan">
                    Foto Timestamp Kepulangan
                  </Label>
                  {angkutanUmum.foto_timestamp_kepulangan && (
                    <div className="mb-2">
                      <img
                        src={`/storage/${angkutanUmum.foto_timestamp_kepulangan}`}
                        alt="Foto Kepulangan"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Foto saat ini
                      </p>
                    </div>
                  )}
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
                    Format: JPG, PNG, JPEG. Maksimal 2MB. Biarkan kosong jika
                    tidak ingin mengubah foto.
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
                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
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

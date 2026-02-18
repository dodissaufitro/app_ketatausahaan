import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AngkutanUmumData {
  id: number;
  nama_lengkap: string;
  tanggal_pelaksanaan: string;
  jabatan: string;
  angkutan_umum_digunakan: string;
  foto_timestamp_keberangkatan: string | null;
  foto_timestamp_kepulangan: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  auth: any;
  angkutanUmum: AngkutanUmumData;
}

export default function Show() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [angkutanUmum, setAngkutanUmum] = useState<AngkutanUmumData | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/angkutan-umum/${id}`);
      setAngkutanUmum(response.data.angkutanUmum);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        <h2 className="text-2xl font-bold">Detail Data Angkutan Umum</h2>
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
                <CardTitle>Detail Informasi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nama Lengkap
                  </label>
                  <p className="mt-1 text-lg">{angkutanUmum.nama_lengkap}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tanggal Pelaksanaan
                  </label>
                  <p className="mt-1 text-lg">
                    {format(
                      new Date(angkutanUmum.tanggal_pelaksanaan),
                      'dd MMMM yyyy',
                      { locale: idLocale }
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Jabatan
                  </label>
                  <p className="mt-1 text-lg">{angkutanUmum.jabatan}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Angkutan Umum Yang Digunakan
                  </label>
                  <p className="mt-1 text-lg">
                    {angkutanUmum.angkutan_umum_digunakan}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">
                    Foto Timestamp Keberangkatan
                  </label>
                  {angkutanUmum.foto_timestamp_keberangkatan ? (
                    <img
                      src={`/storage/${angkutanUmum.foto_timestamp_keberangkatan}`}
                      alt="Foto Keberangkatan"
                      className="w-full max-w-md rounded-lg border shadow-sm"
                    />
                  ) : (
                    <p className="text-gray-400">Tidak ada foto</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">
                    Foto Timestamp Kepulangan
                  </label>
                  {angkutanUmum.foto_timestamp_kepulangan ? (
                    <img
                      src={`/storage/${angkutanUmum.foto_timestamp_kepulangan}`}
                      alt="Foto Kepulangan"
                      className="w-full max-w-md rounded-lg border shadow-sm"
                    />
                  ) : (
                    <p className="text-gray-400">Tidak ada foto</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Dibuat pada:</span>{' '}
                    {format(
                      new Date(angkutanUmum.created_at),
                      'dd MMMM yyyy HH:mm',
                      { locale: idLocale }
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Terakhir diubah:</span>{' '}
                    {format(
                      new Date(angkutanUmum.updated_at),
                      'dd MMMM yyyy HH:mm',
                      { locale: idLocale }
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/angkutan-umum')}
                >
                  Kembali
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/dashboard/angkutan-umum/${angkutanUmum.id}/edit`)
                  }
                >
                  Edit Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

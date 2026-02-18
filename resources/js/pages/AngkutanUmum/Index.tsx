import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Plus, Edit, Trash2, Eye, Image, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: AngkutanUmumData[];
}

interface Props {
  angkutanUmum: PaginationData;
  auth: any;
}

export default function Index() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [angkutanUmum, setAngkutanUmum] = useState<PaginationData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [canDownload, setCanDownload] = useState(false);

  const isRegularUser = user?.role === 'user';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    fetchData(currentPage);
    checkDownloadPermission();
  }, [currentPage]);

  const fetchData = async (page: number) => {
    try {
      const response = await axios.get(`/api/angkutan-umum?page=${page}`);
      setAngkutanUmum(response.data.angkutanUmum);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    }
  };

  const checkDownloadPermission = async () => {
    try {
      const response = await axios.get('/api/download-permissions/check', {
        params: { module: 'angkutan_umum' }
      });
      setCanDownload(response.data.can_download);
    } catch (error) {
      console.error('Failed to check download permission:', error);
      setCanDownload(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await axios.delete(`/api/angkutan-umum/${id}`);
        toast({
          title: 'Berhasil',
          description: 'Data berhasil dihapus',
        });
        fetchData(currentPage);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal menghapus data',
          variant: 'destructive',
        });
      }
    }
  };

  const handleExport = () => {
    if (canDownload) {
      setShowExportDialog(true);
    } else {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki permission untuk download.',
        variant: 'destructive',
      });
    }
  };

  const handleExportWithDate = () => {
    let url = '/api/angkutan-umum/export';
    const params = new URLSearchParams();

    if (exportDateFrom) params.append('date_from', exportDateFrom);
    if (exportDateTo) params.append('date_to', exportDateTo);

    if (params.toString()) {
      url += '?' + params.toString();
    }

    window.location.href = url;
    setShowExportDialog(false);
    setExportDateFrom('');
    setExportDateTo('');
    toast({
      title: 'Export PDF Berhasil',
      description: 'File PDF dengan foto sedang diunduh. Filter tanggal telah diterapkan.',
    });
  };

  const viewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageDialog(true);
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
        <h2 className="text-2xl font-bold">Data Penggunaan Angkutan Umum</h2>
      </div>
      <div className="py-4">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Penggunaan Angkutan Umum</CardTitle>
              <div className="flex gap-2">
                {canDownload && (
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF (Filter Tanggal)
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/dashboard/angkutan-umum/create')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Tanggal Pelaksanaan</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Angkutan Umum Yang Digunakan</TableHead>
                      <TableHead>Foto Keberangkatan</TableHead>
                      <TableHead>Foto Kepulangan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {angkutanUmum.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      angkutanUmum.data.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {(angkutanUmum.current_page - 1) *
                              angkutanUmum.per_page +
                              index +
                              1}
                          </TableCell>
                          <TableCell>{item.nama_lengkap}</TableCell>
                          <TableCell>
                            {format(
                              new Date(item.tanggal_pelaksanaan),
                              'dd MMMM yyyy',
                              { locale: idLocale }
                            )}
                          </TableCell>
                          <TableCell>{item.jabatan}</TableCell>
                          <TableCell>{item.angkutan_umum_digunakan}</TableCell>
                          <TableCell>
                            {item.foto_timestamp_keberangkatan ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  viewImage(
                                    `/storage/${item.foto_timestamp_keberangkatan}`
                                  )
                                }
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.foto_timestamp_kepulangan ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  viewImage(
                                    `/storage/${item.foto_timestamp_kepulangan}`
                                  )
                                }
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(`/dashboard/angkutan-umum/${item.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!isRegularUser && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/dashboard/angkutan-umum/${item.id}/edit`)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {angkutanUmum.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {Array.from({ length: angkutanUmum.last_page }, (_, i) => (
                    <Button
                      key={i + 1}
                      variant={
                        angkutanUmum.current_page === i + 1
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Date Filter Dialog - For Users with Download Permission */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Tanggal Export</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date_from">Tanggal Dari</Label>
              <Input
                id="date_from"
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date_to">Tanggal Hingga</Label>
              <Input
                id="date_to"
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Kosongkan untuk export semua data
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleExportWithDate}>
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview Foto</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

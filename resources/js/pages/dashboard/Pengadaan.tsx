import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, User, DollarSign, Calendar, FileText } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Pengadaan {
  id: number;
  belanja_operasi: string;
  jumlah_anggaran: number;
  tanggal: string;
  jenis_pengadaan: string;
  pptk_id: number | null;
  asn_id: number | null;
  non_asn_id: number | null;
  pptk?: User;
  asn?: User;
  non_asn?: User;
  created_at: string;
  updated_at: string;
}

export default function Pengadaan() {
  const navigate = useNavigate();
  const [pengadaan, setPengadaan] = useState<Pengadaan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedPengadaan, setSelectedPengadaan] = useState<Pengadaan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    belanja_operasi: '',
    jumlah_anggaran: '',
    tanggal: '',
    jenis_pengadaan: '',
    pptk_id: '',
    asn_id: '',
    non_asn_id: '',
  });

  useEffect(() => {
    fetchPengadaan();
    fetchUsers();
  }, []);

  const fetchPengadaan = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pengadaan', {
        params: { search: searchTerm },
      });
      setPengadaan(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/pengadaan/users');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPengadaan();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenDialog = (item?: Pengadaan) => {
    if (item) {
      setIsEdit(true);
      setSelectedPengadaan(item);
      setFormData({
        belanja_operasi: item.belanja_operasi,
        jumlah_anggaran: item.jumlah_anggaran.toString(),
        tanggal: item.tanggal,
        jenis_pengadaan: item.jenis_pengadaan,
        pptk_id: item.pptk_id?.toString() || '',
        asn_id: item.asn_id?.toString() || '',
        non_asn_id: item.non_asn_id?.toString() || '',
      });
    } else {
      setIsEdit(false);
      setSelectedPengadaan(null);
      setFormData({
        belanja_operasi: '',
        jumlah_anggaran: '',
        tanggal: '',
        jenis_pengadaan: '',
        pptk_id: '',
        asn_id: '',
        non_asn_id: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEdit(false);
    setSelectedPengadaan(null);
    setFormData({
      belanja_operasi: '',
      jumlah_anggaran: '',
      tanggal: '',
      jenis_pengadaan: '',
      pptk_id: '',
      asn_id: '',
      non_asn_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const dataToSend = {
        ...formData,
        jumlah_anggaran: parseFloat(formData.jumlah_anggaran),
        pptk_id: formData.pptk_id ? parseInt(formData.pptk_id) : null,
        asn_id: formData.asn_id ? parseInt(formData.asn_id) : null,
        non_asn_id: formData.non_asn_id ? parseInt(formData.non_asn_id) : null,
      };

      if (isEdit && selectedPengadaan) {
        await axios.put(`/api/pengadaan/${selectedPengadaan.id}`, dataToSend);
        toast({
          title: 'Berhasil',
          description: 'Pengadaan berhasil diperbarui',
        });
      } else {
        await axios.post('/api/pengadaan', dataToSend);
        toast({
          title: 'Berhasil',
          description: 'Pengadaan berhasil ditambahkan',
        });
      }

      handleCloseDialog();
      fetchPengadaan();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengadaan ini?')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/pengadaan/${id}`);
      toast({
        title: 'Berhasil',
        description: 'Pengadaan berhasil dihapus',
      });
      fetchPengadaan();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Pengadaan</h1>
          <p className="text-muted-foreground">Kelola data pengadaan barang dan jasa</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Pengadaan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari belanja operasi, jenis pengadaan..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Belanja Operasi</TableHead>
                  <TableHead>Jenis Pengadaan</TableHead>
                  <TableHead>Jumlah Anggaran</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>PPTK</TableHead>
                  <TableHead>ASN</TableHead>
                  <TableHead>Non ASN</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pengadaan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Belum ada data pengadaan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pengadaan.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.belanja_operasi}</TableCell>
                      <TableCell>{item.jenis_pengadaan}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(item.jumlah_anggaran)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.pptk ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.pptk.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.asn ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.asn.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.non_asn ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.non_asn.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"                            onClick={() => navigate(`/dashboard/pengadaan/${item.id}/dokumen-checklist`)}
                            title="Checklist Dokumen"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Pengadaan' : 'Tambah Pengadaan Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="belanja_operasi">Belanja Operasi *</Label>
              <Input
                id="belanja_operasi"
                value={formData.belanja_operasi}
                onChange={(e) => setFormData({ ...formData, belanja_operasi: e.target.value })}
                placeholder="Masukkan nama belanja operasi"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_pengadaan">Jenis Pengadaan *</Label>
                <Input
                  id="jenis_pengadaan"
                  value={formData.jenis_pengadaan}
                  onChange={(e) => setFormData({ ...formData, jenis_pengadaan: e.target.value })}
                  placeholder="Contoh: Barang, Jasa, Konstruksi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah_anggaran">Jumlah Anggaran (Rp) *</Label>
                <Input
                  id="jumlah_anggaran"
                  type="number"
                  step="0.01"
                  value={formData.jumlah_anggaran}
                  onChange={(e) => setFormData({ ...formData, jumlah_anggaran: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pptk_id">PPTK (Pejabat Pembuat Komitmen)</Label>
              <Select
                value={formData.pptk_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, pptk_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih PPTK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={`pptk-${user.id}`} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asn_id">ASN (Aparatur Sipil Negara)</Label>
                <Select
                  value={formData.asn_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, asn_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ASN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={`asn-${user.id}`} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="non_asn_id">Non ASN</Label>
                <Select
                  value={formData.non_asn_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, non_asn_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Non ASN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={`non-asn-${user.id}`} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

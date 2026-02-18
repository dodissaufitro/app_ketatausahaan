import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Download, FileText, Calendar, Check, ChevronsUpDown } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Pengadaan {
  id: number;
  belanja_operasi: string;
  jenis_pengadaan: string;
}

interface DokumenPengadaan {
  id: number;
  pengadaan_id: number | null;
  no: number | null;
  dokumen: string;
  file: string | null;
  tanggal: string;
  nomor: string;
  keterangan: string | null;
  pengadaan?: Pengadaan;
  created_at: string;
  updated_at: string;
}

export default function DokumenPengadaanLangsung() {
  const [dokumen, setDokumen] = useState<DokumenPengadaan[]>([]);
  const [pengadaan, setPengadaan] = useState<Pengadaan[]>([]);
  const [pengadaanOpen, setPengadaanOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedDokumen, setSelectedDokumen] = useState<DokumenPengadaan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    pengadaan_id: '',
    no: '',
    dokumen: '',
    file: null as File | null,
    tanggal: '',
    nomor: '',
    keterangan: '',
  });

  useEffect(() => {
    fetchDokumen();
    fetchPengadaan();
  }, []);

  const fetchDokumen = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dokumen-pengadaan-langsung', {
        params: { search: searchTerm },
      });
      setDokumen(response.data);
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

  const fetchPengadaan = async () => {
    try {
      const response = await axios.get('/api/dokumen-pengadaan-langsung/pengadaan');
      setPengadaan(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memuat data pengadaan',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDokumen();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenDialog = (dokumen?: DokumenPengadaan) => {
    if (dokumen) {
      setIsEdit(true);
      setSelectedDokumen(dokumen);
      setFormData({
        pengadaan_id: dokumen.pengadaan_id?.toString() || '',
        no: dokumen.no?.toString() || '',
        dokumen: dokumen.dokumen,
        file: null,
        tanggal: dokumen.tanggal,
        nomor: dokumen.nomor,
        keterangan: dokumen.keterangan || '',
      });
    } else {
      setIsEdit(false);
      setSelectedDokumen(null);
      setFormData({
        pengadaan_id: '',
        no: '',
        dokumen: '',
        file: null,
        tanggal: '',
        nomor: '',
        keterangan: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEdit(false);
    setSelectedDokumen(null);
    setFormData({
      pengadaan_id: '',
      no: '',
      dokumen: '',
      file: null,
      tanggal: '',
      nomor: '',
      keterangan: '',
    });
  };

  const handlePengadaanChange = (pengadaanId: string) => {
    setFormData({ ...formData, pengadaan_id: pengadaanId });
    
    // Auto-fill no from pengadaan ID
    if (pengadaanId && pengadaanId !== "none") {
      setFormData({ ...formData, pengadaan_id: pengadaanId, no: pengadaanId });
    } else {
      setFormData({ ...formData, pengadaan_id: '', no: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      if (formData.pengadaan_id) formDataToSend.append('pengadaan_id', formData.pengadaan_id);
      if (formData.no) formDataToSend.append('no', formData.no);
      formDataToSend.append('dokumen', formData.dokumen);
      if (formData.file) formDataToSend.append('file', formData.file);
      formDataToSend.append('tanggal', formData.tanggal);
      formDataToSend.append('nomor', formData.nomor);
      if (formData.keterangan) formDataToSend.append('keterangan', formData.keterangan);

      if (isEdit && selectedDokumen) {
        await axios.post(`/api/dokumen-pengadaan-langsung/${selectedDokumen.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil diperbarui',
        });
      } else {
        await axios.post('/api/dokumen-pengadaan-langsung', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil ditambahkan',
        });
      }

      handleCloseDialog();
      fetchDokumen();
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
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/dokumen-pengadaan-langsung/${id}`);
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil dihapus',
      });
      fetchDokumen();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus dokumen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleDownload = (filePath: string) => {
    window.open(`/storage/${filePath}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dokumen Pengadaan Langsung</h1>
          <p className="text-muted-foreground">Kelola dokumen pengadaan langsung</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Dokumen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari dokumen, nomor..."
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
                  <TableHead className="w-[60px]">No</TableHead>
                  <TableHead>Pengadaan</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Keterangan</TableHead>
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
                ) : dokumen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Belum ada dokumen</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  dokumen.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.no || index + 1}</TableCell>
                      <TableCell>
                        {item.pengadaan ? (
                          <div className="text-sm">
                            <div className="font-medium">{item.pengadaan.belanja_operasi}</div>
                            <div className="text-muted-foreground">{item.pengadaan.jenis_pengadaan}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.dokumen}</TableCell>
                      <TableCell>{item.nomor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.file ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.file!)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.keterangan || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pengadaan_id">Pilih Pengadaan (Opsional)</Label>
              <Popover open={pengadaanOpen} onOpenChange={setPengadaanOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pengadaanOpen}
                    className="w-full justify-between"
                  >
                    {formData.pengadaan_id && formData.pengadaan_id !== "none"
                      ? pengadaan.find((item) => item.id.toString() === formData.pengadaan_id)
                          ? `${pengadaan.find((item) => item.id.toString() === formData.pengadaan_id)?.belanja_operasi} - ${pengadaan.find((item) => item.id.toString() === formData.pengadaan_id)?.jenis_pengadaan}`
                          : "Pilih pengadaan..."
                      : "Pilih pengadaan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari pengadaan..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Tidak ada pengadaan ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handlePengadaanChange("");
                            setPengadaanOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.pengadaan_id || formData.pengadaan_id === "none" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Tidak ada
                        </CommandItem>
                        {pengadaan.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.belanja_operasi} ${item.jenis_pengadaan}`}
                            onSelect={() => {
                              handlePengadaanChange(item.id.toString());
                              setPengadaanOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.pengadaan_id === item.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.belanja_operasi}</span>
                              <span className="text-sm text-muted-foreground">{item.jenis_pengadaan}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no">No Urut (Auto dari Pengadaan)</Label>
                <Input
                  id="no"
                  type="number"
                  value={formData.no}
                  onChange={(e) => setFormData({ ...formData, no: e.target.value })}
                  placeholder="Otomatis terisi dari pengadaan"
                  disabled={!!formData.pengadaan_id && formData.pengadaan_id !== "none"}
                />
              </div>
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
              <Label htmlFor="dokumen">Nama Dokumen *</Label>
              <Input
                id="dokumen"
                value={formData.dokumen}
                onChange={(e) => setFormData({ ...formData, dokumen: e.target.value })}
                placeholder="Masukkan nama dokumen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomor">Nomor Dokumen *</Label>
              <Input
                id="nomor"
                value={formData.nomor}
                onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                placeholder="Masukkan nomor dokumen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File (PDF, DOC, XLS - Max 5MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />
              {isEdit && selectedDokumen?.file && (
                <p className="text-sm text-muted-foreground">
                  File saat ini: {selectedDokumen.file.split('/').pop()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Masukkan keterangan (opsional)"
                rows={4}
              />
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

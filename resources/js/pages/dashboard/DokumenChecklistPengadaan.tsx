import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Upload, Download, Trash2, Calendar, FileText, Check, X, CheckCircle2, AlertCircle, FileCheck, Package } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Pengadaan {
  id: number;
  belanja_operasi: string;
  jenis_pengadaan: string;
  jumlah_anggaran: number;
  tanggal: string;
}

interface DokumenItem {
  id?: number;
  kategori: string;
  no_urut: number;
  nama_dokumen: string;
  pihak_penanggung_jawab: string;
  file_soft_copy: File | string | null;
  tanggal: string;
  nomor: string;
  keterangan: string;
  is_conditional: boolean;
  conditional_note?: string;
}

export default function DokumenChecklistPengadaan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pengadaan, setPengadaan] = useState<Pengadaan | null>(null);
  const [dokumenList, setDokumenList] = useState<DokumenItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPengadaan();
      fetchDokumenItems();
    }
  }, [id]);

  const fetchDokumenItems = async () => {
    // Selalu initialize template lengkap terlebih dahulu
    const fullTemplate = getFullTemplate();
    
    try {
      const response = await axios.get(`/api/dokumen-checklist-items/pengadaan/${id}`);
      
      if (response.data && response.data.length > 0) {
        // Merge template dengan data dari database
        const mergedList = fullTemplate.map(template => {
          // Cari apakah ada data untuk item ini di database
          const savedItem = response.data.find((item: any) => 
            item.kategori === template.kategori && item.no_urut === template.no_urut
          );
          
          if (savedItem) {
            // Jika ada, gunakan data dari database
            return {
              ...template,
              ...savedItem,
              file_soft_copy: savedItem.file_soft_copy || null,
            };
          }
          
          // Jika tidak ada, gunakan template kosong
          return {
            ...template,
            file_soft_copy: null,
            tanggal: '',
            nomor: '',
            keterangan: '',
          };
        });
        
        setDokumenList(mergedList);
      } else {
        // Jika tidak ada data sama sekali, gunakan template kosong
        setDokumenList(fullTemplate.map(doc => ({
          ...doc,
          file_soft_copy: null,
          tanggal: '',
          nomor: '',
          keterangan: '',
        })));
      }
    } catch (error) {
      // Jika error, gunakan template kosong
      setDokumenList(fullTemplate.map(doc => ({
        ...doc,
        file_soft_copy: null,
        tanggal: '',
        nomor: '',
        keterangan: '',
      })));
    }
  };

  const getFullTemplate = () => {
    const umum: Omit<DokumenItem, 'id' | 'file_soft_copy' | 'tanggal' | 'nomor' | 'keterangan'>[] = [
      { kategori: 'Umum', no_urut: 1, nama_dokumen: 'Cover', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 2, nama_dokumen: 'Surat Perjanjian/ Kontrak/ SPK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 3, nama_dokumen: 'SSUK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 4, nama_dokumen: 'SSKK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 5, nama_dokumen: 'SPMK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 6, nama_dokumen: 'SPPBJ', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 7, nama_dokumen: 'DPA/ DPPA', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 8, nama_dokumen: 'RBA', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 9, nama_dokumen: 'SiRUP', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 10, nama_dokumen: 'SK KPA', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 11, nama_dokumen: 'SK PPK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 12, nama_dokumen: 'SK PPTK', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 13, nama_dokumen: 'SK Tim Pendukung', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 14, nama_dokumen: 'SK Penunjukan PP', pihak_penanggung_jawab: 'PA', is_conditional: false },
      { kategori: 'Umum', no_urut: 15, nama_dokumen: 'Kerangka Acuan Kerja (KAK)', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 16, nama_dokumen: 'Rencana Anggaran Biaya (RAB)', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 17, nama_dokumen: 'Harga Perkiraan Sendiri (HPS)', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 18, nama_dokumen: 'Riwayat Harga Perkiraan Sendiri (RHPS)', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 19, nama_dokumen: 'Spesifikasi Teknis/ Outline Spesification', pihak_penanggung_jawab: 'PPK', is_conditional: true, conditional_note: 'Conditional LPSE' },
      { kategori: 'Umum', no_urut: 20, nama_dokumen: 'Surat Permohonan Pengadaan Barang/Jasa', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Umum', no_urut: 21, nama_dokumen: 'Company Profile', pihak_penanggung_jawab: 'Penyedia', is_conditional: false },
    ];

    const katalog: Omit<DokumenItem, 'id' | 'file_soft_copy' | 'tanggal' | 'nomor' | 'keterangan'>[] = [
      { kategori: 'Katalog/Mini Kompetisi', no_urut: 1, nama_dokumen: 'Surat Pesanan', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Katalog/Mini Kompetisi', no_urut: 2, nama_dokumen: 'Cetak Pesanan', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Katalog/Mini Kompetisi', no_urut: 3, nama_dokumen: 'BA Nego', pihak_penanggung_jawab: 'PPK', is_conditional: false },
    ];

    const pengadaanLangsung: Omit<DokumenItem, 'id' | 'file_soft_copy' | 'tanggal' | 'nomor' | 'keterangan'>[] = [
      { kategori: 'Pengadaan Langsung', no_urut: 1, nama_dokumen: 'BA Referensi Calon Penyedia', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Pengadaan Langsung', no_urut: 2, nama_dokumen: 'Dokumen Pemilihan Pengadaan Langsung', pihak_penanggung_jawab: 'PP', is_conditional: false },
      { kategori: 'Pengadaan Langsung', no_urut: 3, nama_dokumen: 'Dokumen Penawaran Administrasi dan Teknis', pihak_penanggung_jawab: 'Penyedia', is_conditional: true, conditional_note: 'Komplit' },
      { kategori: 'Pengadaan Langsung', no_urut: 4, nama_dokumen: 'Berita Acara Pembukaan Dokumen Penawaran', pihak_penanggung_jawab: 'PP', is_conditional: false },
      { kategori: 'Pengadaan Langsung', no_urut: 5, nama_dokumen: 'Berita Acara Evaluasi Dokumen Penawaran', pihak_penanggung_jawab: 'PP', is_conditional: false },
      { kategori: 'Pengadaan Langsung', no_urut: 6, nama_dokumen: 'Berita Acara Pembuktian Kualifikasi', pihak_penanggung_jawab: 'PP', is_conditional: true, conditional_note: '- Daftar Hadir Penyedia Jasa (digabung) - Lampiran Klarifikasi/ Negosiasi Teknis dan Biaya' },
      { kategori: 'Pengadaan Langsung', no_urut: 7, nama_dokumen: 'Berita Acara Negosiasi Teknis dan Biaya', pihak_penanggung_jawab: 'PP', is_conditional: false },
      { kategori: 'Pengadaan Langsung', no_urut: 8, nama_dokumen: 'Berita Acara Hasil Pengadaan Langsung', pihak_penanggung_jawab: 'PP', is_conditional: false },
    ];

    const lelang: Omit<DokumenItem, 'id' | 'file_soft_copy' | 'tanggal' | 'nomor' | 'keterangan'>[] = [
      { kategori: 'Lelang', no_urut: 1, nama_dokumen: 'Bill of Quantity (BQ)', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Lelang', no_urut: 2, nama_dokumen: 'Timeline', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Lelang', no_urut: 3, nama_dokumen: 'Undangan Reviu', pihak_penanggung_jawab: 'Pokja', is_conditional: false },
      { kategori: 'Lelang', no_urut: 4, nama_dokumen: 'Logbook Reviu', pihak_penanggung_jawab: 'Pokja', is_conditional: false },
      { kategori: 'Lelang', no_urut: 5, nama_dokumen: 'Berita Acara Reviu', pihak_penanggung_jawab: 'PPK', is_conditional: false },
      { kategori: 'Lelang', no_urut: 6, nama_dokumen: 'Dokumen Kualifikasi', pihak_penanggung_jawab: 'Pokja', is_conditional: false },
      { kategori: 'Lelang', no_urut: 7, nama_dokumen: 'Surat Penetapan (Pemenang)', pihak_penanggung_jawab: 'Pokja', is_conditional: false },
      { kategori: 'Lelang', no_urut: 8, nama_dokumen: 'BA Klarifikasi & Negosiasi Teknis & Biaya Lelang (Seleksi)', pihak_penanggung_jawab: 'Pokja', is_conditional: true },
      { kategori: 'Lelang', no_urut: 9, nama_dokumen: 'BA Hasil Lelang (Seleksi)', pihak_penanggung_jawab: 'Pokja', is_conditional: false },
    ];

    return [...umum, ...katalog, ...pengadaanLangsung, ...lelang];
  };

  const fetchPengadaan = async () => {
    try {
      const response = await axios.get(`/api/pengadaan/${id}`);
      setPengadaan(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memuat data pengadaan',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (index: number, fileType: 'soft' | 'hard', file: File | null) => {
    if (!file) return;

    const item = dokumenList[index];
    const formData = new FormData();
    formData.append('file_soft_copy', file);

    try {
      setLoading(true);

      let response;
      if (item.id) {
        // Update existing item
        response = await axios.post(`/api/dokumen-checklist-items/${item.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Create new item with file
        const itemData = new FormData();
        itemData.append('pengadaan_id', id!);
        itemData.append('kategori', item.kategori);
        itemData.append('no_urut', item.no_urut.toString());
        itemData.append('nama_dokumen', item.nama_dokumen);
        itemData.append('pihak_penanggung_jawab', item.pihak_penanggung_jawab);
        itemData.append('file_soft_copy', file);
        itemData.append('tanggal', item.tanggal || '');
        itemData.append('nomor', item.nomor || '');
        itemData.append('keterangan', item.keterangan || '');
        itemData.append('is_conditional', item.is_conditional ? '1' : '0');
        if (item.conditional_note) itemData.append('conditional_note', item.conditional_note);

        response = await axios.post('/api/dokumen-checklist-items', itemData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Update local state
      const newList = [...dokumenList];
      newList[index] = response.data;
      setDokumenList(newList);

      toast({
        title: 'Berhasil',
        description: 'File berhasil diupload',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal upload file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (index: number, field: 'tanggal' | 'nomor' | 'keterangan', value: string) => {
    const newList = [...dokumenList];
    newList[index][field] = value;
    setDokumenList(newList);

    // Auto-save if item has ID (already in database)
    const item = newList[index];
    if (item.id) {
      try {
        await axios.put(`/api/dokumen-checklist-items/${item.id}`, {
          [field]: value,
        });
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }
  };

  const handleDeleteFile = async (index: number) => {
    const item = dokumenList[index];
    
    if (!item.id || !item.file_soft_copy) return;

    try {
      setLoading(true);

      // Update item to remove file
      await axios.put(`/api/dokumen-checklist-items/${item.id}`, {
        file_soft_copy: null,
      });

      // Update local state
      const newList = [...dokumenList];
      newList[index].file_soft_copy = null;
      setDokumenList(newList);

      toast({
        title: 'Berhasil',
        description: 'File berhasil dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getKategoriColor = (kategori: string) => {
    switch (kategori) {
      case 'Umum':
        return 'bg-blue-100 text-blue-800';
      case 'Katalog/Mini Kompetisi':
        return 'bg-green-100 text-green-800';
      case 'Pengadaan Langsung':
        return 'bg-yellow-100 text-yellow-800';
      case 'Lelang':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedDokumen = dokumenList.reduce((acc, dok) => {
    if (!acc[dok.kategori]) {
      acc[dok.kategori] = [];
    }
    acc[dok.kategori].push(dok);
    return acc;
  }, {} as Record<string, DokumenItem[]>);

  const getUploadStats = (items: DokumenItem[]) => {
    const uploaded = items.filter(item => item.file_soft_copy).length;
    return { uploaded, total: items.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/pengadaan')}
              className="hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileCheck className="h-8 w-8" />
                <h1 className="text-3xl font-bold tracking-tight">Checklist Dokumen Pengadaan</h1>
              </div>
              {pengadaan && (
                <p className="text-blue-100 text-lg">
                  {pengadaan.belanja_operasi} - {pengadaan.jenis_pengadaan}
                </p>
              )}
            </div>
          </div>

          {/* Info Cards */}
          {pengadaan && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Jenis Pengadaan</p>
                      <p className="text-sm font-semibold text-white">{pengadaan.jenis_pengadaan}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Tanggal</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(pengadaan.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Total Dokumen</p>
                      <p className="text-sm font-semibold text-white">{dokumenList.length} Dokumen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">

      {Object.entries(groupedDokumen).map(([kategori, items]) => {
        const stats = getUploadStats(items);
        const progress = Math.round((stats.uploaded / stats.total) * 100);
        
        return (
        <Card key={kategori} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4" style={{ borderTopColor: kategori === 'Umum' ? '#3b82f6' : kategori === 'Katalog' || kategori === 'Mini Kompetisi' ? '#eab308' : kategori === 'Pengadaan Langsung' ? '#10b981' : '#a855f7' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Badge className={`${getKategoriColor(kategori)} px-3 py-1.5 text-sm font-semibold`}>{kategori}</Badge>
                  <span className="text-base font-normal text-muted-foreground">
                    {items.length} dokumen
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {progress === 100 ? (
                    <Badge className="bg-green-500 text-white px-3 py-1.5">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Lengkap
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="px-3 py-1.5">
                      <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                      {progress}% Selesai
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Progress Kelengkapan</span>
                  <span className="font-semibold text-blue-600">{stats.uploaded}/{stats.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex justify-center">
                <div className="bg-white rounded-lg p-4 border border-green-200 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">File Terupload</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{stats.uploaded}<span className="text-lg text-muted-foreground">/{stats.total}</span></p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="w-[50px] font-semibold">No</TableHead>
                    <TableHead className="min-w-[250px] font-semibold">Dokumen</TableHead>
                    <TableHead className="w-[120px] font-semibold">Pihak</TableHead>
                    <TableHead className="w-[150px] font-semibold">Upload File</TableHead>
                    <TableHead className="w-[250px] font-semibold">Hasil Upload</TableHead>
                    <TableHead className="w-[150px] font-semibold">Tanggal</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">Nomor</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">Keterangan</TableHead>
                    <TableHead className="w-[80px] text-center font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const globalIndex = dokumenList.findIndex(d => 
                      d.kategori === item.kategori && d.no_urut === item.no_urut
                    );
                    
                    return (
                      <TableRow key={`${item.kategori}-${item.no_urut}`} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-600">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm">
                            {item.no_urut}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-800">{item.nama_dokumen}</div>
                            {item.is_conditional && item.conditional_note && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md inline-flex">
                                <AlertCircle className="h-3 w-3" />
                                {item.conditional_note}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">{item.pihak_penanggung_jawab}</Badge>
                        </TableCell>
                        <TableCell>
                          {/* Upload button */}
                          <div className="relative">
                            <input
                              type="file"
                              id={`file-${globalIndex}`}
                              className="hidden"
                              onChange={(e) => handleFileChange(globalIndex, 'soft', e.target.files?.[0] || null)}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            />
                            <label
                              htmlFor={`file-${globalIndex}`}
                              className="flex items-center justify-center gap-2 w-32 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              {item.file_soft_copy ? 'Ganti File' : 'Upload File'}
                            </label>
                          </div>
                        </TableCell>
                        <TableCell>
                          {/* Display uploaded file */}
                          {item.file_soft_copy && typeof item.file_soft_copy === 'string' ? (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <p className="text-xs font-medium text-blue-900 truncate w-32" title={item.file_soft_copy.split('/').pop()}>
                                {item.file_soft_copy.split('/').pop()}
                              </p>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-blue-100"
                                  onClick={() => {
                                    window.open(`/storage/${item.file_soft_copy}`, '_blank');
                                  }}
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-red-100"
                                  onClick={() => handleDeleteFile(globalIndex)}
                                  title="Hapus File"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">Belum ada file</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.tanggal}
                            onChange={(e) => handleInputChange(globalIndex, 'tanggal', e.target.value)}
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.nomor}
                            onChange={(e) => handleInputChange(globalIndex, 'nomor', e.target.value)}
                            placeholder="No. Dokumen"
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) => handleInputChange(globalIndex, 'keterangan', e.target.value)}
                            placeholder="Keterangan"
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {item.file_soft_copy ? (
                            <div className="flex items-center justify-center">
                              <div className="p-2 rounded-full bg-green-100">
                                <Check className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="p-2 rounded-full bg-red-100">
                                <X className="h-5 w-5 text-red-600" />
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      );
      })}

        {/* Action Buttons */}
        <Card className="shadow-lg border-t-4 border-t-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-800">Simpan Perubahan</h3>
                <p className="text-sm text-muted-foreground">Pastikan semua dokumen sudah terupload dengan benar</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/dashboard/pengadaan')} className="px-6">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button onClick={async () => {
                  try {
                    setLoading(true);
                    
                    // Prepare items without files
                    const itemsToSave = dokumenList
                      .filter(item => !item.id && (item.tanggal || item.nomor || item.keterangan))
                      .map(item => ({
                        kategori: item.kategori,
                        no_urut: item.no_urut,
                        nama_dokumen: item.nama_dokumen,
                        pihak_penanggung_jawab: item.pihak_penanggung_jawab,
                        tanggal: item.tanggal || null,
                        nomor: item.nomor || null,
                        keterangan: item.keterangan || null,
                        is_conditional: item.is_conditional,
                        conditional_note: item.conditional_note || null,
                      }));

                    if (itemsToSave.length > 0) {
                      await axios.post('/api/dokumen-checklist-items/bulk', {
                        pengadaan_id: id,
                        items: itemsToSave,
                      });
                    }

                    toast({
                      title: 'Berhasil',
                      description: 'Dokumen checklist berhasil disimpan',
                    });

                    // Reload data
                    fetchDokumenItems();
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.response?.data?.message || 'Gagal menyimpan dokumen',
                      variant: 'destructive',
                    });
                  } finally {
                    setLoading(false);
                  }
                }} className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Simpan Semua Dokumen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { IncomingMail } from '@/types/hris';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  Mail,
  MailOpen,
  Archive,
  CheckCircle,
  Eye,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ArrowDown,
  Upload,
  Download,
  FileText,
  X,
} from 'lucide-react';

export default function IncomingMailPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [mailList, setMailList] = useState<IncomingMail[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingMail, setViewingMail] = useState<IncomingMail | null>(null);
  const [editingMail, setEditingMail] = useState<IncomingMail | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    mailNumber: '',
    sender: '',
    subject: '',
    receivedDate: new Date().toISOString().split('T')[0],
    category: 'official',
    priority: 'medium',
    status: 'unread',
    description: '',
  });

  useEffect(() => {
    fetchMails();
  }, [filterStatus, filterCategory, filterPriority, searchTerm]);

  const fetchMails = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/incoming-mails', { params });
      setMailList(response.data);
    } catch (error) {
      console.error('Failed to fetch mails:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data surat masuk',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    unread: mailList.filter((m) => m.status === 'unread').length,
    read: mailList.filter((m) => m.status === 'read').length,
    processed: mailList.filter((m) => m.status === 'processed').length,
    archived: mailList.filter((m) => m.status === 'archived').length,
  };

  const getStatusBadge = (status: IncomingMail['status']) => {
    const config = {
      unread: {
        icon: Mail,
        label: 'Belum Dibaca',
        className: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
      read: {
        icon: MailOpen,
        label: 'Sudah Dibaca',
        className: 'bg-info/10 text-info hover:bg-info/20',
      },
      processed: {
        icon: CheckCircle,
        label: 'Diproses',
        className: 'bg-success/10 text-success hover:bg-success/20',
      },
      archived: {
        icon: Archive,
        label: 'Diarsipkan',
        className: 'bg-muted text-muted-foreground hover:bg-muted/80',
      },
    };
    const { icon: Icon, label, className } = config[status];
    return (
      <Badge variant="secondary" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: IncomingMail['priority']) => {
    const config = {
      high: {
        icon: AlertTriangle,
        label: 'Tinggi',
        className: 'bg-destructive/10 text-destructive',
      },
      medium: {
        icon: AlertCircle,
        label: 'Sedang',
        className: 'bg-warning/10 text-warning',
      },
      low: {
        icon: ArrowDown,
        label: 'Rendah',
        className: 'bg-muted text-muted-foreground',
      },
    };
    const { icon: Icon, label, className } = config[priority];
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: IncomingMail['category']) => {
    const labels = {
      official: 'Resmi',
      invitation: 'Undangan',
      notification: 'Pemberitahuan',
      complaint: 'Pengaduan',
      other: 'Lainnya',
    };
    return labels[category];
  };

  const handleAddMail = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mail_number', formData.mailNumber);
      formDataToSend.append('sender', formData.sender);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('received_date', formData.receivedDate);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('description', formData.description);
      
      if (selectedFile) {
        formDataToSend.append('attachment', selectedFile);
      }

      await axios.post('/api/incoming-mails', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchMails();
      toast({
        title: 'Berhasil',
        description: 'Surat masuk berhasil ditambahkan',
      });
    } catch (error: any) {
      console.error('Failed to add mail:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menambahkan surat masuk',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMail = async () => {
    if (!editingMail) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mail_number', formData.mailNumber);
      formDataToSend.append('sender', formData.sender);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('received_date', formData.receivedDate);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('description', formData.description);
      
      if (selectedFile) {
        formDataToSend.append('attachment', selectedFile);
      }

      // Laravel doesn't support file upload in PUT, use POST with _method
      formDataToSend.append('_method', 'PUT');

      await axios.post(`/api/incoming-mails/${editingMail.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsEditDialogOpen(false);
      setEditingMail(null);
      resetForm();
      fetchMails();
      toast({
        title: 'Berhasil',
        description: 'Surat masuk berhasil diupdate',
      });
    } catch (error: any) {
      console.error('Failed to update mail:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal mengupdate surat masuk',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;

    try {
      await axios.delete(`/api/incoming-mails/${id}`);
      fetchMails();
      toast({
        title: 'Berhasil',
        description: 'Surat berhasil dihapus',
      });
    } catch (error) {
      console.error('Failed to delete mail:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus surat',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (mail: IncomingMail) => {
    if (!mail.attachmentUrl) {
      toast({
        title: 'Error',
        description: 'File tidak tersedia',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await axios.get(`/api/incoming-mails/${mail.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', mail.attachmentName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengunduh file',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (mail: IncomingMail) => {
    setEditingMail(mail);
    setFormData({
      mailNumber: mail.mailNumber,
      sender: mail.sender,
      subject: mail.subject,
      receivedDate: mail.receivedDate,
      category: mail.category,
      priority: mail.priority,
      status: mail.status,
      description: mail.description || '',
    });
    setSelectedFile(null);
    setIsEditDialogOpen(true);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const mail = mailList.find(m => m.id === id);
      if (!mail) return;

      const formDataToSend = new FormData();
      formDataToSend.append('mail_number', mail.mailNumber);
      formDataToSend.append('sender', mail.sender);
      formDataToSend.append('subject', mail.subject);
      formDataToSend.append('received_date', mail.receivedDate);
      formDataToSend.append('category', mail.category);
      formDataToSend.append('priority', mail.priority);
      formDataToSend.append('status', 'read');
      formDataToSend.append('description', mail.description || '');
      formDataToSend.append('_method', 'PUT');

      await axios.post(`/api/incoming-mails/${id}`, formDataToSend);
      fetchMails();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleProcess = async (id: string) => {
    try {
      const mail = mailList.find(m => m.id === id);
      if (!mail) return;

      const formDataToSend = new FormData();
      formDataToSend.append('mail_number', mail.mailNumber);
      formDataToSend.append('sender', mail.sender);
      formDataToSend.append('subject', mail.subject);
      formDataToSend.append('received_date', mail.receivedDate);
      formDataToSend.append('category', mail.category);
      formDataToSend.append('priority', mail.priority);
      formDataToSend.append('status', 'processed');
      formDataToSend.append('description', mail.description || '');
      formDataToSend.append('_method', 'PUT');

      await axios.post(`/api/incoming-mails/${id}`, formDataToSend);
      fetchMails();
      toast({
        title: 'Berhasil',
        description: 'Surat telah diproses',
      });
    } catch (error) {
      console.error('Failed to process:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const mail = mailList.find(m => m.id === id);
      if (!mail) return;

      const formDataToSend = new FormData();
      formDataToSend.append('mail_number', mail.mailNumber);
      formDataToSend.append('sender', mail.sender);
      formDataToSend.append('subject', mail.subject);
      formDataToSend.append('received_date', mail.receivedDate);
      formDataToSend.append('category', mail.category);
      formDataToSend.append('priority', mail.priority);
      formDataToSend.append('status', 'archived');
      formDataToSend.append('description', mail.description || '');
      formDataToSend.append('_method', 'PUT');

      await axios.post(`/api/incoming-mails/${id}`, formDataToSend);
      fetchMails();
      toast({
        title: 'Berhasil',
        description: 'Surat telah diarsipkan',
      });
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      mailNumber: '',
      sender: '',
      subject: '',
      receivedDate: new Date().toISOString().split('T')[0],
      category: 'official',
      priority: 'medium',
      status: 'unread',
      description: '',
    });
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Surat Masuk</h1>
          <p className="text-muted-foreground">
            Kelola surat dan dokumen masuk perusahaan
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Surat Masuk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Surat Masuk</DialogTitle>
              <DialogDescription>
                Catat surat masuk baru ke sistem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mailNumber">Nomor Surat</Label>
                <Input
                  id="mailNumber"
                  value={formData.mailNumber}
                  onChange={(e) => setFormData({ ...formData, mailNumber: e.target.value })}
                  placeholder="Contoh: SM/001/I/2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender">Pengirim</Label>
                <Input
                  id="sender"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  placeholder="Nama pengirim atau instansi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Perihal</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Perihal surat"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedDate">Tanggal Diterima</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">Resmi</SelectItem>
                      <SelectItem value="invitation">Undangan</SelectItem>
                      <SelectItem value="notification">Pemberitahuan</SelectItem>
                      <SelectItem value="complaint">Pengaduan</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Tinggi</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="low">Rendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Keterangan</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan tambahan..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachment">Lampiran Dokumen</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="gradient" onClick={handleAddMail}>
                <Upload className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Mail className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-sm text-muted-foreground">Belum Dibaca</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10">
                <MailOpen className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.read}</p>
                <p className="text-sm text-muted-foreground">Sudah Dibaca</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processed}</p>
                <p className="text-sm text-muted-foreground">Diproses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <Archive className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.archived}</p>
                <p className="text-sm text-muted-foreground">Diarsipkan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nomor surat, perihal, atau pengirim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="unread">Belum Dibaca</SelectItem>
                <SelectItem value="read">Sudah Dibaca</SelectItem>
                <SelectItem value="processed">Diproses</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mail Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Daftar Surat Masuk ({mailList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Perihal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailList.map((mail) => (
                  <TableRow 
                    key={mail.id} 
                    className={`hover:bg-muted/50 ${mail.status === 'unread' ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {mail.mailNumber}
                    </TableCell>
                    <TableCell className="font-medium">{mail.sender}</TableCell>
                    <TableCell className="max-w-xs truncate">{mail.subject}</TableCell>
                    <TableCell>{mail.receivedDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(mail.category)}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(mail.priority)}</TableCell>
                    <TableCell>{getStatusBadge(mail.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {mail.attachmentUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(mail)}
                            title="Download Lampiran"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setViewingMail(mail);
                                if (mail.status === 'unread') {
                                  handleMarkAsRead(mail.id);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detail Surat Masuk</DialogTitle>
                            </DialogHeader>
                            {viewingMail && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">No. Surat</p>
                                    <p className="font-medium">{viewingMail.mailNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Tanggal Terima</p>
                                    <p className="font-medium">{viewingMail.receivedDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Pengirim</p>
                                    <p className="font-medium">{viewingMail.sender}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Kategori</p>
                                    <p className="font-medium">{getCategoryLabel(viewingMail.category)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Prioritas</p>
                                    {getPriorityBadge(viewingMail.priority)}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    {getStatusBadge(viewingMail.status)}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-sm">Perihal</p>
                                  <p className="font-medium">{viewingMail.subject}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-sm">Keterangan</p>
                                  <p>{viewingMail.description || '-'}</p>
                                </div>
                                {viewingMail.attachmentUrl && (
                                  <div className="border rounded-lg p-3 bg-muted/30">
                                    <p className="text-muted-foreground text-sm mb-2">Lampiran</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownload(viewingMail)}
                                      className="w-full"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      {viewingMail.attachmentName || 'Download Dokumen'}
                                    </Button>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(viewingMail)}
                                  >
                                    Edit
                                  </Button>
                                  {viewingMail.status !== 'processed' && viewingMail.status !== 'archived' && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        handleProcess(viewingMail.id);
                                        setViewingMail(null);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Proses
                                    </Button>
                                  )}
                                  {viewingMail.status !== 'archived' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        handleArchive(viewingMail.id);
                                        setViewingMail(null);
                                      }}
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Arsipkan
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(mail.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                Memuat data...
              </div>
            )}
            {!isLoading && mailList.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Belum ada data surat masuk
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Surat Masuk</DialogTitle>
            <DialogDescription>
              Ubah informasi surat masuk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-mailNumber">Nomor Surat</Label>
              <Input
                id="edit-mailNumber"
                value={formData.mailNumber}
                onChange={(e) => setFormData({ ...formData, mailNumber: e.target.value })}
                placeholder="Contoh: SM/001/I/2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sender">Pengirim</Label>
              <Input
                id="edit-sender"
                value={formData.sender}
                onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                placeholder="Nama pengirim atau instansi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Perihal</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Perihal surat"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-receivedDate">Tanggal Diterima</Label>
              <Input
                id="edit-receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">Resmi</SelectItem>
                    <SelectItem value="invitation">Undangan</SelectItem>
                    <SelectItem value="notification">Pemberitahuan</SelectItem>
                    <SelectItem value="complaint">Pengaduan</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioritas</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="low">Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unread">Belum Dibaca</SelectItem>
                  <SelectItem value="read">Sudah Dibaca</SelectItem>
                  <SelectItem value="processed">Diproses</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Keterangan</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Keterangan tambahan..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-attachment">Lampiran Dokumen</Label>
              {editingMail?.attachmentName && !selectedFile && (
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File saat ini: {editingMail.attachmentName}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="edit-attachment"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingMail(null);
              resetForm();
            }}>
              Batal
            </Button>
            <Button variant="gradient" onClick={handleUpdateMail}>
              <Upload className="h-4 w-4 mr-2" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

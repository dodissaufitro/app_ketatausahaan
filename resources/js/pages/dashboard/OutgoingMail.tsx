import { useState } from 'react';
import { outgoingMailRecords } from '@/data/mockData';
import { OutgoingMail } from '@/types/hris';
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
  Send,
  FileText,
  CheckCircle,
  Archive,
  Eye,
  Trash2,
  Edit,
  AlertTriangle,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';

export default function OutgoingMailPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [mailList, setMailList] = useState<OutgoingMail[]>(outgoingMailRecords);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingMail, setViewingMail] = useState<OutgoingMail | null>(null);
  const [editingMail, setEditingMail] = useState<OutgoingMail | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    category: '',
    priority: '',
    description: '',
  });

  const filteredMails = mailList.filter((mail) => {
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.mailNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || mail.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    draft: mailList.filter((m) => m.status === 'draft').length,
    sent: mailList.filter((m) => m.status === 'sent').length,
    delivered: mailList.filter((m) => m.status === 'delivered').length,
    archived: mailList.filter((m) => m.status === 'archived').length,
  };

  const getStatusBadge = (status: OutgoingMail['status']) => {
    const config = {
      draft: {
        icon: FileText,
        label: 'Draft',
        className: 'bg-warning/10 text-warning hover:bg-warning/20',
      },
      sent: {
        icon: Send,
        label: 'Terkirim',
        className: 'bg-info/10 text-info hover:bg-info/20',
      },
      delivered: {
        icon: CheckCircle,
        label: 'Diterima',
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

  const getPriorityBadge = (priority: OutgoingMail['priority']) => {
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

  const getCategoryLabel = (category: OutgoingMail['category']) => {
    const labels = {
      official: 'Resmi',
      invitation: 'Undangan',
      notification: 'Pemberitahuan',
      report: 'Laporan',
      other: 'Lainnya',
    };
    return labels[category];
  };

  const handleAddMail = () => {
    const newMail: OutgoingMail = {
      id: Date.now().toString(),
      mailNumber: `SK/${String(mailList.length + 1).padStart(3, '0')}/I/2024`,
      recipient: formData.recipient,
      subject: formData.subject,
      sentDate: new Date().toISOString().split('T')[0],
      category: formData.category as OutgoingMail['category'],
      priority: formData.priority as OutgoingMail['priority'],
      status: 'draft',
      description: formData.description,
    };

    setMailList([newMail, ...mailList]);
    setIsAddDialogOpen(false);
    resetForm();
    toast({
      title: 'Berhasil',
      description: 'Surat keluar berhasil dibuat sebagai draft',
    });
  };

  const handleEditMail = () => {
    if (!editingMail) return;

    setMailList(
      mailList.map((mail) =>
        mail.id === editingMail.id
          ? {
              ...mail,
              recipient: formData.recipient,
              subject: formData.subject,
              category: formData.category as OutgoingMail['category'],
              priority: formData.priority as OutgoingMail['priority'],
              description: formData.description,
            }
          : mail
      )
    );
    setEditingMail(null);
    resetForm();
    toast({
      title: 'Berhasil',
      description: 'Surat keluar berhasil diperbarui',
    });
  };

  const handleSend = (id: string) => {
    setMailList(
      mailList.map((mail) =>
        mail.id === id
          ? { ...mail, status: 'sent' as const, sentDate: new Date().toISOString().split('T')[0] }
          : mail
      )
    );
    toast({
      title: 'Berhasil',
      description: 'Surat berhasil dikirim',
    });
  };

  const handleMarkDelivered = (id: string) => {
    setMailList(
      mailList.map((mail) =>
        mail.id === id ? { ...mail, status: 'delivered' as const } : mail
      )
    );
    toast({
      title: 'Berhasil',
      description: 'Surat telah diterima oleh tujuan',
    });
  };

  const handleArchive = (id: string) => {
    setMailList(
      mailList.map((mail) =>
        mail.id === id ? { ...mail, status: 'archived' as const } : mail
      )
    );
    toast({
      title: 'Berhasil',
      description: 'Surat telah diarsipkan',
    });
  };

  const handleDelete = (id: string) => {
    setMailList(mailList.filter((mail) => mail.id !== id));
    toast({
      title: 'Berhasil',
      description: 'Surat berhasil dihapus',
    });
  };

  const openEditDialog = (mail: OutgoingMail) => {
    setEditingMail(mail);
    setFormData({
      recipient: mail.recipient,
      subject: mail.subject,
      category: mail.category,
      priority: mail.priority,
      description: mail.description || '',
    });
  };

  const resetForm = () => {
    setFormData({
      recipient: '',
      subject: '',
      category: '',
      priority: '',
      description: '',
    });
  };

  const MailForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient">Tujuan</Label>
        <Input
          id="recipient"
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          placeholder="Nama penerima atau instansi"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Perihal</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Perihal surat"
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
              <SelectItem value="report">Laporan</SelectItem>
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
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {
          setIsAddDialogOpen(false);
          setEditingMail(null);
          resetForm();
        }}>
          Batal
        </Button>
        <Button variant="gradient" onClick={onSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Surat Keluar</h1>
          <p className="text-muted-foreground">
            Kelola surat dan dokumen keluar perusahaan
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Surat Keluar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Buat Surat Keluar</DialogTitle>
              <DialogDescription>
                Buat surat keluar baru
              </DialogDescription>
            </DialogHeader>
            <MailForm onSubmit={handleAddMail} submitText="Simpan sebagai Draft" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10">
                <Send className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Terkirim</p>
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
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-sm text-muted-foreground">Diterima</p>
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
                placeholder="Cari berdasarkan nomor surat, perihal, atau tujuan..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Terkirim</SelectItem>
                <SelectItem value="delivered">Diterima</SelectItem>
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
            <Send className="h-5 w-5" />
            Daftar Surat Keluar ({filteredMails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Perihal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMails.map((mail) => (
                  <TableRow key={mail.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-medium">
                      {mail.mailNumber}
                    </TableCell>
                    <TableCell className="font-medium">{mail.recipient}</TableCell>
                    <TableCell className="max-w-xs truncate">{mail.subject}</TableCell>
                    <TableCell>{mail.sentDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(mail.category)}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(mail.priority)}</TableCell>
                    <TableCell>{getStatusBadge(mail.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingMail(mail)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detail Surat Keluar</DialogTitle>
                            </DialogHeader>
                            {viewingMail && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">No. Surat</p>
                                    <p className="font-medium">{viewingMail.mailNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Tanggal</p>
                                    <p className="font-medium">{viewingMail.sentDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Tujuan</p>
                                    <p className="font-medium">{viewingMail.recipient}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Kategori</p>
                                    <p className="font-medium">{getCategoryLabel(viewingMail.category)}</p>
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
                                <div className="flex gap-2 pt-4">
                                  {viewingMail.status === 'draft' && (
                                    <Button
                                      variant="default"
                                      onClick={() => {
                                        handleSend(viewingMail.id);
                                        setViewingMail(null);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Kirim
                                    </Button>
                                  )}
                                  {viewingMail.status === 'sent' && (
                                    <Button
                                      variant="default"
                                      onClick={() => {
                                        handleMarkDelivered(viewingMail.id);
                                        setViewingMail(null);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Tandai Diterima
                                    </Button>
                                  )}
                                  {viewingMail.status !== 'archived' && (
                                    <Button
                                      variant="outline"
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
                        {mail.status === 'draft' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(mail)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Edit Surat Keluar</DialogTitle>
                                <DialogDescription>
                                  Perbarui draft surat keluar
                                </DialogDescription>
                              </DialogHeader>
                              <MailForm onSubmit={handleEditMail} submitText="Simpan Perubahan" />
                            </DialogContent>
                          </Dialog>
                        )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

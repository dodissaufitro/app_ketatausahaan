import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

// Setup moment localizer
const localizer = momentLocalizer(moment);

interface AgendaData {
  id?: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
  status: string;
  created_by: string;
}

interface CalendarEvent extends Event {
  id?: number;
  resource?: AgendaData;
}

const Agenda = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [agendas, setAgendas] = useState<AgendaData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaData | null>(null);
  const [formData, setFormData] = useState<AgendaData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    category: 'meeting',
    status: 'scheduled',
    created_by: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      category: 'meeting',
      status: 'scheduled',
      created_by: '',
    });
  };

  const fetchAgendas = async () => {
    try {
      const response = await axios.get('/api/agendas');
      setAgendas(response.data);
      
      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = response.data.map((agenda: AgendaData) => ({
        id: agenda.id,
        title: agenda.title,
        start: new Date(agenda.start_date),
        end: new Date(agenda.end_date),
        resource: agenda,
      }));
      setEvents(calendarEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data agenda',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const handleAddAgenda = async () => {
    try {
      await axios.post('/api/agendas', formData);
      await fetchAgendas();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Agenda berhasil ditambahkan',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menambahkan agenda',
        variant: 'destructive',
      });
    }
  };

  const handleEditAgenda = async () => {
    if (!selectedAgenda?.id) return;

    try {
      await axios.put(`/api/agendas/${selectedAgenda.id}`, formData);
      await fetchAgendas();
      setIsEditDialogOpen(false);
      setSelectedAgenda(null);
      resetForm();
      toast({
        title: 'Berhasil',
        description: 'Agenda berhasil diperbarui',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memperbarui agenda',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAgenda = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda ini?')) return;

    try {
      await axios.delete(`/api/agendas/${id}`);
      await fetchAgendas();
      setIsViewDialogOpen(false);
      setSelectedAgenda(null);
      toast({
        title: 'Berhasil',
        description: 'Agenda berhasil dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus agenda',
        variant: 'destructive',
      });
    }
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const agenda = event.resource;
    if (agenda) {
      setSelectedAgenda(agenda);
      setIsViewDialogOpen(true);
    }
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!isSuperAdmin) return; // Only superadmin can add agenda
    
    setFormData({
      ...formData,
      start_date: moment(start).format('YYYY-MM-DDTHH:mm'),
      end_date: moment(end).format('YYYY-MM-DDTHH:mm'),
    });
    setIsAddDialogOpen(true);
  }, [formData, isSuperAdmin]);

  const openEditDialog = () => {
    if (selectedAgenda) {
      setFormData({
        title: selectedAgenda.title,
        description: selectedAgenda.description,
        start_date: moment(selectedAgenda.start_date).format('YYYY-MM-DDTHH:mm'),
        end_date: moment(selectedAgenda.end_date).format('YYYY-MM-DDTHH:mm'),
        location: selectedAgenda.location,
        category: selectedAgenda.category,
        status: selectedAgenda.status,
        created_by: selectedAgenda.created_by,
      });
      setIsViewDialogOpen(false);
      setIsEditDialogOpen(true);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const category = event.resource?.category;
    let backgroundColor = '#3b82f6'; // default blue

    switch (category) {
      case 'meeting':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'event':
        backgroundColor = '#8b5cf6'; // purple
        break;
      case 'reminder':
        backgroundColor = '#f59e0b'; // orange
        break;
      case 'task':
        backgroundColor = '#10b981'; // green
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-blue-500';
      case 'event':
        return 'bg-purple-500';
      case 'reminder':
        return 'bg-orange-500';
      case 'task':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'Meeting';
      case 'event':
        return 'Event';
      case 'reminder':
        return 'Reminder';
      case 'task':
        return 'Task';
      default:
        return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Terjadwal';
      case 'ongoing':
        return 'Berlangsung';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Agenda & Kalender
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan lihat semua agenda dalam tampilan kalender
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="gradient"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Agenda
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-sm">Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span className="text-sm">Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span className="text-sm">Reminder</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm">Task</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-lg border p-6" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Agenda Baru</DialogTitle>
            <DialogDescription>Buat agenda baru di kalender</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add_title">Judul Agenda</Label>
              <Input
                id="add_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul agenda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_description">Deskripsi</Label>
              <Textarea
                id="add_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_start_date">Tanggal & Waktu Mulai</Label>
                <Input
                  id="add_start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_end_date">Tanggal & Waktu Selesai</Label>
                <Input
                  id="add_end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_location">Lokasi</Label>
              <Input
                id="add_location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Masukkan lokasi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="add_category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="add_status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Terjadwal</SelectItem>
                    <SelectItem value="ongoing">Berlangsung</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_created_by">Dibuat Oleh</Label>
              <Input
                id="add_created_by"
                value={formData.created_by}
                onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                placeholder="Masukkan nama pembuat"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button variant="gradient" onClick={handleAddAgenda}>
                Tambah Agenda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Agenda</DialogTitle>
          </DialogHeader>
          {selectedAgenda && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedAgenda.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getCategoryColor(selectedAgenda.category)}`}>
                    {getCategoryLabel(selectedAgenda.category)}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                    {getStatusLabel(selectedAgenda.status)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                  <p className="text-sm">{selectedAgenda.description || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waktu Mulai</p>
                  <p className="text-sm">{moment(selectedAgenda.start_date).format('DD MMMM YYYY, HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waktu Selesai</p>
                  <p className="text-sm">{moment(selectedAgenda.end_date).format('DD MMMM YYYY, HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lokasi</p>
                  <p className="text-sm">{selectedAgenda.location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dibuat Oleh</p>
                  <p className="text-sm">{selectedAgenda.created_by || '-'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Tutup
                </Button>
                {isSuperAdmin && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => selectedAgenda.id && handleDeleteAgenda(selectedAgenda.id)}
                    >
                      Hapus
                    </Button>
                    <Button variant="gradient" onClick={openEditDialog}>
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agenda</DialogTitle>
            <DialogDescription>Perbarui informasi agenda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Judul Agenda</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul agenda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Deskripsi</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Tanggal & Waktu Mulai</Label>
                <Input
                  id="edit_start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date">Tanggal & Waktu Selesai</Label>
                <Input
                  id="edit_end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_location">Lokasi</Label>
              <Input
                id="edit_location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Masukkan lokasi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="edit_category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="edit_status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Terjadwal</SelectItem>
                    <SelectItem value="ongoing">Berlangsung</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_created_by">Dibuat Oleh</Label>
              <Input
                id="edit_created_by"
                value={formData.created_by}
                onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                placeholder="Masukkan nama pembuat"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedAgenda(null);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button variant="gradient" onClick={handleEditAgenda}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;

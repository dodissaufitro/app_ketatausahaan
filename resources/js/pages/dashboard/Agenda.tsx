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
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Heart, 
  Sparkles, 
  MapPin, 
  Clock, 
  Users,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

// Setup moment localizer
const localizer = momentLocalizer(moment);

// Enhanced 3D CSS for elegant feminine design
const elegantStyles = `
  @keyframes sparkle {
    0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.8; }
    50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
  }
  
  @keyframes float-gentle {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-12px) rotate(2deg); }
  }
  
  @keyframes shimmer-pearl {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }
  
  @keyframes glow-soft {
    0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.5), 0 0 35px rgba(30, 64, 175, 0.3); }
  }
  
  .animate-sparkle {
    animation: sparkle 3s ease-in-out infinite;
  }
  
  .animate-float-gentle {
    animation: float-gentle 8s ease-in-out infinite;
  }
  
  .shimmer-pearl {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    background-size: 200px 100%;
    animation: shimmer-pearl 3s infinite;
  }
  
  .animate-glow-soft {
    animation: glow-soft 4s ease-in-out infinite;
  }
  
  .glass-elegant {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .pearl-effect {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9, #e2e8f0);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  
  .professional-gradient {
    background: linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8, #1e40af);
  }
  
  .charcoal-gradient {
    background: linear-gradient(135deg, #374151, #4b5563, #6b7280, #9ca3af);
  }
  
  .calendar-3d {
    transform: perspective(1000px) rotateX(2deg) rotateY(1deg);
    transition: transform 0.3s ease;
  }
  
  .calendar-3d:hover {
    transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.01);
  }
`;

// Inject elegant styles
if (typeof document !== 'undefined') {
  const styleId = 'agenda-elegant-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = elegantStyles;
    document.head.appendChild(styleElement);
  }
}

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
    let backgroundColor = '#3b82f6'; // professional blue default 

    switch (category) {
      case 'meeting':
        backgroundColor = '#3b82f6'; // professional blue
        break;
      case 'event':
        backgroundColor = '#6366f1'; // indigo
        break;
      case 'reminder':
        backgroundColor = '#f59e0b'; // amber
        break;
      case 'task':
        backgroundColor = '#10b981'; // emerald
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '12px',
        opacity: 0.9,
        color: '#4a5568',
        border: '2px solid rgba(255, 255, 255, 0.8)',
        display: 'block',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-2px)',
        transition: 'all 0.3s ease',
      },
    };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'event':
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600';
      case 'reminder':
        return 'bg-gradient-to-br from-amber-500 to-orange-500';
      case 'task':
        return 'bg-gradient-to-br from-emerald-500 to-teal-500';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'event':
        return <CalendarIcon className="h-4 w-4" />;
      case 'reminder':
        return <Clock className="h-4 w-4" />;
      case 'task':
        return <Eye className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'Rapat';
      case 'event':
        return 'Acara';
      case 'reminder':
        return 'Pengingat';
      case 'task':
        return 'Tugas';
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

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      ongoing: 'bg-gradient-to-r from-green-400 to-green-500 text-white',
      completed: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white',
      cancelled: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.scheduled} shadow-lg`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-gray-100">
      {/* Elegant Header with 3D Effects */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-slate-200/20 to-gray-200/20 rounded-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8 pearl-effect rounded-3xl border border-slate-200/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 professional-gradient rounded-3xl flex items-center justify-center transform hover:rotate-12 transition-all duration-500 shadow-2xl animate-glow-soft">
                <CalendarIcon className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-sparkle">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-slate-700 to-gray-800 bg-clip-text text-transparent drop-shadow-sm">
                Agenda Kegiatan
              </h1>
              <p className="text-gray-600 text-lg mt-2 font-medium">
                Kelola agenda kegiatan
              </p>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-blue-300/30 rounded-full animate-float-gentle flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="absolute bottom-4 left-4 w-8 h-8 bg-slate-300/30 rounded-full animate-float-gentle flex items-center justify-center">
            <Clock className="h-4 w-4 text-slate-600" />
          </div>
          
          {isSuperAdmin && (
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="h-16 px-8 professional-gradient hover:shadow-2xl text-white font-bold transform hover:scale-110 transition-all duration-300 relative overflow-hidden group animate-glow-soft rounded-2xl"
            >
              <div className="absolute inset-0 shimmer-pearl"></div>
              <span className="relative flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center transform group-hover:rotate-180 transition-transform duration-500">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-lg">Tambah Agenda</span>
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* 3D Calendar Container */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-slate-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
        <div className="relative pearl-effect p-8 rounded-2xl border border-slate-200/50 shadow-2xl calendar-3d backdrop-blur-xl">
          <div style={{ height: '70vh' }} className="rounded-xl overflow-hidden shadow-inner bg-white/50">
            <style>
              {`
                .rbc-calendar {
                  font-family: 'Inter', sans-serif;
                  background: rgba(255, 255, 255, 0.8);
                  border-radius: 12px;
                  overflow: hidden;
                }
                .rbc-header {
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: white;
                  font-weight: 600;
                  padding: 12px;
                  border: none;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .rbc-month-view, .rbc-agenda-view {
                  border: none;
                }
                .rbc-date-cell {
                  padding: 8px;
                  font-weight: 500;
                  color: #6b7280;
                }
                .rbc-today {
                  background: linear-gradient(135deg, #dbeafe, #e0e7ff) !important;
                  font-weight: 700;
                  color: #1d4ed8;
                }
                .rbc-event {
                  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                  border: none !important;
                  font-size: 12px;
                  font-weight: 600;
                }
                .rbc-event:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .rbc-toolbar {
                  background: linear-gradient(135deg, #374151, #4b5563);
                  padding: 16px;
                  border-radius: 12px;
                  margin-bottom: 12px;
                  box-shadow: 0 4px 12px rgba(75, 85, 99, 0.2);
                }
                .rbc-toolbar button {
                  background: rgba(255, 255, 255, 0.9);
                  color: #1e40af;
                  border: none;
                  border-radius: 8px;
                  padding: 8px 16px;
                  font-weight: 600;
                  margin: 0 2px;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .rbc-toolbar button:hover {
                  background: white;
                  transform: translateY(-1px);
                  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                .rbc-toolbar button.rbc-active {
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: white;
                }
                .rbc-toolbar-label {
                  color: white;
                  font-size: 20px;
                  font-weight: 700;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
              `}
            </style>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable={isSuperAdmin}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: "Selanjutnya",
                previous: "Sebelumnya",
                today: "Hari Ini",
                month: "Bulan",
                week: "Minggu",
                day: "Hari",
                agenda: "Agenda",
                date: "Tanggal",
                time: "Waktu",
                event: "Acara",
                noEventsInRange: "Tidak ada agenda pada rentang waktu ini",
                showMore: (total) => `+${total} agenda lainnya`,
              }}
              formats={{
                monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
                dayHeaderFormat: (date) => moment(date).format('dddd, DD MMMM'),
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM YYYY')}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Add Agenda Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl pearl-effect border border-pink-200/50 shadow-2xl backdrop-blur-xl">
          <div className="relative overflow-hidden lavender-gradient -m-6 mb-6 p-8 rounded-t-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-white flex items-center gap-2">
                      📋 Tambah Agenda Baru
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-slate-200 rounded-full animate-pulse delay-100"></div>
                        <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </DialogTitle>
                    <DialogDescription className="text-slate-100 text-lg">
                      📊 Atur jadwal profesional dengan detail yang akurat
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-float-gentle"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-sparkle"></div>
          </div>

          <div className="space-y-6 p-6">
            {/* Title & Category Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  📝 Judul Agenda <span className="text-blue-600">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul agenda..."
                    className="h-14 pl-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 group-focus-within/field:text-blue-700 transition-all duration-300">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  📁 Kategori <span className="text-blue-600">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-white/90 border border-slate-200 shadow-2xl">
                    <SelectItem value="meeting" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50">
                      <div className="flex items-center gap-3 p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-700">Rapat</div>
                          <div className="text-xs text-gray-500">Meeting & Diskusi</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="event" className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50">
                      <div className="flex items-center gap-3 p-2">
                        <CalendarIcon className="h-5 w-5 text-indigo-600" />
                        <div>
                          <div className="font-semibold text-gray-700">Acara</div>
                          <div className="text-xs text-gray-500">Event & Seminar</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="reminder" className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50">
                      <div className="flex items-center gap-3 p-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                          <div className="font-semibold text-gray-700">Pengingat</div>
                          <div className="text-xs text-gray-500">Reminder & Deadline</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="task" className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50">
                      <div className="flex items-center gap-3 p-2">
                        <Eye className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-semibold text-gray-700">Tugas</div>
                          <div className="text-xs text-gray-500">Task & Project</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="group/field">
              <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                📝 Deskripsi
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan detail agenda..."
                className="min-h-[120px] text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm resize-none"
              />
            </div>

            {/* Date Time Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  ⏰ Waktu Mulai <span className="text-blue-600">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  ⏱️ Waktu Selesai <span className="text-blue-600">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            {/* Location & Status Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  📍 Lokasi
                </Label>
                <div className="relative">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Dimana tempatnya?"
                    className="h-14 pl-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 group-focus-within/field:text-blue-700 transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  🎯 Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-white/90 border border-slate-200 shadow-2xl">
                    <SelectItem value="scheduled">📅 Terjadwal</SelectItem>
                    <SelectItem value="ongoing">🔄 Berlangsung</SelectItem>
                    <SelectItem value="completed">✅ Selesai</SelectItem>
                    <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 p-6 border-t border-slate-200/50">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
              className="h-14 px-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-lg rounded-2xl"
            >
              <span className="mr-2">❌</span>
              Batal
            </Button>
            <Button 
              onClick={handleAddAgenda}
              className="h-14 px-8 professional-gradient hover:shadow-2xl text-white font-bold transform hover:scale-105 transition-all duration-300 relative overflow-hidden group text-lg rounded-2xl"
            >
              <div className="absolute inset-0 shimmer-pearl"></div>
              <span className="relative flex items-center gap-2">
                <span>✅</span>
                Simpan Agenda
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Agenda Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl pearl-effect border border-pink-200/50 shadow-2xl backdrop-blur-xl">
          {selectedAgenda && (
            <>
              <div className="relative overflow-hidden charcoal-gradient -m-6 mb-6 p-8 rounded-t-2xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-14 h-14 ${getCategoryColor(selectedAgenda.category)} rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300 shadow-lg`}>
                        {getCategoryIcon(selectedAgenda.category)}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-3xl font-bold text-white mb-2">
                          {selectedAgenda.title}
                        </DialogTitle>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(selectedAgenda.status)}
                          <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                            {getCategoryIcon(selectedAgenda.category)}
                            <span className="ml-2">{getCategoryLabel(selectedAgenda.category)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {selectedAgenda.description && (
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200/50">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-xl">📝</span> Deskripsi
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{selectedAgenda.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Waktu
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Mulai</p>
                        <p className="font-medium text-gray-700">
                          {moment(selectedAgenda.start_date).format('dddd, DD MMMM YYYY - HH:mm')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Selesai</p>
                        <p className="font-medium text-gray-700">
                          {moment(selectedAgenda.end_date).format('dddd, DD MMMM YYYY - HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedAgenda.location && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200/50">
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        Lokasi
                      </h3>
                      <p className="text-gray-600">{selectedAgenda.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {isSuperAdmin && (
                <div className="flex justify-between p-6 border-t border-slate-200/50">
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteAgenda(selectedAgenda.id!)}
                    className="h-12 px-6 border-2 border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                      className="h-12 px-6 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 rounded-xl"
                    >
                      Tutup
                    </Button>
                    <Button
                      onClick={openEditDialog}
                      className="h-12 px-6 professional-gradient hover:shadow-lg text-white font-medium transition-all duration-300 rounded-xl"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Agenda Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl pearl-effect border border-pink-200/50 shadow-2xl backdrop-blur-xl">
          {/* Similar structure to Add Dialog but for editing */}
          <div className="relative overflow-hidden lavender-gradient -m-6 mb-6 p-8 rounded-t-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-white flex items-center gap-2">
                  <Edit className="h-7 w-7" />
                  📝 Edit Agenda
                </DialogTitle>
                <DialogDescription className="text-slate-100 text-lg">
                  📊 Perbarui detail agenda dengan akurat
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Same form fields as Add Dialog */}
            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  ✨ Judul Agenda <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul agenda cantik..."
                    className="h-14 pl-14 text-lg border-2 border-pink-200 rounded-2xl focus:border-rose-400 focus:ring-4 focus:ring-rose-200 transition-all duration-300 group-hover/field:shadow-lg bg-white/70 backdrop-blur-sm"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-rose-400">
                    <Heart className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  🎭 Kategori <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">👥 Rapat</SelectItem>
                    <SelectItem value="event">📅 Acara</SelectItem>
                    <SelectItem value="reminder">⏰ Pengingat</SelectItem>
                    <SelectItem value="task">📋 Tugas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="group/field">
              <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                📝 Deskripsi
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan detail agenda..."
                className="min-h-[120px] text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  ⏰ Waktu Mulai <span className="text-blue-600">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  ⏱️ Waktu Selesai <span className="text-blue-600">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  📍 Lokasi
                </Label>
                <div className="relative">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Dimana tempatnya?"
                    className="h-14 pl-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="group/field">
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                  🎯 Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">📅 Terjadwal</SelectItem>
                    <SelectItem value="ongoing">🔄 Berlangsung</SelectItem>
                    <SelectItem value="completed">✅ Selesai</SelectItem>
                    <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 p-6 border-t border-slate-200/50">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedAgenda(null);
                resetForm();
              }}
              className="h-14 px-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-lg rounded-2xl"
            >
              <span className="mr-2">❌</span>
              Batal
            </Button>
            <Button 
              onClick={handleEditAgenda}
              className="h-14 px-8 professional-gradient hover:shadow-2xl text-white font-bold transform hover:scale-105 transition-all duration-300 relative overflow-hidden group text-lg rounded-2xl"
            >
              <div className="absolute inset-0 shimmer-pearl"></div>
              <span className="relative flex items-center gap-2">
                <span>✅</span>
                Update Agenda
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;

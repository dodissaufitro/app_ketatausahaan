import { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncX601ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SyncResult {
  synced: number;
  errors: string[];
  total: number;
}

export function SyncX601Modal({ isOpen, onClose, onSuccess }: SyncX601ModalProps) {
  const [loading, setLoading] = useState(false);
  const [syncDate, setSyncDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [result, setResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await axios.post('/api/attendances/sync-x601/manual', {
        date: syncDate || null,
        employee_id: employeeId || null,
      });

      const data = response.data;
      setResult(data);

      toast({
        title: 'Sync Berhasil',
        description: `${data.synced} data kehadiran berhasil disinkronisasi dari mesin X601`,
        variant: 'default',
      });

      if (data.errors.length === 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal sinkronisasi data dari mesin X601',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSyncDate(new Date().toISOString().split('T')[0]);
    setEmployeeId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sinkronisasi Data dari Mesin X601</DialogTitle>
          <DialogDescription>
            Tarik data kehadiran terbaru dari mesin attendance X601
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              <div>
                <label className="text-sm font-medium">Tanggal (Optional)</label>
                <Input
                  type="date"
                  value={syncDate}
                  onChange={(e) => setSyncDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kosongkan untuk sinkronisasi semua data
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">ID Karyawan (Optional)</label>
                <Input
                  placeholder="Masukkan ID karyawan jika ingin filter"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  ℹ️ Koneksi API:
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  Memastikan konfigurasi X601_API_BASE_URL dan X601_API_KEY sudah benar di file .env
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-900 dark:text-green-200">
                    {result.synced} dari {result.total} data berhasil disinkronisasi
                  </span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-900 dark:text-red-200">
                      {result.errors.length} error
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-red-800 dark:text-red-300">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-red-700 dark:text-red-400">
                        ... dan {result.errors.length - 5} error lainnya
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button onClick={handleSync} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sinkronisasi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

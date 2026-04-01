# Setup Otomatis Sinkronisasi X601 Harian

Script ini akan mengatur sinkronisasi otomatis data absensi dari mesin X601 setiap hari pada pukul 06:00.

## Persyaratan

- Windows dengan Laragon
- PHP dan Composer terinstall
- Akses Administrator untuk Task Scheduler

## Langkah Setup

### 1. Jalankan Script Setup Scheduler

Buka PowerShell sebagai Administrator dan jalankan:

```powershell
cd C:\laragon\www\app_ketatausahaan
.\setup_scheduler.ps1
```

### 2. Verifikasi Setup

- Buka Task Scheduler (cari "Task Scheduler" di Start menu)
- Cari task dengan nama "LaravelScheduler_X601"
- Pastikan task aktif dan berjalan setiap menit

### 3. Test Manual (Opsional)

Untuk test sinkronisasi manual:

```bash
php artisan attendance:sync-x601-daily -v
```

Atau tanpa verbose:

```bash
php artisan attendance:sync-x601-daily
```

## Cara Kerja

1. **Command Baru**: `attendance:sync-x601-daily`
    - Menggunakan method `syncAllAttendance()` untuk sinkronisasi komprehensif
    - Logging detail ke Laravel logs
    - Output verbose untuk debugging

2. **Scheduling**:
    - Dijadwalkan setiap hari pukul 06:00
    - Menggunakan `withoutOverlapping()` untuk mencegah duplikasi
    - Berjalan di background

3. **Task Scheduler Windows**:
    - Script `scheduler.bat` menjalankan `php artisan schedule:run` setiap menit
    - Task Scheduler memastikan script berjalan otomatis

## Monitoring

- **Logs**: Cek `storage/logs/laravel.log` untuk log sinkronisasi
- **Scheduler Logs**: Cek `storage/logs/scheduler.log` untuk log eksekusi scheduler
- **Task Scheduler**: Monitor di Windows Task Scheduler untuk status task

## Troubleshooting

### Task Tidak Berjalan

1. Pastikan script `scheduler.bat` dapat dieksekusi
2. Cek permissions folder Laravel
3. Verifikasi PHP path di environment variables

### Sinkronisasi Gagal

1. Cek koneksi ke mesin X601
2. Lihat logs Laravel untuk error details
3. Test manual dengan `--verbose` flag

### Menghapus Task Scheduler

```powershell
schtasks /delete /tn "LaravelScheduler_X601"
```

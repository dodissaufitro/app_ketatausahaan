# Quick Start Guide - X601 Integration

## 🚀 Setup Awal (5 Menit)

### 1. Configure Environment Variables

Edit `.env` file:

```bash
# Aktifkan X601 API
X601_API_ENABLED=true

# Sesuaikan dengan IP/Port mesin X601 Anda
X601_API_BASE_URL=http://192.168.1.100:8080

# Masukkan API Key dari mesin X601
X601_API_KEY=your_x601_api_key

# Opsional: timeout default 30 detik
X601_API_TIMEOUT=30
```

### 2. Verify Configuration

Pastikan konfigurasi sudah benar:

```bash
# Test via command line
php artisan attendance:sync-x601 --verbose

# Output yang diharapkan:
# ✓ Successfully synced: 150 records
# ✓ No errors encountered
# Total records processed: 150
```

### 3. Test via UI

1. Buka **Kehadiran Karyawan** menu
2. Klik tombol **"Sinkron X601"**
3. Klik **"Sinkronisasi"** (tanpa filter untuk test semua data)
4. Tunggu hasil sync ditampilkan

## 📋 Penggunaan Harian

### Sinkronisasi Manual via UI

1. Dashboard → Menu **Kehadiran Karyawan**
2. Klik **"Sinkron X601"**
3. (Opsional) Pilih tanggal atau ID karyawan
4. Klik **"Sinkronisasi"**
5. Tunggu selesai → Data akan ter-refresh otomatis

### Sinkronisasi via Command Line

```bash
# Sync semua data
php artisan attendance:sync-x601

# Sync tanggal tertentu
php artisan attendance:sync-x601 --date=2025-01-15

# Sync karyawan tertentu
php artisan attendance:sync-x601 --employee-id=E001

# Dengan detail error
php artisan attendance:sync-x601 --verbose
```

## 🔧 Troubleshooting Quick Fix

### Problem: "Connection refused"

**Solusi:**

```bash
# 1. Periksa IP mesin X601
ping 192.168.1.100

# 2. Periksa port berjalan
curl -I http://192.168.1.100:8080

# 3. Update .env dengan IP yang benar
X601_API_BASE_URL=http://192.168.1.100:8080
```

### Problem: "Invalid API Key"

**Solusi:**

```bash
# 1. Minta API Key baru dari admin X601
# 2. Update di .env
X601_API_KEY=new_api_key_here

# 3. Test lagi
php artisan attendance:sync-x601
```

### Problem: "Employee not found"

**Penyebab:** Employee ID di X601 berbeda dengan di sistem

**Solusi:**

```bash
# 1. Check employee ID di sistem
# Dashboard → Karyawan → lihat ID

# 2. Ensure ID di mesin X601 sama
# (contact admin mesin X601)

# 3. Atau sync per karyawan
php artisan attendance:sync-x601 --employee-id=E001
```

### Problem: "No data returned"

**Cek:**

1. Apakah mesin X601 sudah ada data attendance?
2. Apakah API endpoint sudah correct?
3. Cek log: `storage/logs/laravel.log`

## 📊 Monitoring

### Check Log

```bash
# Recent logs
tail -f storage/logs/laravel.log

# Filter X601 logs
grep "X601" storage/logs/laravel.log

# Filter errors
grep "Error\|Exception" storage/logs/laravel.log
```

### Automated Daily Sync (Optional)

Edit `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Sync setiap hari jam 23:00 (malam)
    $schedule->command('attendance:sync-x601')
        ->dailyAt('23:00')
        ->withoutOverlapping()
        ->onFailure(function () {
            // handle error
        })
        ->onSuccess(function () {
            // Log success
        });
}
```

Lalu set up cron:

```bash
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

## ✅ Checklist Setup

-   [ ] X601 machine tersedia dan online
-   [ ] API endpoint accessible (bisa di-ping)
-   [ ] API Key didapat dari admin X601
-   [ ] .env sudah update dengan konfigurasi X601
-   [ ] Employee ID di sistem sama dengan di mesin X601
-   [ ] Test sync via CLI: `php artisan attendance:sync-x601`
-   [ ] Test sync via UI: dashboard → Sinkron X601
-   [ ] Data attendance muncul di tabel

## 🆘 Need Help?

1. **Check logs**: `storage/logs/laravel.log`
2. **Test connectivity**: `curl http://X601_IP:PORT`
3. **Test API**: Use Postman/Insomnia dengan headers:
    ```
    Authorization: Bearer YOUR_API_KEY
    Accept: application/json
    ```
4. **Contact X601 Admin** untuk format API documentation

---

**Note**: Untuk setup production, lihat `X601_INTEGRATION_GUIDE.md`

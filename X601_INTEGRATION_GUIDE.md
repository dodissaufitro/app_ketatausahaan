# Integrasi API Mesin X601

## Deskripsi

Fitur ini memungkinkan Anda untuk mengintegrasikan data attendance dari mesin attendance Solution X601 secara otomatis ke dalam sistem HRIS.

## Konfigurasi

### 1. Konfigurasi Environment Variables

Edit file `.env` di root project dan tambahkan/update konfigurasi X601:

```env
# X601 Machine API Configuration
X601_API_ENABLED=true
X601_API_BASE_URL=http://your-x601-machine-ip:port
X601_API_KEY=your_api_key_here
X601_API_TIMEOUT=30
```

**Parameter:**

-   `X601_API_ENABLED`: Status aktif/nonaktif integrasi (true/false)
-   `X601_API_BASE_URL`: URL base API mesin X601 (contoh: http://192.168.1.100:8080)
-   `X601_API_KEY`: API Key dari mesin X601 untuk autentikasi
-   `X601_API_TIMEOUT`: Timeout request dalam detik (default: 30)

### 2. Setup Mesin X601

Pastikan mesin X601 Anda:

-   Telah dikonfigurasi dengan benar
-   API endpoint tersedia dan bisa diakses
-   Memiliki API Key yang valid
-   Database karyawan sudah tersinkronisasi

## Cara Penggunaan

### Melalui Dashboard (UI)

1. Navigasi ke menu **Kehadiran Karyawan**
2. Klik tombol **"Sinkron X601"** di bagian atas halaman
3. Pilih opsi filter (opsional):
    - **Tanggal**: Untuk sinkronisasi data pada tanggal tertentu
    - **ID Karyawan**: Untuk sinkronisasi data karyawan tertentu
4. Klik tombol **"Sinkronisasi"**
5. Tunggu proses sinkronisasi selesai
6. Lihat hasil: jumlah data berhasil dan error (jika ada)

### Melalui API

**Endpoint untuk Sinkronisasi:**

```
POST /api/attendances/sync-x601/manual
```

**Request Body:**

```json
{
    "date": "2025-01-15", // Optional, format: Y-m-d
    "employee_id": "E001" // Optional, ID karyawan
}
```

**Response Success (200/207):**

```json
{
    "synced": 45,
    "errors": [],
    "total": 45
}
```

**Response dengan Errors:**

```json
{
    "synced": 42,
    "errors": [
        "Employee not found: E999",
        "Error processing employee E998: Invalid time format"
    ],
    "total": 45
}
```

### Melalui Scheduled Task (Cron)

Untuk otomasi sinkronisasi harian, tambahkan ke `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Sinkronisasi setiap hari jam 23:00
    $schedule->call(function () {
        $service = app(\App\Services\X601AttendanceService::class);
        $result = $service->syncAttendance();
        \Log::info('X601 daily sync completed', $result);
    })->dailyAt('23:00');
}
```

## Data Mapping

Sistem akan melakukan mapping otomatis dari format X601 ke database lokal:

| X601 Field | Database Field | Format | Keterangan                                        |
| ---------- | -------------- | ------ | ------------------------------------------------- |
| emp_id     | employee_id    | String | Harus sesuai dengan ID karyawan di sistem         |
| date       | date           | Y-m-d  | Tanggal kehadiran                                 |
| check_in   | check_in       | H:i:s  | Jam masuk                                         |
| check_out  | check_out      | H:i:s  | Jam keluar                                        |
| -          | status         | String | Auto-calculated (present, late, absent, half-day) |
| -          | work_hours     | Float  | Auto-calculated dari check_in dan check_out       |

## Logika Penentuan Status

Status kehadiran ditentukan secara otomatis:

-   **ABSENT (Absen)**: Tidak ada check_in
-   **LATE (Terlambat)**: Ada check_in setelah jam 07:00
-   **HALF-DAY (Setengah Hari)**: Ada check_in tapi tidak ada check_out
-   **PRESENT (Hadir)**: Ada check_in sebelum jam 07:00 dan ada check_out

## Troubleshooting

### Error: "Connection refused"

-   Pastikan X601_API_BASE_URL sudah benar
-   Periksa apakah mesin X601 menyala dan API aktif
-   Cek firewall/network connectivity

### Error: "Employee not found"

-   Pastikan employee_id di mesin X601 sesuai dengan database HRIS
-   Gunakan fitur mapping ID jika formatnya berbeda

### Error: "Invalid API Key"

-   Periksa X601_API_KEY di .env file
-   Minta API Key baru dari admin mesin X601

### Data tidak terupdate

-   Pastikan X601_API_ENABLED = true di .env
-   Check log file di `storage/logs/laravel.log`
-   Pastikan ada koneksi internet ke mesin X601

## API Response Format yang Diharapkan

Format data yang dikembalikan API X601 harus sesuai:

```json
[
    {
        "emp_id": "E001",
        "date": "2025-01-15",
        "check_in": "07:30:00",
        "check_out": "16:30:00"
    },
    {
        "emp_id": "E002",
        "date": "2025-01-15",
        "check_in": "08:15:00",
        "check_out": null
    }
]
```

## Log & Monitoring

Semua aktivitas sinkronisasi dicatat di:

-   **File Log**: `storage/logs/laravel.log`
-   **Database**: Bisa dilihat dari perubahan tabel `attendances`

### Contoh Log Entry:

```
[2025-01-15 23:00:15] local.INFO: X601 daily sync completed {"synced":150,"errors":[],"total":150}
```

## Keamanan

-   Jangan share X601_API_KEY di repository
-   Selalu gunakan HTTPS untuk komunikasi dengan mesin X601
-   Batasi akses API endpoint dengan permission `manage_attendances`
-   Review log secara berkala untuk deteksi anomali

## Support

Untuk bantuan lebih lanjut:

1. Check documentation mesin X601
2. Lihat log di `storage/logs/laravel.log`
3. Hubungi developer mesin X601 untuk format API

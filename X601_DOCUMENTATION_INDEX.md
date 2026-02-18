# X601 Attendance Machine Integration - Documentation Index

Dokumentasi lengkap untuk integrasi Mesin Attendance Solution X601 ke dalam sistem HRIS.

## 📚 Dokumentasi Tersedia

### 1. **X601_QUICKSTART.md** ⚡

-   **Untuk:** Pengguna akhir dan admin yang ingin setup cepat
-   **Isi:**
    -   Setup 5 menit
    -   Penggunaan harian
    -   Quick troubleshooting
    -   Checklist setup
-   **Start here if:** Anda baru pertama kali setup

### 2. **X601_INTEGRATION_GUIDE.md** 📖

-   **Untuk:** Admin dan technical staff
-   **Isi:**
    -   Panduan setup lengkap
    -   Cara penggunaan (UI, API, CLI)
    -   Data mapping explanation
    -   Logika status determination
    -   Troubleshooting detail
    -   Security best practices
-   **Start here if:** Anda perlu panduan komprehensif

### 3. **X601_CONFIGURATION_EXAMPLES.md** 🔧

-   **Untuk:** Sistem administrator dan developer
-   **Isi:**
    -   7 contoh konfigurasi berbeda
    -   Setup lokal, network, cloud, proxy, dual machine
    -   Performance tips
    -   Security best practices
    -   Migration guide
-   **Start here if:** Setup Anda unique atau non-standard

### 4. **X601_INTEGRATION_TECHNICAL_SUMMARY.md** 🛠️

-   **Untuk:** Developer dan technical architect
-   **Isi:**
    -   Arsitektur sistem
    -   Komponen yang dibuat
    -   Data flow diagram
    -   Code structure
    -   Testing strategy
    -   Performance considerations
-   **Start here if:** Anda perlu understand technical implementation

### 5. **X601_POSTMAN_COLLECTION.json** 🧪

-   **Untuk:** Testing API endpoints
-   **Isi:**
    -   Pre-built Postman requests
    -   5 request examples (sync, fetch, get, filter)
    -   Variable configuration
-   **How to use:**
    ```
    1. Import file ke Postman
    2. Set variable base_url sesuai localhost Anda
    3. Run requests untuk testing
    ```

## 🎯 Quick Navigation

### Saya ingin...

#### ...setup X601 integration untuk pertama kali

👉 Baca: **X601_QUICKSTART.md**

-   5 menit setup
-   Test di UI
-   Basic troubleshooting

#### ...memahami semua fitur dan cara kerja

👉 Baca: **X601_INTEGRATION_GUIDE.md**

-   Setup lengkap
-   Semua metode penggunaan (UI, API, CLI)
-   Troubleshooting detail

#### ...setup dengan konfigurasi special (cloud, proxy, etc)

👉 Baca: **X601_CONFIGURATION_EXAMPLES.md**

-   7 contoh konfigurasi
-   Custom setup guide
-   Performance optimization

#### ...memahami technical implementation

👉 Baca: **X601_INTEGRATION_TECHNICAL_SUMMARY.md**

-   Architecture diagram
-   Code structure
-   Component details

#### ...test API endpoints

👉 Gunakan: **X601_POSTMAN_COLLECTION.json**

-   Import ke Postman
-   Pre-built requests

---

## 📋 Files & Komponen yang Dibuat

### Backend (Laravel/PHP)

```
app/
├── Services/
│   └── X601AttendanceService.php          [Sync logic]
├── Http/Controllers/
│   └── AttendanceController.php           [API endpoints]
└── Console/Commands/
    └── SyncX601Attendance.php             [CLI command]

config/
└── services.php                            [Config setup]

routes/
└── web.php                                 [API routes]
```

### Frontend (React/TypeScript)

```
resources/js/
├── components/attendance/
│   └── SyncX601Modal.tsx                  [UI Modal component]
└── pages/dashboard/
    └── Attendance.tsx                     [Updated page]
```

### Konfigurasi

```
.env                                        [Environment variables]
.env.example                                [Example template]
config/services.php                         [Service config]
```

### Dokumentasi

```
X601_QUICKSTART.md                          [Quick start guide]
X601_INTEGRATION_GUIDE.md                   [Full documentation]
X601_CONFIGURATION_EXAMPLES.md              [Configuration examples]
X601_INTEGRATION_TECHNICAL_SUMMARY.md       [Technical details]
X601_POSTMAN_COLLECTION.json                [API testing]
```

---

## 🚀 Quick Start (30 Detik)

```bash
# 1. Edit .env
X601_API_ENABLED=true
X601_API_BASE_URL=http://192.168.1.100:8080
X601_API_KEY=your_api_key

# 2. Test
php artisan attendance:sync-x601

# 3. UI
Dashboard → Kehadiran → Sinkron X601 → Sinkronisasi
```

---

## 🔑 Key Features

✅ **Real-time Sync**

-   Tarik data dari mesin X601 kapan saja
-   Manual trigger via UI atau CLI

✅ **Auto Status Detection**

-   Status kehadiran auto-calculated (Present, Late, Absent, Half-day)
-   Work hours auto-calculated

✅ **Error Handling**

-   Graceful error handling
-   Detailed error reporting
-   Partial success capability

✅ **Security**

-   API key based authentication
-   Permission based access
-   Secure logging

✅ **Flexibility**

-   Support multiple config (lokal, network, cloud, proxy)
-   Support failover setup
-   Custom mapping support

---

## 📊 API Endpoints

### Sinkronisasi Manual

```
POST /api/attendances/sync-x601/manual
Body: { "date": "2025-01-15", "employee_id": "E001" }
Response: { "synced": 45, "errors": [], "total": 45 }
```

### Preview Data X601

```
GET /api/attendances/fetch-x601/preview?date=2025-01-15
Response: { "data": [...] }
```

---

## 🛠️ CLI Commands

### Sync Semua Data

```bash
php artisan attendance:sync-x601
```

### Sync Tanggal Tertentu

```bash
php artisan attendance:sync-x601 --date=2025-01-15
```

### Sync Karyawan Tertentu

```bash
php artisan attendance:sync-x601 --employee-id=E001
```

### Dengan Detail Output

```bash
php artisan attendance:sync-x601 --verbose
```

---

## ✅ Setup Checklist

-   [ ] Baca **X601_QUICKSTART.md**
-   [ ] Update `.env` dengan konfigurasi X601
-   [ ] Test via CLI: `php artisan attendance:sync-x601`
-   [ ] Test via UI: Dashboard → Sinkron X601
-   [ ] Verify data di database
-   [ ] Setup scheduled sync (optional)
-   [ ] Monitor logs regular

---

## 🆘 Troubleshooting

### Error: Connection refused

→ Check X601_API_BASE_URL, ping mesin X601

### Error: Employee not found

→ Ensure employee ID sama antara sistem dan X601

### Error: Invalid API Key

→ Check X601_API_KEY di .env

### No data synced

→ Check log: `tail -f storage/logs/laravel.log`

**More help:** Baca `X601_INTEGRATION_GUIDE.md` - Troubleshooting section

---

## 📞 Support Resources

1. **Quick Questions** → **X601_QUICKSTART.md**
2. **How-to Guide** → **X601_INTEGRATION_GUIDE.md**
3. **Custom Setup** → **X601_CONFIGURATION_EXAMPLES.md**
4. **Technical Details** → **X601_INTEGRATION_TECHNICAL_SUMMARY.md**
5. **API Testing** → **X601_POSTMAN_COLLECTION.json**

---

## 🔄 Update History

| Version | Date       | Changes                |
| ------- | ---------- | ---------------------- |
| 1.0     | 2025-01-15 | Initial implementation |

---

## 📝 Notes

-   All documentation dalam Bahasa Indonesia dan English examples
-   Configuration bisa di-change anytime tanpa restart
-   Data sync non-destructive (update existing, create new)
-   Recommended: Setup automated daily sync via cron

---

**Version: 1.0** | **Last Updated: 2025-01-15**

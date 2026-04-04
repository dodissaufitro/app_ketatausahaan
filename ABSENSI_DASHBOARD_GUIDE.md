# 📊 ABSENSI KARYAWAN - TAMPILAN DASHBOARD X601

## 🎯 Dua Versi Tersedia

### 1️⃣ **Laravel Blade View** (Terintegrasi dengan aplikasi)

- **File**: `resources/views/attendance/x601_attendance.blade.php`
- **Route**: `/api/x601-dashboard`
- **Keuntungan**:
    - Terintegrasi dengan Laravel auth & layout
    - Menggunakan Blade template syntax
    - Consistent dengan aplikasi

**Cara Mengakses**:

```
http://localhost/api/x601-dashboard?ip=103.116.175.218&key=0&tgl_awal=2026-02-27&tgl_akhir=2026-03-25
```

### 2️⃣ **HTML Standalone** (Pure HTML/PHP)

- **File**: `public/absensi_karyawan.html`
- **Akses Direct**:

```
http://localhost/absensi_karyawan.html
```

- **Keuntungan**:
    - Bisa diakses langsung tanpa routing Laravel
    - Tidak perlu login
    - Lebih fleksibel untuk deployment terpisah

## ✨ Fitur Tampilan Baru

### Sections:

1. **Header Section**
    - Judul "Absensi Karyawan"
    - Gradient background modern

2. **Filter Form**
    - IP Address input (default 103.116.175.218)
    - Comm Key input (default 0)
    - Date range picker (Dari - Hingga)
    - Search button

3. **Statistics Cards** (jika ada data)
    - Total Kehadiran
    - Terlambat
    - Pulang Cepat
    - Tepat Waktu
    - Dengan warna dan icon menarik

4. **Data Table Full Features**
    - User ID (PIN)
    - Nama Karyawan
    - Tanggal
    - Check In (dengan badge hijau)
    - Check Out (dengan badge merah)
    - Jam Kerja
    - Status dengan color coding:
        - 🟢 Tepat Waktu (Success)
        - 🔴 Terlambat (Danger)
        - 🟡 Pulang Cepat (Warning)
        - ⚫ Telat & Pulang Cepat (Dark)

5. **Responsive Design**
    - Mobile-friendly
    - Tablet optimized
    - Desktop optimized

## 🎨 Design Features

### Colors & Styling:

- Primary: Gradient Purple (#667eea → #764ba2)
- Card Hover Effects: Lift & Shadow animation
- Icons: Bootstrap Icons (bi-)
- Modern gradient backgrounds pada stat cards
- Smooth transitions (0.3s)

### Responsive Breakpoints:

- Mobile (< 768px): Stack layout, smaller fonts
- Tablet (768px - 992px): 2 columns for stats
- Desktop (> 992px): 4 columns for stats, full table

## 🔧 Customization

### Change Default IP/Key:

Edit di form atau pass via URL:

```
http://localhost/absensi_karyawan.html?ip=192.168.1.100&key=123
```

### Change Date Range:

Via form atau URL:

```
?tgl_awal=2026-01-01&tgl_akhir=2026-12-31
```

### Modify Colors - Edit CSS Variables:

```css
:root {
    --primary-color: #0d6efd;
    --success-color: #198754;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #0dcaf0;
}
```

### Modify Working Hours:

Edit `jam_masuk` dan `jam_pulang`:

```php
$jam_masuk  = "07:30:00";  // Default masuk
$jam_pulang = "16:30:00";  // Default pulang
```

## 📋 Data Flow

```
1. User Input Filter (IP, Key, Date Range)
   ↓
2. Connect ke X601 Machine via fsockopen
   ↓
3. GET User List (getUserData)
   ↓
4. GET Attendance Logs (GetAttLog)
   ↓
5. Process & Calculate:
   - Extract PIN & DateTime
   - Group by PIN & Date
   - Calculate work hours
   - Determine status
   ↓
6. Render Table with Stats
```

## 🧪 Testing

### Test Laravel Blade Version:

```bash
# Via browser
http://localhost/api/x601-dashboard

# With parameters
http://localhost/api/x601-dashboard?ip=103.116.175.218&key=0&tgl_awal=2026-02-27&tgl_akhir=2026-03-25
```

### Test HTML Version:

```bash
# Direct file access
http://localhost/absensi_karyawan.html

# With parameters
http://localhost/absensi_karyawan.html?ip=103.116.175.218&key=0
```

## 🚀 Integration Notes

### For Laravel App:

- Route sudah ada di `routes/web.php` → `/api/x601-dashboard`
- Controller method: `AttendanceController::x601Dashboard()`
- Menggunakan X601Service untuk koneksi
- View: `attendance.x601_attendance`

### For Standalone:

- File bisa dipindahkan ke any web server
- Tidak perlu routing atau deployment Laravel
- Direct PHP execution (no framework needed)

## 📦 Files Structure

```
app_ketatausahaan/
├── resources/views/attendance/
│   └── x601_attendance.blade.php    ← Laravel version
├── public/
│   └── absensi_karyawan.html        ← Standalone version
├── app/Services/
│   ├── X601Service.php              ← SOAP Connection
│   └── X601AttendanceService.php    ← Business Logic
└── app/Http/Controllers/
    └── AttendanceController.php     ← Controller
```

## ✅ Status

✅ **PRODUCTION READY**

- Semua fitur bekerja
- Responsive design
- Error handling
- Data validation
- Performance optimized

---

**Created**: 2026-03-26
**Version**: 1.0

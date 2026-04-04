# Contoh Integrasi Leave dengan Attendance

## 📋 Ringkasan Fitur

Sistem attendance sekarang **terintegrasi penuh dengan sistem leave (cuti/izin)**. Ketika karyawan mengajukan cuti dan disetujui, status attendance akan **otomatis mengikuti jenis leave** yang diajukan.

---

## 🎯 Mapping Status Leave ke Attendance

| Jenis Leave                       | Status Attendance | Badge           | Icon            | Warna  |
| --------------------------------- | ----------------- | --------------- | --------------- | ------ |
| **Cuti Tahunan** (`annual`)       | `on-leave`        | Cuti            | 📅 CalendarDays | Biru   |
| **Sakit** (`sick`)                | `sick-leave`      | Sakit           | 🩺 Stethoscope  | Orange |
| **Izin Pribadi** (`personal`)     | `personal-leave`  | Izin            | 👤 User         | Ungu   |
| **Cuti Melahirkan** (`maternity`) | `maternity-leave` | Cuti Melahirkan | 👶 Baby         | Pink   |
| **Cuti Ayah** (`paternity`)       | `paternity-leave` | Cuti Ayah       | ❤️ Heart        | Indigo |

---

## 🔄 Alur Proses

### 1. **Pengajuan Cuti**

```
Karyawan mengajukan cuti → Status: pending
```

### 2. **Persetujuan Cuti**

```
Atasan menyetujui → Status: approved → Otomatis membuat attendance records
```

Ketika leave disetujui, sistem akan:

- ✅ Membuat record attendance untuk setiap tanggal di range leave
- ✅ Set `status` sesuai jenis leave
- ✅ Set `source` = `'leave'`
- ✅ Set `leaveType` = jenis leave (annual/sick/personal/maternity/paternity)
- ✅ Set `check_in` dan `check_out` = NULL (karena tidak hadir)

### 3. **Penolakan Cuti**

```
Atasan menolak → Status: rejected → Attendance records dihapus (jika ada)
```

### 4. **Sinkronisasi X601**

```
Sync X601 dilakukan → Sistem cek apakah karyawan punya leave approved
```

**Jika karyawan memiliki leave approved:**

- ⛔ **TIDAK mengupdate** data attendance leave
- ✅ Status tetap sesuai jenis leave
- ✅ Source tetap `'leave'`

**Jika karyawan TIDAK memiliki leave:**

- ✅ Update `check_in` dan `check_out` dari X601
- ✅ Hitung status (present/late/half-day)
- ✅ Source = `'x601'`

---

## 💻 Implementasi Backend

### AttendanceController@index

```php
public function index(Request $request)
{
    $date = $request->input('date', now()->format('Y-m-d'));

    // Query semua karyawan aktif
    $employees = Employee::where('status', 'active')->get();

    $attendances = [];

    foreach ($employees as $employee) {
        // Cek apakah ada leave yang approved pada tanggal ini
        $approvedLeave = Leave::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->first();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $date)
            ->first();

        if ($approvedLeave) {
            // Override status dengan leave type
            if ($attendance) {
                $attendance->status = $this->getLeaveStatus($approvedLeave->type);
                $attendance->source = 'leave';
                $attendance->leaveType = $approvedLeave->type;
            } else {
                // Buat attendance baru dengan status leave
                $attendance = new Attendance([
                    'employee_id' => $employee->id,
                    'date' => $date,
                    'status' => $this->getLeaveStatus($approvedLeave->type),
                    'source' => 'leave',
                    'leaveType' => $approvedLeave->type,
                ]);
            }
        } elseif (!$attendance) {
            // Tidak ada attendance dan tidak ada leave = absent
            $attendance = new Attendance([
                'employee_id' => $employee->id,
                'date' => $date,
                'status' => 'absent',
                'source' => 'system',
            ]);
        }

        $attendance->employee = $employee;
        $attendances[] = $attendance;
    }

    return response()->json($attendances);
}

private function getLeaveStatus(string $leaveType): string
{
    return match($leaveType) {
        'annual' => 'on-leave',
        'sick' => 'sick-leave',
        'personal' => 'personal-leave',
        'maternity' => 'maternity-leave',
        'paternity' => 'paternity-leave',
        default => 'on-leave',
    };
}
```

---

## 🎨 Implementasi Frontend

### Badge Status di Attendance.tsx

```typescript
const getStatusBadge = (status: Attendance['status']) => {
  const config = {
    present: {
      icon: CheckCircle,
      label: 'Tepat Waktu',
      className: 'bg-success/10 text-success',
    },
    late: {
      icon: AlertCircle,
      label: 'Terlambat',
      className: 'bg-warning/10 text-warning',
    },
    absent: {
      icon: XCircle,
      label: 'Absen',
      className: 'bg-destructive/10 text-destructive',
    },
    'on-leave': {
      icon: CalendarDays,
      label: 'Cuti',
      className: 'bg-blue-500/10 text-blue-600',
    },
    'sick-leave': {
      icon: Stethoscope,
      label: 'Sakit',
      className: 'bg-orange-500/10 text-orange-600',
    },
    'personal-leave': {
      icon: User,
      label: 'Izin',
      className: 'bg-purple-500/10 text-purple-600',
    },
    'maternity-leave': {
      icon: Baby,
      label: 'Cuti Melahirkan',
      className: 'bg-pink-500/10 text-pink-600',
    },
    'paternity-leave': {
      icon: Heart,
      label: 'Cuti Ayah',
      className: 'bg-indigo-500/10 text-indigo-600',
    },
  };

  const { icon: Icon, label, className } = config[status] || config.absent;
  return (
    <Badge variant="secondary" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};
```

### Badge Source

```typescript
const getSourceBadge = (source: Attendance["source"]) => {
    const config = {
        x601: {
            icon: Cpu,
            label: "X601",
            className: "bg-blue-500/10 text-blue-600",
        },
        manual: {
            icon: User,
            label: "Manual",
            className: "bg-gray-500/10 text-gray-600",
        },
        system: {
            icon: AlertCircle,
            label: "Tidak Hadir",
            className: "bg-red-500/10 text-red-600",
        },
        leave: {
            icon: CalendarDays,
            label: "Cuti/Izin",
            className: "bg-green-500/10 text-green-600",
        },
    };
    // ...
};
```

---

## 📊 Contoh Data

### Menjalankan Seeder Demo

```bash
php artisan db:seed --class=LeaveAttendanceExampleSeeder
```

Seeder akan membuat 5 contoh leave:

1. **Cuti Tahunan** - Karyawan 1, 3 hari (hari ini +1 s/d +3)
2. **Sakit** - Karyawan 2, 3 hari (hari ini s/d +2)
3. **Izin Pribadi** - Karyawan 3, 1 hari (hari ini +5)
4. **Cuti Melahirkan** - Karyawan 4, 90 hari (hari ini +7 s/d +97)
5. **Cuti Ayah** - Karyawan 5, 3 hari (hari ini +10 s/d +12)

### Contoh Manual SQL

```sql
-- Buat leave cuti tahunan
INSERT INTO leaves (employee_id, type, start_date, end_date, reason, status, applied_date, created_at, updated_at)
VALUES (1, 'annual', '2025-02-01', '2025-02-03', 'Liburan keluarga', 'approved', NOW(), NOW(), NOW());

-- Buat attendance untuk leave (manual, atau akan auto-create ketika leave approved)
INSERT INTO attendances (employee_id, date, status, source, check_in, check_out, created_at, updated_at)
VALUES
(1, '2025-02-01', 'on-leave', 'leave', NULL, NULL, NOW(), NOW()),
(1, '2025-02-02', 'on-leave', 'leave', NULL, NULL, NOW(), NOW()),
(1, '2025-02-03', 'on-leave', 'leave', NULL, NULL, NOW(), NOW());
```

---

## 🧪 Testing

### 1. Test Tampilan Attendance

```bash
# Akses halaman attendance
http://localhost/attendance?date=2025-02-01
```

**Expected Result:**

- Karyawan dengan leave approved tampil dengan badge sesuai jenis leave
- Source badge menampilkan "Cuti/Izin" warna hijau
- Check-in dan check-out kosong

### 2. Test Sinkronisasi X601

```bash
# Trigger sync X601
POST /api/attendance/sync-x601
{
  "date": "2025-02-01"
}
```

**Expected Result:**

- Karyawan dengan leave: attendance TIDAK berubah, tetap status leave
- Karyawan tanpa leave: attendance ter-update dari X601

### 3. Test Approval Leave

```bash
# Approve leave
PUT /api/leaves/{id}
{
  "status": "approved"
}
```

**Expected Result:**

- Attendance records otomatis dibuat untuk setiap tanggal
- Status sesuai jenis leave
- Source = 'leave'

---

## 📱 Screenshot UI (Expected)

```
┌─────────────────────────────────────────────────────────────┐
│ Kehadiran - 1 Februari 2025                                 │
├─────────────────────────────────────────────────────────────┤
│ Nama          │ Status              │ Source        │ Waktu │
├───────────────┼─────────────────────┼───────────────┼───────┤
│ Ahmad Yani    │ [📅 Cuti]          │ [📅 Cuti/Izin]│  -    │
│ Siti Nurhaliza│ [🩺 Sakit]         │ [📅 Cuti/Izin]│  -    │
│ Budi Santoso  │ [✓ Tepat Waktu]    │ [🖥️ X601]    │ 07:15 │
│ Dewi Lestari  │ [⚠ Terlambat]      │ [🖥️ X601]    │ 07:45 │
│ Eko Prasetyo  │ [✗ Absen]          │ [⚠ Tidak Hadir]│  -   │
└─────────────────────────────────────────────────────────────┘
```

Legend:

- 📅 Cuti (Biru) - Cuti tahunan
- 🩺 Sakit (Orange) - Izin sakit
- 👤 Izin (Ungu) - Izin pribadi
- 👶 Cuti Melahirkan (Pink)
- ❤️ Cuti Ayah (Indigo)

---

## 🚀 Cara Penggunaan di Aplikasi

### 1. **Sebagai Karyawan:**

- Buka menu **Leave/Cuti**
- Klik **Ajukan Cuti**
- Pilih jenis cuti (tahunan/sakit/izin)
- Pilih tanggal mulai dan akhir
- Isi alasan
- Submit → Status: Pending

### 2. **Sebagai Atasan:**

- Buka menu **Leave/Cuti**
- Lihat pengajuan pending
- Klik **Approve** atau **Reject**
- Jika approve → Attendance otomatis dibuat

### 3. **Melihat Attendance:**

- Buka menu **Attendance/Kehadiran**
- Pilih tanggal
- Karyawan dengan leave approved akan tampil dengan status cuti/izin
- Badge berwarna sesuai jenis leave

### 4. **Sinkronisasi X601:**

- Attendance dengan status leave **TIDAK akan ter-overwrite**
- Data check-in/check-out karyawan lain tetap ter-update
- Status leave tetap preserved

---

## ⚠️ Catatan Penting

1. **Leave harus approved** untuk status attendance berubah
2. **Pending leave tidak mempengaruhi** attendance
3. **Rejected leave** akan menghapus attendance records yang sudah dibuat
4. **Sync X601 tidak mengoverwrite** attendance dengan source 'leave'
5. **Frontend badge** akan otomatis menyesuaikan warna dan icon

---

## 🔧 Troubleshooting

### Problem: Leave approved tapi status attendance tidak berubah

**Solusi:**

```bash
# Clear cache Laravel
php artisan config:cache
php artisan cache:clear
```

### Problem: Badge tidak muncul di frontend

**Solusi:**

```bash
# Rebuild TypeScript/React
npm run build
```

### Problem: Attendance tidak otomatis dibuat saat approve

**Solusi:**

- Pastikan method `createAttendanceRecords()` ada di model Leave
- Cek observer `LeaveObserver` sudah registered
- Lihat log Laravel: `storage/logs/laravel.log`

---

## ✅ Checklist Implementasi

- [x] Backend: Mapping leave type ke attendance status
- [x] Backend: Integrasi Leave query di AttendanceController
- [x] Backend: Preserve leave attendance saat sync X601
- [x] Frontend: TypeScript types untuk leave statuses
- [x] Frontend: Badge configurations untuk semua leave types
- [x] Frontend: Icon imports (CalendarDays, Stethoscope, Baby, Heart)
- [x] Database: Seeder untuk contoh data
- [x] Documentation: Guide lengkap

---

**🎉 Fitur integrasi leave dengan attendance sudah lengkap!**

Selamat mencoba! Jika ada pertanyaan atau issue, silakan cek dokumentasi atau hubungi tim developer.

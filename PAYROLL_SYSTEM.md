# SISTEM PENGGAJIAN (PAYROLL)

## ✅ Implementasi Lengkap

Sistem penggajian otomatis yang mengambil data gaji dari master karyawan dan menghitung potongan berdasarkan kehadiran.

## 🎯 Fitur Utama

### 1. **Generate Payroll Otomatis**

-   Gaji dasar diambil dari field `salary` di tabel `employees`
-   Potongan keterlambatan: Rp 10.000 per kejadian
-   Hitung otomatis berdasarkan attendance bulan tersebut

### 2. **Command Line**

```bash
# Generate payroll untuk bulan ini
php artisan payroll:generate

# Generate payroll untuk bulan tertentu
php artisan payroll:generate 2025-11

# Generate untuk karyawan tertentu
php artisan payroll:generate --employee-id=13

# Generate untuk bulan tertentu dan karyawan tertentu
php artisan payroll:generate 2025-11 --employee-id=13
```

### 3. **Frontend - Generate via Web**

-   Login sebagai admin/superadmin
-   Buka halaman `/dashboard/payroll`
-   Pilih bulan
-   Klik tombol **"Generate Payroll"**
-   Sistem akan membuat slip gaji untuk semua karyawan aktif

### 4. **API Endpoint**

```
POST /api/payrolls/process-all
Body: { "month": "2025-12" }

POST /api/payrolls/process
Body: { "employee_id": 13, "month": "2025-12" }
```

## 📊 Komponen Gaji

### Base Salary (Gaji Pokok)

-   Diambil dari `employees.salary`
-   Otomatis terisi saat generate payroll

### Allowances (Tunjangan)

-   Default: 0
-   Bisa ditambahkan manual saat edit payroll

### Deductions (Potongan)

-   Default: 0
-   Bisa ditambahkan manual untuk potongan lain

### Late Deductions (Potongan Keterlambatan)

-   **Otomatis dihitung** dari data attendance
-   **Rumus**: `total_jam_keterlambatan × Rp 50.000`
-   Jam standar masuk: **08:00**
-   Contoh: Check-in 08:15 = 0.25 jam terlambat (dibulatkan ke atas jadi 1 jam)
-   Keterlambatan diambil dari `attendances` dengan `status = 'late'`

### Net Salary (Gaji Bersih)

-   Rumus: `base_salary + allowances - deductions - late_deductions`
-   Dihitung otomatis

## 📋 Status Payroll

1. **Pending** - Baru dibuat, belum diproses
2. **Processed** - Sudah diproses, siap dibayar
3. **Paid** - Sudah dibayarkan

## 🔄 Workflow

```
Generate Payroll → Pending → Process → Paid
```

### Proses Detail:

1. **Generate**: Buat slip gaji berdasarkan data employee dan attendance
2. **Process**: Admin memverifikasi dan memproses
3. **Paid**: Tandai sebagai sudah dibayar

## 💡 Contoh Penggunaan

### Scenario 1: Generate untuk Semua Karyawan

```bash
php artisan payroll:generate
```

Output:

```
Generating payroll for month: 2025-12
Processing 3 employee(s)...

Created payroll for Dodis Saufitroa (EM0010)
  Base Salary: Rp 10.170.000
  Late Deductions: Rp 0 (0 times late)
  Net Salary: Rp 10.170.000

Created payroll for Rizky arfian (EMP001)
  Base Salary: Rp 7.500.000
  Late Deductions: Rp 0 (0 times late)
  Net Salary: Rp 7.500.000

Created payroll for Sekar Dwi Galu (EMP002)
  Base Salary: Rp 5.700.000
  Late Deductions: Rp 10.000 (1 times late)
  Net Salary: Rp 5.690.000

Payroll generation completed!
+----------------+-------+
| Status         | Count |
+----------------+-------+
| Created        | 3     |
| Already Exists | 0     |
| Errors         | 0     |
| Total          | 3     |
+----------------+-------+
```

### Scenario 2: Generate via Web Interface

1. Login sebagai admin
2. Pilih bulan: December 2025
3. Klik "Generate Payroll"
4. Sistem membuat slip gaji untuk 3 karyawan
5. Total gaji: Rp 23.360.000

## 🗄️ Database Structure

```sql
payrolls
├── id (primary)
├── employee_id (foreign key → employees)
├── month (YYYY-MM)
├── base_salary (dari employees.salary)
├── allowances (input manual)
├── deductions (input manual)
├── late_deductions (otomatis dari attendance)
├── late_count (jumlah keterlambatan)
├── net_salary (calculated)
└── status (pending/processed/paid)
```

## ⚡ Automation

Untuk menjalankan generate payroll otomatis setiap bulan, tambahkan ke scheduler:

**File**: `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    // Generate payroll pada tanggal 1 setiap bulan jam 00:00
    $schedule->command('payroll:generate')
        ->monthlyOn(1, '00:00');
}
```

Jalankan cron:

```bash
* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
```

## 📈 Statistik

Di halaman payroll, admin dapat melihat:

-   **Total Gaji Bulan Ini**: Jumlah semua net_salary
-   **Total Tunjangan**: Jumlah semua allowances
-   **Total Potongan**: Jumlah deductions + late_deductions

## ✅ Checklist

-   [x] Command untuk generate payroll
-   [x] Generate via API
-   [x] Generate via web interface
-   [x] Otomatis ambil gaji dari employee
-   [x] Otomatis hitung potongan keterlambatan
-   [x] Tampilkan statistik payroll
-   [x] Filter berdasarkan bulan
-   [x] Filter berdasarkan status
-   [x] Mark as paid functionality

## 🎉 Status: SELESAI

Sistem penggajian sudah berjalan sempurna dan siap digunakan!

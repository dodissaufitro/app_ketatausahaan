# 🚀 Quick Start - Employee dari User Table

## Langkah 1: Database Migration ✅ SUDAH DILAKUKAN

Migration telah dijalankan otomatis. Kolom `user_id` sudah ditambahkan ke tabel `employees`.

```bash
php artisan migrate --force
# 2025_12_16_000000_add_user_id_to_employees_table ✓
```

---

## Langkah 2: Tambahkan Component ke Frontend

Edit file tempat Anda menampilkan form tambah employee, misalnya di halaman employee management:

```typescript
// pages/admin/EmployeePage.tsx

import { CreateEmployeeModal } from "@/components/employee/CreateEmployeeModal";

export default function EmployeePage() {
    return (
        <div className="container">
            <h1>Manajemen Karyawan</h1>

            <CreateEmployeeModal />

            {/* Daftar employee lainnya */}
        </div>
    );
}
```

---

## Langkah 3: Test di Browser

### Test Endpoint (cURL)

```bash
# 1. Dapatkan list user yang tersedia
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/employees/available-users/list

# 2. Buat employee baru
curl -X POST http://localhost:8000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "salary": 5000000
  }'
```

### Test via UI

1. Buka aplikasi di browser
2. Navigate ke halaman Employee Management
3. Klik tombol "Tambah Employee"
4. Pilih user dari dropdown
5. Isi form: phone, department, position, join_date, salary
6. Klik "Simpan"
7. Lihat pesan sukses

---

## 📊 API Endpoints Summary

| Method | Endpoint                              | Fungsi                                            |
| ------ | ------------------------------------- | ------------------------------------------------- |
| GET    | `/api/employees/available-users/list` | **BARU** - Dapatkan user yang belum jadi employee |
| POST   | `/api/employees`                      | **DIUBAH** - Buat employee dari user              |
| GET    | `/api/employees`                      | List semua employee                               |
| GET    | `/api/employees/{id}`                 | Detail employee + user data                       |
| PUT    | `/api/employees/{id}`                 | Update employee                                   |
| DELETE | `/api/employees/{id}`                 | Hapus employee                                    |

---

## 🔑 Request/Response Examples

### GET `/api/employees/available-users/list`

**Response:**

```json
[
    {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
    }
]
```

### POST `/api/employees`

**Request:**

```json
{
    "user_id": 1,
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "salary": 5000000,
    "status": "active"
}
```

**Response (201):**

```json
{
    "id": 1,
    "user_id": 1,
    "employee_id": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "status": "active",
    "salary": "5000000.00",
    "avatar": null,
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "is_active": true
    }
}
```

---

## ✅ Fitur Utama

| Fitur                         | Deskripsi                                     |
| ----------------------------- | --------------------------------------------- |
| **User Selection**            | Dropdown berisi user yang belum jadi employee |
| **Auto Fill Name & Email**    | Diambil otomatis dari data user               |
| **Auto Generate Employee ID** | EMP001, EMP002, dst (otomatis)                |
| **Validation**                | Validasi user valid dan belum jadi employee   |
| **Error Messages**            | Pesan error yang jelas untuk user             |
| **Success Notification**      | Notifikasi ketika employee berhasil dibuat    |
| **Form Reset**                | Auto reset form setelah sukses                |
| **Loading State**             | Button disabled saat loading                  |

---

## 🔍 File yang Diubah/Dibuat

### Backend

-   ✅ `app/Models/Employee.php` - Tambah relasi user()
-   ✅ `app/Http/Controllers/EmployeeController.php` - Ubah store() & tambah getAvailableUsers()
-   ✅ `routes/web.php` - Tambah route untuk available-users
-   ✅ `database/migrations/2025_12_16_000000_add_user_id_to_employees_table.php` - Migration baru

### Frontend

-   ✅ `resources/js/components/employee/CreateEmployeeModal.tsx` - Component React siap pakai

### Dokumentasi

-   ✅ `EMPLOYEE_FROM_USER.md` - Dokumentasi lengkap
-   ✅ `EMPLOYEE_MIGRATION_SUMMARY.md` - Ringkasan perubahan
-   ✅ `QUICKSTART_EMPLOYEE.md` - File ini

---

## 🛠️ Troubleshooting

### Error: "The selected user_id is invalid"

**Solusi:** User dengan ID tersebut tidak ada atau tidak aktif. Pastikan user sudah dibuat dan status `is_active = true`.

### Error: "The user_id has already been taken"

**Solusi:** User sudah menjadi employee. Pilih user lain yang belum menjadi employee.

### Dropdown user kosong

**Solusi:**

1. Pastikan ada user di sistem
2. Pastikan user status `is_active = true`
3. Refresh halaman

### Migration gagal

**Solusi:**

```bash
# Cek status migration
php artisan migrate:status

# Jika gagal, rollback dan jalankan ulang
php artisan migrate:rollback
php artisan migrate --force
```

---

## 📚 Dokumentasi Lengkap

Untuk informasi lebih detail, baca:

-   [EMPLOYEE_FROM_USER.md](./EMPLOYEE_FROM_USER.md) - Dokumentasi lengkap dengan contoh implementasi
-   [EMPLOYEE_MIGRATION_SUMMARY.md](./EMPLOYEE_MIGRATION_SUMMARY.md) - Ringkasan teknis semua perubahan

---

## ✨ Selesai!

Sistem employee dari user table sudah siap digunakan. Enjoy! 🎉

Pertanyaan? Lihat dokumentasi di atas atau check file-file yang sudah dibuat.

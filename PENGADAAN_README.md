# Pengadaan - Documentation

## Overview

Fitur untuk mengelola data pengadaan barang dan jasa dengan relasi ke user untuk PPTK, ASN, dan Non ASN.

## Database Schema

**Table:** `pengadaan`

| Kolom           | Tipe          | Nullable | Keterangan                               |
| --------------- | ------------- | -------- | ---------------------------------------- |
| id              | bigint (PK)   | No       | Primary key                              |
| no              | integer       | Yes      | Nomor urut                               |
| belanja_operasi | varchar(255)  | Yes      | Nama belanja operasi                     |
| jumlah_anggaran | decimal(15,2) | Yes      | Jumlah anggaran dalam rupiah             |
| tanggal         | date          | Yes      | Tanggal pengadaan                        |
| jenis_pengadaan | varchar(255)  | Yes      | Jenis pengadaan (Barang/Jasa/Konstruksi) |
| pptk_id         | bigint (FK)   | Yes      | Foreign key ke users (PPTK)              |
| asn_id          | bigint (FK)   | Yes      | Foreign key ke users (ASN)               |
| non_asn_id      | bigint (FK)   | Yes      | Foreign key ke users (Non ASN)           |
| created_at      | timestamp     | No       | Waktu dibuat                             |
| updated_at      | timestamp     | No       | Waktu diupdate                           |

## Relationships

- `pptk_id` → `users.id` (Pejabat Pembuat Komitmen)
- `asn_id` → `users.id` (Aparatur Sipil Negara)
- `non_asn_id` → `users.id` (Non ASN)

## Files Created

### 1. Migration

- **Path:** `database/migrations/2026_01_28_070000_create_pengadaan_table.php`
- **Features:**
    - Foreign key constraints dengan onDelete cascade
    - Decimal untuk jumlah anggaran (15 digit, 2 desimal)

### 2. Model

- **Path:** `app/Models/Pengadaan.php`
- **Features:**
    - Mass assignment protection
    - Date casting untuk kolom `tanggal`
    - Decimal casting untuk `jumlah_anggaran`
    - Relasi `belongsTo` ke User (pptk, asn, nonAsn)

### 3. Controller

- **Path:** `app/Http/Controllers/PengadaanController.php`
- **Methods:**
    - `index()` - List pengadaan dengan eager loading relasi
    - `getUsers()` - Get active users untuk dropdown
    - `store()` - Simpan pengadaan baru
    - `show()` - Detail pengadaan dengan relasi
    - `update()` - Update pengadaan
    - `destroy()` - Hapus pengadaan

### 4. Routes

- **File:** `routes/web.php`
- **Endpoints:**
    - `GET /api/pengadaan` - List pengadaan
    - `GET /api/pengadaan/users` - List active users
    - `POST /api/pengadaan` - Create pengadaan
    - `GET /api/pengadaan/{id}` - Show pengadaan
    - `PUT /api/pengadaan/{id}` - Update pengadaan
    - `DELETE /api/pengadaan/{id}` - Delete pengadaan

### 5. Frontend Component

- **Path:** `resources/js/pages/dashboard/Pengadaan.tsx`
- **Features:**
    - Table dengan search dan eager loading relasi
    - Form dengan dropdown untuk PPTK, ASN, Non ASN
    - Currency formatting untuk jumlah anggaran
    - Date picker untuk tanggal
    - Real-time search dengan debounce
    - Toast notifications

## Features

### ✅ CRUD Operations

- **Create:** Tambah data pengadaan dengan relasi user
- **Read:** Tampilkan list dengan relasi (pptk, asn, non_asn)
- **Update:** Edit data pengadaan
- **Delete:** Hapus data pengadaan

### ✅ User Relations

- **PPTK** (Pejabat Pembuat Komitmen) - Relasi ke users
- **ASN** (Aparatur Sipil Negara) - Relasi ke users
- **Non ASN** - Relasi ke users
- Dropdown menampilkan nama dan email user
- Hanya menampilkan user yang aktif (is_active = true)

### ✅ Search & Filter

- Search by: belanja_operasi, jenis_pengadaan, nomor
- Real-time search dengan debounce 300ms

### ✅ Display Features

- Currency formatting (Rp 10.000.000)
- Date formatting (Indonesia locale)
- User info dengan icon
- Responsive table layout

## Usage

### Akses Menu

1. Login ke aplikasi
2. Klik menu **"Pengadaan"** di sidebar (icon 🛒)
3. Route: `/dashboard/pengadaan`

### Tambah Pengadaan

1. Klik tombol **"Tambah Pengadaan"**
2. Isi form:
    - No Urut (opsional)
    - Tanggal (required)
    - Belanja Operasi (required)
    - Jenis Pengadaan (required) - Contoh: Barang, Jasa, Konstruksi
    - Jumlah Anggaran (required) - dalam rupiah
    - PPTK (opsional) - pilih dari dropdown user
    - ASN (opsional) - pilih dari dropdown user
    - Non ASN (opsional) - pilih dari dropdown user
3. Klik **"Simpan"**

### Edit Pengadaan

1. Klik icon Edit (pensil) pada row yang ingin diedit
2. Update data yang diperlukan
3. Klik **"Perbarui"**

### Hapus Pengadaan

1. Klik icon Trash pada row yang ingin dihapus
2. Konfirmasi penghapusan
3. Data akan terhapus permanent

## API Examples

### Get All Pengadaan

```bash
GET /api/pengadaan
GET /api/pengadaan?search=komputer
```

Response:

```json
[
    {
        "id": 1,
        "no": 1,
        "belanja_operasi": "Pengadaan Komputer",
        "jumlah_anggaran": "150000000.00",
        "tanggal": "2026-01-28",
        "jenis_pengadaan": "Barang",
        "pptk_id": 1,
        "asn_id": 2,
        "non_asn_id": 3,
        "pptk": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        },
        "asn": {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com"
        },
        "non_asn": {
            "id": 3,
            "name": "Bob Wilson",
            "email": "bob@example.com"
        }
    }
]
```

### Get Active Users

```bash
GET /api/pengadaan/users
```

Response:

```json
[
    {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    }
]
```

### Create Pengadaan

```bash
POST /api/pengadaan
Content-Type: application/json

{
  "no": 1,
  "belanja_operasi": "Pengadaan Laptop",
  "jumlah_anggaran": 150000000,
  "tanggal": "2026-01-28",
  "jenis_pengadaan": "Barang",
  "pptk_id": 1,
  "asn_id": 2,
  "non_asn_id": 3
}
```

### Update Pengadaan

```bash
PUT /api/pengadaan/{id}
Content-Type: application/json

{
  "no": 1,
  "belanja_operasi": "Pengadaan Laptop Updated",
  "jumlah_anggaran": 175000000,
  "tanggal": "2026-01-28",
  "jenis_pengadaan": "Barang",
  "pptk_id": 1,
  "asn_id": 2,
  "non_asn_id": null
}
```

### Delete Pengadaan

```bash
DELETE /api/pengadaan/{id}
```

## Validation Rules

### Store/Update

- `no`: nullable, integer
- `belanja_operasi`: required, string, max 255 chars
- `jumlah_anggaran`: required, numeric, minimum 0
- `tanggal`: required, date format
- `jenis_pengadaan`: required, string, max 255 chars
- `pptk_id`: nullable, must exist in users table
- `asn_id`: nullable, must exist in users table
- `non_asn_id`: nullable, must exist in users table

## Database Constraints

- Foreign keys dengan `nullOnDelete()` - jika user dihapus, field akan null
- Decimal(15,2) untuk jumlah anggaran - support hingga 999 triliun dengan 2 desimal
- All fields nullable kecuali id dan timestamps

## Display Format

- **Currency:** Rp 150.000.000 (Indonesia format)
- **Date:** 28 Jan 2026 (Indonesia locale)
- **User:** Nama (email) in dropdown

## Notes

- Semua relasi user bersifat opsional (nullable)
- User dropdown hanya menampilkan user aktif (is_active = true)
- Search case-insensitive
- Eager loading relasi untuk performa optimal
- Currency formatting menggunakan Intl.NumberFormat

## Future Enhancements

- [ ] Export to Excel
- [ ] Filter by jenis_pengadaan
- [ ] Filter by date range
- [ ] Bulk operations
- [ ] Permission-based access
- [ ] Audit log
- [ ] File attachment
- [ ] Budget tracking & monitoring

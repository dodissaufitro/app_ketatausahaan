# Dokumen Pengadaan Langsung - Documentation

## Overview

Fitur untuk mengelola dokumen pengadaan langsung dengan kemampuan CRUD (Create, Read, Update, Delete) lengkap.

## Database Schema

**Table:** `dokumen_pengadaan_langsung`

| Kolom      | Tipe         | Nullable | Keterangan              |
| ---------- | ------------ | -------- | ----------------------- |
| id         | bigint (PK)  | No       | Primary key             |
| no         | integer      | Yes      | Nomor urut dokumen      |
| dokumen    | varchar(255) | Yes      | Nama dokumen            |
| file       | varchar(255) | Yes      | Path file yang diupload |
| tanggal    | date         | Yes      | Tanggal dokumen         |
| nomor      | varchar(255) | Yes      | Nomor dokumen           |
| keterangan | text         | Yes      | Keterangan tambahan     |
| created_at | timestamp    | No       | Waktu dibuat            |
| updated_at | timestamp    | No       | Waktu diupdate          |

## Files Created

### 1. Migration

- **Path:** `database/migrations/2026_01_28_063618_create_dokumen_pengadaan_langsung_table.php`
- **Purpose:** Membuat struktur database table

### 2. Model

- **Path:** `app/Models/DokumenPengadaanLangsung.php`
- **Features:**
    - Mass assignment protection
    - Date casting untuk kolom `tanggal`
    - Fillable fields: no, dokumen, file, tanggal, nomor, keterangan

### 3. Controller

- **Path:** `app/Http/Controllers/DokumenPengadaanLangsungController.php`
- **Methods:**
    - `index()` - List semua dokumen dengan search
    - `store()` - Simpan dokumen baru + upload file
    - `show()` - Detail dokumen
    - `update()` - Update dokumen + replace file
    - `destroy()` - Hapus dokumen + file

### 4. Routes

- **File:** `routes/web.php`
- **Endpoints:**
    - `GET /api/dokumen-pengadaan-langsung` - List dokumen
    - `POST /api/dokumen-pengadaan-langsung` - Create dokumen
    - `GET /api/dokumen-pengadaan-langsung/{id}` - Show dokumen
    - `POST /api/dokumen-pengadaan-langsung/{id}` - Update dokumen (multipart)
    - `DELETE /api/dokumen-pengadaan-langsung/{id}` - Delete dokumen

### 5. Frontend Component

- **Path:** `resources/js/pages/dashboard/DokumenPengadaanLangsung.tsx`
- **Features:**
    - Table dengan search
    - Form tambah/edit dengan dialog modal
    - Upload file (PDF, DOC, DOCX, XLS, XLSX - max 5MB)
    - Download file
    - Delete dengan konfirmasi
    - Real-time search dengan debounce
    - Date picker untuk tanggal
    - Toast notifications

## Features

### ✅ CRUD Operations

- **Create:** Tambah dokumen baru dengan upload file
- **Read:** Tampilkan list dokumen dengan search
- **Update:** Edit dokumen dan replace file
- **Delete:** Hapus dokumen beserta file-nya

### ✅ File Upload

- Format support: PDF, DOC, DOCX, XLS, XLSX
- Max size: 5MB
- Auto delete old file saat update
- Storage: `storage/app/public/dokumen_pengadaan/`

### ✅ Search

- Search by: dokumen, nomor, keterangan
- Real-time search dengan debounce 300ms

### ✅ UI/UX

- Responsive design
- Modern UI dengan shadcn/ui components
- Toast notifications untuk feedback
- Confirmation dialog untuk delete
- File download langsung dari table

## Usage

### Akses Menu

1. Login ke aplikasi
2. Klik menu **"Dokumen Pengadaan"** di sidebar (icon FileText)
3. Route: `/dashboard/dokumen-pengadaan-langsung`

### Tambah Dokumen

1. Klik tombol **"Tambah Dokumen"**
2. Isi form:
    - No Urut (opsional)
    - Tanggal (required)
    - Nama Dokumen (required)
    - Nomor Dokumen (required)
    - File (opsional, max 5MB)
    - Keterangan (opsional)
3. Klik **"Simpan"**

### Edit Dokumen

1. Klik icon Edit (pensil) pada row yang ingin diedit
2. Update data yang diperlukan
3. Upload file baru jika ingin replace (opsional)
4. Klik **"Perbarui"**

### Hapus Dokumen

1. Klik icon Trash pada row yang ingin dihapus
2. Konfirmasi penghapusan
3. Dokumen dan file akan terhapus permanent

### Download File

1. Klik tombol **"Download"** pada kolom File
2. File akan terbuka di tab baru

## API Examples

### Get All Documents

```bash
GET /api/dokumen-pengadaan-langsung
GET /api/dokumen-pengadaan-langsung?search=kontrak
```

### Create Document

```bash
POST /api/dokumen-pengadaan-langsung
Content-Type: multipart/form-data

{
  "no": 1,
  "dokumen": "Kontrak Pengadaan Komputer",
  "file": [binary],
  "tanggal": "2026-01-28",
  "nomor": "KP-001/2026",
  "keterangan": "Pengadaan 10 unit komputer"
}
```

### Update Document

```bash
POST /api/dokumen-pengadaan-langsung/{id}
Content-Type: multipart/form-data

{
  "no": 1,
  "dokumen": "Kontrak Pengadaan Komputer (Updated)",
  "file": [binary],
  "tanggal": "2026-01-28",
  "nomor": "KP-001/2026",
  "keterangan": "Pengadaan 15 unit komputer"
}
```

### Delete Document

```bash
DELETE /api/dokumen-pengadaan-langsung/{id}
```

## Storage Configuration

Pastikan symbolic link storage sudah dibuat:

```bash
php artisan storage:link
```

File akan disimpan di: `storage/app/public/dokumen_pengadaan/`
Accessible via: `/storage/dokumen_pengadaan/{filename}`

## Permissions

- Tidak ada permission khusus untuk saat ini
- Semua user yang terautentikasi bisa akses
- Jika perlu, tambahkan middleware permission di route

## Notes

- File validation: PDF, DOC, DOCX, XLS, XLSX
- Max file size: 5MB (5120KB)
- Auto delete old file saat update/delete
- Tanggal menggunakan format Indonesia dengan date-fns
- Search case-insensitive

## Future Enhancements

- [ ] Export to Excel
- [ ] Filter by date range
- [ ] Bulk delete
- [ ] File preview
- [ ] Permission-based access
- [ ] Audit log

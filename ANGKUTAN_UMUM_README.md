# Modul Angkutan Umum - Dokumentasi

## 📋 Ringkasan

Modul untuk mengelola data penggunaan angkutan umum oleh pegawai, termasuk pencatatan nama lengkap, tanggal pelaksanaan, jabatan, jenis angkutan yang digunakan, dan foto timestamp keberangkatan serta kepulangan.

## 📁 File yang Dibuat

### Backend (Laravel)

1. **Migration**: `database/migrations/2026_01_29_000000_create_angkutan_umum_table.php`
    - Membuat tabel `angkutan_umum` dengan kolom:
        - id
        - nama_lengkap
        - tanggal_pelaksanaan
        - jabatan
        - angkutan_umum_digunakan
        - foto_timestamp_keberangkatan
        - foto_timestamp_kepulangan
        - timestamps
        - soft deletes

2. **Model**: `app/Models/AngkutanUmum.php`
    - Model Eloquent dengan fillable fields
    - Cast tanggal_pelaksanaan sebagai date
    - Soft delete enabled

3. **Controller**: `app/Http/Controllers/AngkutanUmumController.php`
    - CRUD lengkap (index, store, show, update, destroy)
    - **Export to Excel (HTML format) dengan foto dan styling**
    - Upload dan delete file foto
    - JSON response untuk API
    - Validasi input
    - File storage di `storage/app/public/angkutan_umum/`

3b. **Export Class**: `app/Exports/AngkutanUmumExcelExport.php` - Generate Excel dengan HTML format - Embed foto dalam Excel (base64) - Professional styling dengan warna dan border - Header dengan title dan subtitle

### Frontend (React/TypeScript)

4. **Index Page**: `resources/js/Pages/AngkutanUmum/Index.tsx`
    - Daftar data dengan tabel
    - **Button Export Excel (dengan Foto)** - styled green button
    - Pagination
    - Preview foto dalam modal
    - Delete data dengan konfirmasi

5. **Create Page**: `resources/js/Pages/AngkutanUmum/Create.tsx`
    - Form tambah data baru
    - Upload foto keberangkatan & kepulangan
    - Validasi frontend

6. **Edit Page**: `resources/js/Pages/AngkutanUmum/Edit.tsx`
    - Form edit data
    - Preview foto existing
    - Update foto opsional

7. **Show Page**: `resources/js/Pages/AngkutanUmum/Show.tsx`
    - Detail lengkap data
    - Display foto full size
    - Tombol navigasi ke edit

### Routes & Navigation

8. **Routes**:
    - API Routes di `routes/web.php` (dalam group `/api`)
    - React Routes di `resources/js/App.tsx`
    - Menu navigasi di `resources/js/components/layout/DashboardLayout.tsx`

## 🚀 Cara Instalasi

### 1. Jalankan Migration

```bash
php artisan migrate
```

### 2. Buat Symbolic Link untuk Storage (jika belum)

```bash
php artisan storage:link
```

### 3. Set Permission Folder Storage

```bash
chmod -R 775 storage/app/public
```

## 📡 API Endpoints

Base URL: `/api/angkutan-umum`

| Method | Endpoint                    | Deskripsi                         |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/api/angkutan-umum`        | List semua data (paginated)       |
| GET    | `/api/angkutan-umum/export` | **Export data ke CSV/Excel**      |
| POST   | `/api/angkutan-umum`        | Tambah data baru                  |
| GET    | `/api/angkutan-umum/{id}`   | Detail data                       |
| POST   | `/api/angkutan-umum/{id}`   | Update data (dengan \_method=PUT) |
| DELETE | `/api/angkutan-umum/{id}`   | Hapus data                        |

## 📝 Validasi

### Create & Update

```php
'nama_lengkap' => 'required|string|max:255',
'tanggal_pelaksanaan' => 'required|date',
'jabatan' => 'required|string|max:255',
'angkutan_umum_digunakan' => 'required|string|max:255',
'foto_timestamp_keberangkatan' => 'nullable|image|max:2048',
'foto_timestamp_kepulangan' => 'nullable|image|max:2048',
```

## 🎨 Fitur Frontend

### Halaman Index

- Tabel data dengan kolom: No, Nama, Tanggal, Jabatan, Angkutan Umum, Foto
- **Button "Export Excel"** - Download data dalam format CSV (dapat dibuka di Excel)
- Button preview foto dalam modal
- Button Edit, Delete, View
- Pagination
- Responsive design

### Halaman Create/Edit

- Form input text untuk: Nama Lengkap, Jabatan, Angkutan Umum
- Date picker untuk Tanggal Pelaksanaan
- File upload untuk foto (max 2MB, format: JPG, PNG, JPEG)
- Preview foto existing (pada halaman edit)
- Validasi real-time
- Toast notification untuk feedback

### Halaman Show

- Display semua field dalam format card
- Full size image display
- Informasi created_at dan updated_at
- Button kembali dan edit

## 🔧 Struktur Data

### Request Body (Create/Update)

```typescript
{
    nama_lengkap: string;
    tanggal_pelaksanaan: string; // YYYY-MM-DD
    jabatan: string;
    angkutan_umum_digunakan: string;
    foto_timestamp_keberangkatan: File | null;
    foto_timestamp_kepulangan: File | null;
}
```

### Response Body

```typescript
{
    angkutanUmum: {
        id: number;
        nama_lengkap: string;
        tanggal_pelaksanaan: string;
        jabatan: string;
        angkutan_umum_digunakan: string;
        foto_timestamp_keberangkatan: string | null;
        foto_timestamp_kepulangan: string | null;
        created_at: string;
        updated_at: string;
    }
}
```

## 🗺️ Navigasi

Menu "Angkutan Umum" telah ditambahkan di sidebar dengan icon Bus.

**URL Routes:**

- List: `/dashboard/angkutan-umum`
- Create: `/dashboard/angkutan-umum/create`
- Show: `/dashboard/angkutan-umum/{id}`
- Edit: `/dashboard/angkutan-umum/{id}/edit`

## 📦 Dependencies

### Backend

- Laravel 12+
- Laravel Storage (Filesystem)
- Native PHP CSV export (no external package required)

### Frontend

- React
- React Router DOM
- Axios
- date-fns (untuk format tanggal Indonesia)
- Lucide React (icons)
- Shadcn/ui components

## 🔐 Security

- File upload validation (type & size)
- CSRF protection (Laravel)
- Input sanitization
- Soft delete (data tidak benar-benar terhapus)

## 📸 File Storage

Foto disimpan di:

```
storage/app/public/angkutan_umum/
├── keberangkatan/
│   └── [generated-filename].jpg
└── kepulangan/
    └── [generated-filename].jpg
```

Public URL: `/storage/angkutan_umum/keberangkatan/[filename]`

## ✅ Testing

1. Test Create: Tambah data dengan foto
2. Test Read: Lihat list dan detail
3. Test Update: Edit data dan ganti foto
4. Test Delete: Hapus data (foto ikut terhapus)
5. **Test Export: Download Excel/CSV file**
6. Test Pagination: Navigasi antar halaman
7. Test Validation: Submit form kosong/invalid

## 📥 Export Excel Feature

### Format Output

- File format: **Excel (.xls)** dengan HTML format
- Compatible dengan Microsoft Excel, WPS Office, LibreOffice
- **Foto langsung tertanam di dalam file Excel** (base64 embedded images)
- Filename: `data-angkutan-umum-YYYY-MM-DD-HHmmss.xls`

### Fitur Export

✨ **Professional Styling:**

- Header dengan background biru (#4472C4)
- Baris bergantian warna (zebra striping)
- Border pada semua cell
- Title dan subtitle yang menarik
- Tanggal export otomatis

📸 **Foto Embedded:**

- Foto keberangkatan dan kepulangan langsung tampil di Excel
- Ukuran foto otomatis disesuaikan (max 150x150px)
- Jika tidak ada foto, akan tampil "Tidak Ada"
- Jika file foto tidak ditemukan, akan tampil badge "Ada"

### Kolom yang di-export

1. No (nomor urut)
2. Nama Lengkap
3. Tanggal Pelaksanaan (format: dd/mm/yyyy)
4. Jabatan
5. Angkutan Umum Yang Digunakan
6. Foto Timestamp Keberangkatan (gambar embedded)
7. Foto Timestamp Kepulangan (gambar embedded)
8. Tanggal Dibuat (format: dd/mm/yyyy HH:mm)

### Cara Penggunaan

1. Buka halaman Index `/dashboard/angkutan-umum`
2. Klik tombol **"Export Excel (dengan Foto)"** (tombol hijau) di kanan atas
3. File Excel akan otomatis terdownload
4. Buka file dengan Microsoft Excel, WPS Office, atau LibreOffice

### Technical Details

- Menggunakan HTML to Excel conversion
- Base64 encoding untuk embed images
- Inline CSS untuk styling yang konsisten
- Response streaming untuk efisiensi memory
- No external package required (pure PHP implementation)
- File .xls format (Excel 97-2003) untuk kompatibilitas maksimal

## 🐛 Troubleshooting

### Foto tidak muncul

```bash
php artisan storage:link
chmod -R 775 storage/app/public
```

### Error upload file

Cek `php.ini`:

```ini
upload_max_filesize = 2M
post_max_size = 8M
```

### 404 Not Found

```bash
php artisan route:clear
php artisan cache:clear
```

## 📞 Support

Jika ada pertanyaan atau issue, silakan check:

1. Laravel log: `storage/logs/laravel.log`
2. Browser console untuk error frontend
3. Network tab untuk API response

---

**Created:** January 29, 2026
**Version:** 1.0.0

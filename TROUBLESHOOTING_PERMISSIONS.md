# 🔧 PANDUAN TROUBLESHOOTING - USER TIDAK BISA AKSES SURAT MASUK/KELUAR

## ✅ Yang Sudah Dilakukan

1. **Backend Permission** - SUDAH BENAR ✓
    - Permission `manage_incoming_mails` dan `manage_outgoing_mails` sudah ditambahkan
    - User sekar sudah memiliki kedua permission tersebut di database
    - Method `hasPermission()` berfungsi dengan baik

2. **Routes & Middleware** - SUDAH BENAR ✓
    - Route untuk incoming dan outgoing mails sudah dikonfigurasi
    - Middleware permission sudah terpasang dengan benar

3. **Frontend Navigation** - SUDAH BENAR ✓
    - Menu Surat Masuk dan Surat Keluar sudah ada
    - Permission checking di navigation sudah benar

## 🔍 Diagnosa Masalah

Masalahnya adalah **DATA USER DI BROWSER BELUM TER-UPDATE**

Ketika permission ditambahkan di database, user yang sedang login tidak otomatis mendapat update karena data user di-cache oleh browser dan session.

## ✨ SOLUSI BARU - Dengan Debug Tool

Saya telah menambahkan **Debug Tool** yang muncul di pojok kanan bawah halaman dashboard. Tool ini akan menampilkan:

- Nama user yang sedang login
- Role user
- **Daftar permissions yang dimiliki**
- Tombol "Refresh User Data" untuk force reload permissions

### Langkah-langkah:

1. **Login dengan user sekar**
    - Email: sekar@gmail.com

2. **Buka Dashboard**
    - Anda akan melihat box debug di pojok kanan bawah

3. **Cek Permissions**
    - Lihat daftar permissions di debug box
    - Pastikan ada `manage_incoming_mails` dan `manage_outgoing_mails`

4. **Jika Permission BELUM ADA:**
    - Klik tombol **"Refresh User Data"**
    - Ini akan force reload data user dari server
    - Menu Surat Masuk dan Surat Keluar seharusnya langsung muncul

5. **Jika Permission SUDAH ADA tapi menu TIDAK MUNCUL:**
    - Buka Console Browser (F12 → Console tab)
    - Cari pesan log: `[AuthContext] Permissions:`
    - Screenshot dan kirim ke saya untuk analisa lebih lanjut

## 🚀 Cara Alternatif (Jika Debug Tool Tidak Muncul)

### Metode 1: Hard Refresh Browser

1. Logout dari aplikasi
2. Tekan `Ctrl + Shift + R` untuk hard refresh
3. Clear browser cache: `Ctrl + Shift + Delete`
4. Login kembali

### Metode 2: Incognito Mode

1. Buka browser dalam mode Incognito/Private: `Ctrl + Shift + N`
2. Login dengan user sekar
3. Cek apakah menu muncul

### Metode 3: Endpoint Debug

Buka URL ini setelah login:

```
http://localhost/app_ketatausahaan/api/debug-user
```

Ini akan menampilkan JSON lengkap data user beserta permissions. Pastikan ada:

- `"has_manage_incoming_mails": true`
- `"has_manage_outgoing_mails": true`

## 📊 Expected Output

Setelah berhasil, user sekar seharusnya:

- ✅ Melihat menu "Surat Masuk" di sidebar
- ✅ Melihat menu "Surat Keluar" di sidebar
- ✅ Bisa mengklik dan mengakses halaman tersebut
- ✅ Tidak melihat pesan "Access Denied"

## 🛠️ Debugging Commands (Untuk Developer)

```bash
# Verifikasi permission di database
php check_permissions.php

# Clear semua cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Rebuild frontend
npm run build
```

## 📝 Catatan Penting

- Debug tool hanya muncul di development mode
- Setelah masalah selesai, debug tool bisa dihapus
- User yang sudah login perlu refresh/logout-login untuk mendapat update permissions
- Browser cache sangat mempengaruhi - selalu clear cache jika ada masalah

## ❓ Jika Masih Bermasalah

Kirimkan informasi berikut:

1. Screenshot debug box di pojok kanan bawah
2. Screenshot browser console (F12 → Console)
3. Response dari `/api/debug-user`
4. Screenshot sidebar (apakah menu muncul atau tidak)

# INSTRUKSI UNTUK USER SEKAR

## Masalah

User sekar tidak bisa akses menu Surat Masuk dan Surat Keluar meskipun permission sudah ditambahkan.

## Penyebab

Data user di browser masih menggunakan cache lama sebelum permission ditambahkan.

## Solusi - WAJIB DILAKUKAN BERURUTAN:

### 1. Logout dari aplikasi

- Klik tombol Logout
- Pastikan keluar dari sistem

### 2. Clear Browser Cache & Storage

Pilih salah satu cara:

**Cara A - Hard Refresh (TERCEPAT):**

- Tekan `Ctrl + Shift + Delete` di browser
- Pilih "Cookies and other site data" dan "Cached images and files"
- Klik "Clear data"

**Cara B - Developer Tools:**

- Tekan `F12` untuk buka Developer Tools
- Klik tab "Application" atau "Storage"
- Klik kanan pada domain website → Clear
- Atau klik "Clear site data"

**Cara C - Manual:**

- Chrome: Settings → Privacy and Security → Clear browsing data
- Firefox: Settings → Privacy & Security → Cookies and Site Data → Clear Data
- Edge: Settings → Privacy, search, and services → Clear browsing data

### 3. Tutup dan Buka Ulang Browser

- Tutup semua tab browser
- Buka browser baru

### 4. Login Kembali

- Login dengan user sekar
- Email: sekar@gmail.com

### 5. Verifikasi

Setelah login, user sekar seharusnya bisa melihat:

- ✅ Menu "Surat Masuk" di sidebar
- ✅ Menu "Surat Keluar" di sidebar

Dan bisa mengakses halaman:

- `/dashboard/incoming-mail`
- `/dashboard/outgoing-mail`

## Permissions yang Dimiliki User Sekar:

- export_data
- view_reports
- view_dashboard
- manage_attendances
- view_own_attendance
- manage_agendas
- **manage_incoming_mails** ← BARU
- **manage_outgoing_mails** ← BARU

## Jika Masih Belum Bisa

Coba buka browser dalam mode Incognito/Private:

- Chrome: Ctrl + Shift + N
- Firefox: Ctrl + Shift + P
- Edge: Ctrl + Shift + N

Login di mode incognito, jika berhasil berarti masalahnya di cache browser.

## Verifikasi Backend (Sudah Dicek - ✅ BERFUNGSI)

Backend sudah dikonfirmasi bekerja dengan benar. Permission sudah tersimpan di database dan sistem bisa mengecek permission dengan benar.

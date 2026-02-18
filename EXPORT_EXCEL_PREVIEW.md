# Export Excel - Preview & Documentation

## 🎨 Tampilan Export Excel

File Excel yang dihasilkan memiliki tampilan profesional dengan fitur:

### Header Section

```
┌─────────────────────────────────────────────────────────┐
│          DATA PENGGUNAAN ANGKUTAN UMUM                  │
│        Tanggal Export: 29 January 2026 14:30:22        │
└─────────────────────────────────────────────────────────┘
```

### Table Structure

```
┌────┬──────────────┬──────────────┬──────────┬─────────────┬────────────┬────────────┬─────────────┐
│ No │ Nama Lengkap │   Tanggal    │ Jabatan  │  Angkutan   │    Foto    │    Foto    │   Tanggal   │
│    │              │ Pelaksanaan  │          │    Umum     │Keberangkat.│ Kepulangan │   Dibuat    │
├────┼──────────────┼──────────────┼──────────┼─────────────┼────────────┼────────────┼─────────────┤
│ 1  │ Ahmad Yani   │ 15/01/2026   │ Manager  │ Bus Damri   │  [PHOTO]   │  [PHOTO]   │15/01/26 08:00│
├────┼──────────────┼──────────────┼──────────┼─────────────┼────────────┼────────────┼─────────────┤
│ 2  │ Budi Santoso │ 16/01/2026   │ Staff IT │ Kereta KRL  │  [PHOTO]   │ Tidak Ada  │16/01/26 09:15│
└────┴──────────────┴──────────────┴──────────┴─────────────┴────────────┴────────────┴─────────────┘
```

## 🎨 Styling Details

### Colors

- **Header Background**: #4472C4 (Professional Blue)
- **Header Text**: White (#FFFFFF)
- **Odd Rows**: Light Gray (#F2F2F2)
- **Even Rows**: White (#FFFFFF)
- **Borders**: #D0D0D0 (Light Gray)
- **Title**: #2F5597 (Dark Blue)

### Photo Display

- Size: Maximum 150x150 pixels (auto-scaled)
- Border: 2px solid #ddd
- Border Radius: 4px
- Position: Center-aligned in cell

### Badges

- **"Ada"** badge: Green (#28a745) with white text
- **"Tidak Ada"**: Gray italic text

## 📊 Sample Output

Ketika dibuka di Excel, file akan menampilkan:

1. **Title Bar**: "DATA PENGGUNAAN ANGKUTAN UMUM" (18pt, bold, blue)
2. **Subtitle**: Tanggal export otomatis (11pt, gray)
3. **Table**:
    - Header dengan background biru dan teks putih
    - Data dengan zebra striping (baris bergantian warna)
    - Foto embedded langsung di cell
4. **Footer**: Total data dan informasi generator

## 🖼️ Image Embedding

Foto disimpan dalam format base64 di dalam HTML:

```html
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRg..." alt="Foto" />
```

Keuntungan:

- ✅ Foto langsung tampil tanpa perlu file terpisah
- ✅ File Excel bisa dibuka offline
- ✅ Tidak ada broken image links
- ✅ Single file yang mudah di-share

## 💡 Tips Penggunaan

### Membuka di Excel

1. Double-click file .xls
2. Excel akan membuka dengan warning "file format different" → Klik **Yes**
3. Semua foto akan langsung tampil

### Membuka di LibreOffice

1. Open with LibreOffice Calc
2. Foto akan tampil otomatis
3. Bisa di-export ke .xlsx jika perlu

### Print Preview

- Pastikan orientasi **Landscape** untuk hasil terbaik
- Set margins ke **Narrow**
- Enable **Fit to page** jika ada banyak kolom

## 🔧 Customization

Untuk mengubah styling, edit file:
`app/Exports/AngkutanUmumExcelExport.php`

### Contoh: Mengubah Warna Header

```php
th {
    background-color: #FF5733; // Ganti warna header
    color: white;
    ...
}
```

### Contoh: Mengubah Ukuran Foto

```php
img {
    max-width: 200px;  // Ubah dari 150px
    max-height: 200px;
    ...
}
```

## 📱 Compatibility

✅ **Tested & Working:**

- Microsoft Excel 2010+
- WPS Office
- LibreOffice Calc 6.0+
- Google Sheets (via import)

⚠️ **Notes:**

- Excel Online: Foto mungkin tidak tampil (limitation of Excel Online)
- Mobile Excel: Foto tampil tapi mungkin lambat load
- Numbers (Mac): Import dengan format Excel 97-2003

## 🎯 Best Practices

1. **Before Export**: Pastikan semua foto sudah ter-upload
2. **Storage Link**: Jalankan `php artisan storage:link` terlebih dahulu
3. **File Size**: Untuk data > 1000 rows dengan foto, pertimbangkan pagination export
4. **Memory**: Jika error memory, tingkatkan `memory_limit` di php.ini

---

**Last Updated:** January 29, 2026

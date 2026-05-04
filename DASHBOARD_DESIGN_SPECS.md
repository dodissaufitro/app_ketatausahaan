# 🎨 TAMPILAN DASHBOARD ABSENSI KARYAWAN X601

## Preview Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Absensi Karyawan                                         │
│ Dashboard Sinkronisasi Mesin X601                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔍 FILTER DATA                                              │
├─────────────────────────────────────────────────────────────┤
│  IP Address: [10.88.125.230]  Key: [0]                   │
│  Dari Tanggal: [2026-02-27]  Hingga: [2026-03-25]         │
│                              [ 🔍 Cari Data ]              │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ ✅ Total │ 🔴 Telat │ 🟡 Pulang│ 🌟 Tepat │
│ Kehadiran │ ambat   │ Cepat    │ Waktu    │
├──────────┼──────────┼──────────┼──────────┤
│    4     │    2     │    1     │    1     │
└──────────┴──────────┴──────────┴──────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 📋 DATA ABSENSI KARYAWAN                              4 Records   │
├───────┬──────────┬────────────┬──────────┬──────────┬──────┬──────┤
│ ID    │ Nama     │ Tanggal    │ Check In │Check Out │ Kerja│Status│
├───────┼──────────┼────────────┼──────────┼──────────┼──────┼──────┤
│ [1]   │ dd       │ 2026-02-27 │ 09:56:02 │ 10:01:19 │00:05 │Telat │
│ [1]   │ dd       │ 2026-03-25 │ 08:51:16 │ 12:24:37 │03:33 │Telat │
│ [2]   │ aaa      │ 2026-02-27 │ 10:02:58 │ 10:03:07 │00:00 │Telat │
│ [3]   │ dodis    │ 2026-03-25 │ 08:51:23 │ 12:24:41 │03:33 │Telat │
└───────┴──────────┴────────────┴──────────┴──────────┴──────┴──────┘
```

## Features Breakdown

### 1. Header Section

- Gradient background (Purple theme)
- Title dengan icon
- Subtitle description
- Responsive untuk mobile

### 2. Filter Card

- Input IP Address (default 10.88.125.230)
- Input Comm Key (default 0)
- Date range picker dengan calendar
- Search button dengan loading state
- Form validation

### 3. Statistics Cards

Menampilkan 4 stat cards:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Terlambat   │ │ Pulang      │ │ Tepat       │
│ Kehadiran   │ │ (Berapa)    │ │ Cepat       │ │ Waktu       │
│ 4 Records   │ │ 2 Records   │ │ 1 Record    │ │ 1 Record    │
│             │ │             │ │             │ │             │
│ ◉ Success   │ │ ◉ Danger    │ │ ◉ Warning   │ │ ◉ Info      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

Warna Cards:

- Success (Hijau): Total Kehadiran
- Danger (Merah): Terlambat
- Warning (Kuning): Pulang Cepat
- Info (Biru): Tepat Waktu

### 4. Data Table

Features:

- ✅ Responsive (mobile → tablet → desktop)
- ✅ Hover effects pada rows
- ✅ Icon untuk setiap column header
- ✅ Badge styling untuk PIN
- ✅ Color-coded untuk Check In/Out
- ✅ Status badge dengan warna

Column Details:
| Column | Type | Example |
|--------|------|---------|
| ID | Badge | [1], [2], [3] |
| Nama | Text | dd, aaa, dodis |
| Tanggal | Date | 2026-02-27 |
| Check In | Badge (Green) | 09:56:02 |
| Check Out | Badge (Red) | 10:01:19 |
| Jam Kerja | Bold Text | 00:05:17 |
| Status | Badge (Color) | Telat & Pulang Cepat |

### 5. Status Colors

```
┌──────────────────────────────┐
│ 🟢 Tepat Waktu (Success)     │ → Masuk & Pulang tepat waktu
├──────────────────────────────┤
│ 🔴 Terlambat (Danger)        │ → Masuk terlambat
├──────────────────────────────┤
│ 🟡 Pulang Cepat (Warning)    │ → Pulang lebih awal
├──────────────────────────────┤
│ ⚫ Telat & Pulang Cepat (Dark)│ → Keduanya terjadi
└──────────────────────────────┘
```

## Responsive Design

### Mobile (< 768px)

```
├─ Header (Full Width)
├─ Filter Form (1 column, stacked)
├─ Stats (1 column, stacked)
└─ Table (Scrollable, smaller font)
```

### Tablet (768px - 992px)

```
├─ Header (Full Width)
├─ Filter Form (1-2 columns)
├─ Stats (2 columns)
└─ Table (Readable, medium font)
```

### Desktop (> 992px)

```
├─ Header (Full Width)
├─ Filter Form (4 columns)
├─ Stats (4 columns)
└─ Table (Full featured, large font)
```

## User Interactions

### 1. Load Page

```
1. User akses http://localhost/absensi_karyawan.html
2. Form muncul dengan default values
3. IP: 10.88.125.230, Key: 0, no dates
4. Empty state: "Masukkan parameter pencarian..."
```

### 2. Set Filter & Search

```
1. User input IP (atau pakai default)
2. User set date range (optional)
3. Click "🔍 Cari Data" button
4. System connect ke X601 machine
5. Fetch user list & attendance logs
6. Process & calculate stats
7. Render table dengan 4 stat cards
```

### 3. View Results

```
1. Stats cards show summary
2. Table show detailed records per row
3. Color coding helps identify issues
4. Hover row untuk highlight
5. Responsive design auto-adjust
```

### 4. Edit & Search Again

```
1. Change IP/Key/dates in filter
2. Click "Cari Data" again
3. Table refresh dengan data baru
4. Stats updated accordingly
```

## Visual Hierarchy

```
Level 1 (Highest)
├─ Page Title (H1) - "Absensi Karyawan"
└─ Background: Gradient Purple

Level 2
├─ Section Title (H6) - "Filter Data", "Data Absensi"
└─ Card Containers

Level 3
├─ Form Labels (font-weight: 600)
├─ Stat Values (font-size: 2.5rem)
└─ Table Headers (font-weight: 600)

Level 4
├─ Input Fields
├─ Table Data
└─ Badges & Icons
```

## Animations & Effects

```
On Page Load
├─ Fade in sections
└─ Smooth scroll

On Card Hover
├─ translateY up 5px
├─ box-shadow expand
└─ duration: 0.3s

On Table Row Hover
├─ Background color change
└─ duration: instant

On Button Hover
├─ translateY up 2px
├─ Shadow expand
└─ duration: 0.3s
```

## Color Palette

```
Primary: #667eea (Purple)
Secondary: #764ba2 (Dark Purple)

Status Colors:
├─ Success: #28a745 (Green) → Tepat Waktu
├─ Danger: #dc3545 (Red) → Terlambat
├─ Warning: #ffc107 (Yellow) → Pulang Cepat
├─ Info: #17a2b8 (Cyan) → Check In/Out
└─ Dark: #6c757d (Gray) → Telat & Pulang

Background:
├─ Card: #ffffff
├─ Table Header: #f8f9fa
├─ Row Hover: rgba(102, 126, 234, 0.05)
└─ Body: linear-gradient(#667eea → #764ba2)
```

## Typography

```
Header (H1): 2.5rem, Bold 700, Purple
Subtitle: 1.1rem, opacity 0.9
Card Header (H5): 1rem, Bold 600
Form Label: 0.95rem, Bold 600
Table Header: 0.95rem, Bold 600
Table Data: Default
Badge: 0.85rem, Bold 600
```

---

**Version**: 1.0
**Created**: 2026-03-26
**Status**: ✅ PRODUCTION READY

# Koneksi Mesin Absen X601

## Endpoint API

```
GET /api/attendances/connect-x601
```

## Parameter (via GET)

- `ip` (string, optional): IP address mesin X601. Default: `10.1.7.28`
- `key` (string, optional): API Key mesin X601. Default: `0`
- `tgl_awal` (string, optional): Tanggal awal filter (format: YYYY-MM-DD)
- `tgl_akhir` (string, optional): Tanggal akhir filter (format: YYYY-MM-DD)

## Contoh Penggunaan

### 1. Koneksi dengan parameter default

```
GET /api/attendances/connect-x601
```

### 2. Koneksi dengan IP dan Key custom

```
GET /api/attendances/connect-x601?ip=192.168.1.100&key=12345
```

### 3. Koneksi dengan filter tanggal

```
GET /api/attendances/connect-x601?ip=10.1.7.28&key=0&tgl_awal=2024-01-01&tgl_akhir=2024-01-31
```

## Response Success

```json
{
    "success": true,
    "data": [
        {
            "pin": "001",
            "nama": "John Doe",
            "tanggal": "2024-01-15",
            "checkin": "08:00:00",
            "checkout": "17:00:00",
            "jam_kerja": "08:00:00",
            "status": "Tepat Waktu"
        }
    ],
    "count": 1,
    "parameters": {
        "ip": "10.1.7.28",
        "key": "0",
        "tgl_awal": "",
        "tgl_akhir": ""
    }
}
```

## Response Error

```json
{
    "success": false,
    "error": "Connection failed: Unable to connect to 10.1.7.28:80",
    "parameters": {
        "ip": "10.1.7.28",
        "key": "0",
        "tgl_awal": "",
        "tgl_akhir": ""
    }
}
```

## Catatan

- Method ini menggunakan koneksi langsung ke mesin X601 via socket
- Pastikan mesin X601 dapat diakses dari server aplikasi
- Port default yang digunakan adalah 80
- Data dikembalikan dalam format array dengan informasi lengkap attendance

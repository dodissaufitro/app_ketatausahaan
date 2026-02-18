# X601 API Configuration Examples

## Contoh 1: Setup Lokal (Development)

```env
X601_API_ENABLED=true
X601_API_BASE_URL=http://localhost:8080
X601_API_KEY=dev_test_key_12345
X601_API_TIMEOUT=30
```

**Digunakan untuk:**

-   Development & testing
-   Simulator mesin X601 lokal

---

## Contoh 2: Setup Network/LAN

```env
X601_API_ENABLED=true
X601_API_BASE_URL=http://192.168.1.100:8080
X601_API_KEY=production_key_abc123def456
X601_API_TIMEOUT=30
```

**Digunakan untuk:**

-   Mesin X601 di network yang sama
-   Internal office network
-   IP: 192.168.1.100, Port: 8080

**Tips:**

-   Pastikan firewall allow port 8080
-   Test connectivity: `ping 192.168.1.100`

---

## Contoh 3: Setup Cloud/VPN

```env
X601_API_ENABLED=true
X601_API_BASE_URL=https://x601.company.com:443
X601_API_KEY=secure_token_xyz789
X601_API_TIMEOUT=45
```

**Digunakan untuk:**

-   Mesin X601 di data center
-   HTTPS dengan SSL certificate
-   VPN tunnel required

**Tips:**

-   Gunakan HTTPS untuk security
-   Tingkatkan timeout jika network lambat
-   Test SSL: `curl -I https://x601.company.com:443`

---

## Contoh 4: Setup dengan Proxy

```env
X601_API_ENABLED=true
X601_API_BASE_URL=http://proxy.company.local:3128
X601_API_KEY=proxy_api_key
X601_API_TIMEOUT=60
```

**Digunakan untuk:**

-   Akses X601 melalui proxy server
-   Corporate network dengan restrictions

**Tips:**

-   Koordinasi dengan network admin
-   Pastikan proxy credentials benar
-   Test: `curl -X CONNECT proxy.company.local:3128`

---

## Contoh 5: Setup Dual Machine (Failover)

Untuk setup dengan dua mesin X601 (primary & backup):

**Option A: Use .env dan switch manual**

```env
# Primary
X601_API_ENABLED=true
X601_API_BASE_URL=http://192.168.1.100:8080
X601_API_KEY=key_primary

# Untuk switch ke backup:
# Ubah menjadi:
# X601_API_BASE_URL=http://192.168.1.101:8080
# X601_API_KEY=key_backup
```

**Option B: Modify Service (Code)**

Edit `app/Services/X601AttendanceService.php`:

```php
public function fetchFromMachine(string $date = null, string $employeeId = null): array
{
    $servers = [
        ['url' => env('X601_API_BASE_URL'), 'key' => env('X601_API_KEY')],
        ['url' => env('X601_BACKUP_BASE_URL'), 'key' => env('X601_BACKUP_KEY')],
    ];

    foreach ($servers as $server) {
        try {
            $response = Http::timeout(30)
                ->withHeaders(['Authorization' => 'Bearer ' . $server['key']])
                ->get($server['url'] . '/api/attendance', $params);

            if ($response->successful()) {
                return $response->json() ?? [];
            }
        } catch (\Exception $e) {
            Log::warning("Failed to connect to {$server['url']}, trying next...");
            continue;
        }
    }

    return [];
}
```

`.env`:

```env
X601_API_BASE_URL=http://192.168.1.100:8080
X601_API_KEY=key_primary

X601_BACKUP_BASE_URL=http://192.168.1.101:8080
X601_BACKUP_KEY=key_backup
```

---

## Contoh 6: Setup dengan Custom Headers

Jika X601 memerlukan custom headers tambahan:

Edit `app/Services/X601AttendanceService.php`:

```php
$response = Http::timeout(30)
    ->withHeaders([
        'Authorization' => 'Bearer ' . $this->apiKey,
        'Accept' => 'application/json',
        'X-Custom-Header' => env('X601_CUSTOM_HEADER'),
        'X-Request-ID' => uniqid(),
    ])
    ->get($this->apiBaseUrl . '/api/attendance', $params);
```

`.env`:

```env
X601_API_ENABLED=true
X601_API_BASE_URL=http://192.168.1.100:8080
X601_API_KEY=api_key
X601_CUSTOM_HEADER=custom_value
```

---

## Contoh 7: Setup Testing/Staging

```env
X601_API_ENABLED=true
X601_API_BASE_URL=http://staging-x601.company.local:8080
X601_API_KEY=staging_test_key
X601_API_TIMEOUT=30
```

**Digunakan untuk:**

-   Testing sebelum production
-   Development environment
-   Staging server

---

## Setup Checklist

### Sebelum Test

-   [ ] Mesin X601 sudah online
-   [ ] API endpoint sudah berjalan
-   [ ] API Key sudah didapatkan
-   [ ] Network connectivity OK (bisa ping)
-   [ ] Firewall allow port yang digunakan
-   [ ] .env sudah ter-update dengan benar

### Testing

-   [ ] Test manual: `php artisan attendance:sync-x601`
-   [ ] Test via UI: Dashboard → Sinkron X601
-   [ ] Check log: `tail -f storage/logs/laravel.log`
-   [ ] Verify data di database: Check `attendances` table

### Troubleshooting

Jika ada masalah:

1. **Test connectivity:**

    ```bash
    curl -I http://192.168.1.100:8080
    ping 192.168.1.100
    ```

2. **Test API dengan authentication:**

    ```bash
    curl -H "Authorization: Bearer YOUR_API_KEY" \
         http://192.168.1.100:8080/api/attendance
    ```

3. **Check Laravel logs:**
    ```bash
    tail -100 storage/logs/laravel.log | grep X601
    ```

---

## Performance Tips

### 1. Timeout Setting

-   Lokal/LAN: 15-30 detik
-   Internet: 30-60 detik
-   Mobile/VPN: 45-120 detik

### 2. Batch Processing

-   Jangan sync terlalu sering (max 1x/jam)
-   Ideal: 1x/hari di malam hari (23:00)

### 3. Connection Pooling

-   Untuk high-volume, bisa add connection timeout

### 4. Caching

Tambahkan caching untuk mengurangi API calls:

```php
$cacheKey = 'x601_attendance_' . $date . '_' . $employeeId;
return cache()->remember($cacheKey, 3600, function () use ($date, $employeeId) {
    return $this->fetchFromMachine($date, $employeeId);
});
```

---

## Security Best Practices

1. **API Key Protection**

    - Jangan hardcode di code
    - Gunakan .env dengan .gitignore
    - Rotate key secara berkala

2. **HTTPS**

    - Gunakan HTTPS untuk production
    - Verify SSL certificate

3. **Rate Limiting**

    - Implementasikan rate limit di routes
    - Cegah abuse dari luar

4. **Logging**

    - Log semua API activity
    - Jangan log sensitive data

5. **Monitoring**
    - Monitor success/failure rate
    - Set alert untuk errors

---

## Migrasi Konfigurasi

Jika perlu change konfigurasi di production:

```bash
# 1. Backup .env saat ini
cp .env .env.backup

# 2. Update konfigurasi
# Edit .env dengan konfigurasi baru

# 3. Test dengan employee kecil
php artisan attendance:sync-x601 --employee-id=E001 --verbose

# 4. Jika OK, sync semua
php artisan attendance:sync-x601

# 5. Monitor log
tail -f storage/logs/laravel.log
```

---

## Pertanyaan Umum

**Q: Bagaimana jika X601 sering offline?**
A: Implementasikan retry logic dengan exponential backoff

**Q: Bagaimana jika format API berubah?**
A: Update mapping di Service class, test dengan --verbose

**Q: Bagaimana jika data terlalu banyak?**
A: Implementasikan pagination atau batch processing

**Q: Bagaimana jika ada duplikasi?**
A: Gunakan updateOrCreate untuk prevent duplikasi

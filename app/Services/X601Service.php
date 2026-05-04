<?php

namespace App\Services;

class X601Service
{
    protected string $ip;
    protected int $port;
    protected string $key;

    public function __construct(string $ip, string $key, int $port = 80)
    {
        $this->ip = $ip;
        $this->port = $port;
        $this->key = $key;
    }

    public function getUsers(): array
    {
        $users = [];

        $connect = @fsockopen($this->ip, $this->port, $errno, $errstr, 10);
        if (!$connect) {
            throw new \Exception("Cannot connect to {$this->ip}:{$this->port} - {$errstr} ({$errno})");
        }

        $soap_request = '<?xml version="1.0"?><GetUserInfo><ArgComKey>'
            . $this->key . '</ArgComKey><Arg></Arg></GetUserInfo>';
        $newLine = "\r\n";

        fputs($connect, "POST /iWsService HTTP/1.0" . $newLine);
        fputs($connect, "Content-Type: text/xml" . $newLine);
        fputs($connect, "Content-Length: " . strlen($soap_request) . $newLine . $newLine);
        fputs($connect, $soap_request . $newLine);

        $buffer = "";
        while (!feof($connect)) $buffer .= fgets($connect, 1024);
        fclose($connect);

        // Check if we got a valid response
        if (strpos($buffer, '<GetUserInfoResponse>') === false) {
            throw new \Exception("Invalid response from X601 machine. Response: " . substr($buffer, 0, 200));
        }

        \Illuminate\Support\Facades\Log::debug("X601 GetUserInfo XML sample (first 2000): " . substr($buffer, 0, 2000));

        preg_match_all('/<Row[^>]*>(.*?)<\/Row>/s', $buffer, $rows);
        if (!empty($rows[1])) {
            foreach ($rows[1] as $rowIndex => $row) {
                preg_match('/<PIN>(.*?)<\/PIN>/', $row, $pin);
                preg_match('/<Name>(.*?)<\/Name>/', $row, $name);
                preg_match('/<PIN2>(.*?)<\/PIN2>/', $row, $pin2);
                $internalPin = trim(html_entity_decode($pin[1] ?? ''));
                $Name        = trim(html_entity_decode($name[1] ?? 'Tanpa Nama'));
                $PIN2        = trim(html_entity_decode($pin2[1] ?? ''));
                // Use PIN2 as actual employee PIN if available and valid, otherwise fall back to internal PIN
                $actualPin   = ($PIN2 !== '' && $PIN2 !== '0') ? $PIN2 : $internalPin;
                if ($internalPin !== '') {
                    // Map internal PIN → ['name', 'pin2'] for use in getLogs()
                    $users[$internalPin] = ['name' => $Name, 'pin2' => $actualPin];
                    if ($rowIndex < 30) {
                        preg_match_all('/<(\w+)>(.*?)<\/\1>/s', $row, $allFields, PREG_SET_ORDER);
                        $fieldStr = implode(', ', array_map(fn($f) => $f[1].'='.trim($f[2]), $allFields));
                        \Illuminate\Support\Facades\Log::debug("X601 User Row[{$rowIndex}]: {$fieldStr} → actualPin={$actualPin}");
                    }
                }
            }
        }

        return $users;
    }

    /**
     * Returns raw parsed data from the machine for debugging purposes.
     * Shows exactly what XML fields are returned per row.
     */
    public function getRawDebug(): array
    {
        $result = ['users_raw' => [], 'attlog_raw' => [], 'users_xml_sample' => '', 'attlog_xml_sample' => ''];

        // Raw user info
        try {
            $connect = @fsockopen($this->ip, $this->port, $errno, $errstr, 10);
            if ($connect) {
                $soap = '<?xml version="1.0"?><GetUserInfo><ArgComKey>' . $this->key . '</ArgComKey><Arg></Arg></GetUserInfo>';
                $nl   = "\r\n";
                fputs($connect, "POST /iWsService HTTP/1.0" . $nl);
                fputs($connect, "Content-Type: text/xml" . $nl);
                fputs($connect, "Content-Length: " . strlen($soap) . $nl . $nl);
                fputs($connect, $soap . $nl);
                $buf = '';
                while (!feof($connect)) $buf .= fgets($connect, 1024);
                fclose($connect);

                $result['users_xml_sample'] = substr($buf, 0, 2000);

                preg_match_all('/<Row[^>]*>(.*?)<\/Row>/s', $buf, $rows);
                foreach (($rows[1] ?? []) as $row) {
                    // Capture ALL XML tags in the row for inspection
                    preg_match_all('/<(\w+)>(.*?)<\/\1>/s', $row, $fields, PREG_SET_ORDER);
                    $parsed = [];
                    foreach ($fields as $f) {
                        $parsed[$f[1]] = trim(html_entity_decode($f[2]));
                    }
                    $result['users_raw'][] = $parsed;
                }
            }
        } catch (\Exception $e) {
            $result['users_error'] = $e->getMessage();
        }

        // Raw attendance log
        try {
            $connect = @fsockopen($this->ip, $this->port, $errno, $errstr, 20);
            if ($connect) {
                $soap = '<?xml version="1.0"?><GetAttLog><ArgComKey>' . $this->key . '</ArgComKey><Arg></Arg></GetAttLog>';
                $nl   = "\r\n";
                fputs($connect, "POST /iWsService HTTP/1.0" . $nl);
                fputs($connect, "Content-Type: text/xml" . $nl);
                fputs($connect, "Content-Length: " . strlen($soap) . $nl . $nl);
                fputs($connect, $soap . $nl);
                $buf = '';
                while (!feof($connect)) $buf .= fgets($connect, 1024);
                fclose($connect);

                $result['attlog_xml_sample'] = substr($buf, 0, 2000);

                preg_match_all('/<Row[^>]*>(.*?)<\/Row>/s', $buf, $rows);
                // Return first 20 rows only
                foreach (array_slice($rows[1] ?? [], 0, 20) as $row) {
                    preg_match_all('/<(\w+)>(.*?)<\/\1>/s', $row, $fields, PREG_SET_ORDER);
                    $parsed = [];
                    foreach ($fields as $f) {
                        $parsed[$f[1]] = trim(html_entity_decode($f[2]));
                    }
                    $result['attlog_raw'][] = $parsed;
                }
            }
        } catch (\Exception $e) {
            $result['attlog_error'] = $e->getMessage();
        }

        return $result;
    }

    public function getLogs(string $tgl_awal = '', string $tgl_akhir = ''): array
    {
        // $users keyed by internal machine PIN, value = ['name' => ..., 'pin2' => actual employee PIN]
        try {
            $users = $this->getUsers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Could not fetch users from X601: " . $e->getMessage());
            $users = [];
        }

        // Build lookup maps
        $nameByInternalPin = [];
        $pin2ByInternalPin = [];
        foreach ($users as $internalPin => $info) {
            $nameByInternalPin[$internalPin] = is_array($info) ? $info['name'] : $info;
            $pin2ByInternalPin[$internalPin] = is_array($info) ? $info['pin2'] : $internalPin;
        }

        $logs = [];

        $connect = @fsockopen($this->ip, $this->port, $errno, $errstr, 20);
        if (!$connect) {
            throw new \Exception("Cannot connect to {$this->ip}:{$this->port} for logs - {$errstr} ({$errno})");
        }

        $soap_request = '<?xml version="1.0"?><GetAttLog><ArgComKey>'
            . $this->key . '</ArgComKey><Arg></Arg></GetAttLog>';
        $newLine = "\r\n";

        fputs($connect, "POST /iWsService HTTP/1.0" . $newLine);
        fputs($connect, "Content-Type: text/xml" . $newLine);
        fputs($connect, "Content-Length: " . strlen($soap_request) . $newLine . $newLine);
        fputs($connect, $soap_request . $newLine);

        $buffer = "";
        while (!feof($connect)) $buffer .= fgets($connect, 1024);
        fclose($connect);

        // Log raw response for debugging
        \Illuminate\Support\Facades\Log::debug("X601 GetAttLog Response length: " . strlen($buffer));
        \Illuminate\Support\Facades\Log::debug("X601 GetAttLog XML sample (first 3000): " . substr($buffer, 0, 3000));

        // Check if we got a valid response
        if (strpos($buffer, '<GetAttLogResponse>') === false) {
            \Illuminate\Support\Facades\Log::error("Invalid response from X601 machine for logs. First 500 chars: " . substr($buffer, 0, 500));
            throw new \Exception("Invalid response from X601 machine for logs.");
        }

        preg_match_all('/<Row[^>]*>(.*?)<\/Row>/s', $buffer, $rows);
        if (empty($rows[1])) {
            \Illuminate\Support\Facades\Log::info("No rows found in X601 response");
            return [];
        }

        \Illuminate\Support\Facades\Log::info("Found " . count($rows[1]) . " rows from X601");

        $rawLogs = [];
        foreach ($rows[1] as $rowIndex => $row) {
            preg_match('/<PIN>(.*?)<\/PIN>/', $row, $pin);
            preg_match('/<DateTime>(.*?)<\/DateTime>/', $row, $time);

            $PIN = trim(html_entity_decode($pin[1] ?? ''));
            $DateTime = trim($time[1] ?? '');

            // Log first 20 rows for PIN diagnosis
            if ($rowIndex < 20) {
                // Capture all fields in row
                preg_match_all('/<(\w+)>(.*?)<\/\1>/s', $row, $allFields, PREG_SET_ORDER);
                $fieldStr = implode(', ', array_map(fn($f) => $f[1].'='.trim($f[2]), $allFields));
                \Illuminate\Support\Facades\Log::debug("X601 AttLog Row[{$rowIndex}]: {$fieldStr}");
            }

            if (!$PIN || !$DateTime) continue;

            // Parse Status field: 0=check-in, 1=check-out (ZKTeco standard)
            preg_match('/<Status>(.*?)<\/Status>/', $row, $statusMatch);
            $statusVal = trim($statusMatch[1] ?? '0');

            try {
                $tanggal = date('Y-m-d', strtotime($DateTime));
                $jam     = date('H:i:s', strtotime($DateTime));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("DateTime parsing error for PIN {$PIN}: {$DateTime}");
                continue;
            }

            if ($tgl_awal && $tgl_akhir) {
                if ($tanggal < $tgl_awal || $tanggal > $tgl_akhir) continue;
            }

            if (!isset($rawLogs[$PIN])) $rawLogs[$PIN] = [];
            if (!isset($rawLogs[$PIN][$tanggal])) $rawLogs[$PIN][$tanggal] = ['in' => [], 'out' => []];
            // Status 1 = checkout tap, anything else = check-in tap
            if ($statusVal === '1') {
                $rawLogs[$PIN][$tanggal]['out'][] = $jam;
            } else {
                $rawLogs[$PIN][$tanggal]['in'][] = $jam;
            }
        }

        $finalLogs = [];
        foreach ($rawLogs as $pin => $dates) {
            foreach ($dates as $tgl => $taps) {
                $inTaps  = $taps['in'];
                $outTaps = $taps['out'];

                // Gabungkan semua tap, ambil tap pertama sebagai check_in dan tap terakhir sebagai check_out
                $allTaps = array_merge($inTaps, $outTaps);
                sort($allTaps);

                $checkin  = $allTaps[0] ?? '';
                // check_out = tap paling terakhir, hanya diisi jika berbeda dengan check_in
                $lastTap  = !empty($allTaps) ? end($allTaps) : '';
                $checkout = ($lastTap && $lastTap !== $checkin) ? $lastTap : '';

                $jam_masuk  = "07:30:00";
                $jam_pulang = "16:30:00";

                if ($checkout) {
                    $real_masuk  = max($checkin, $jam_masuk);
                    $real_pulang = min($checkout, $jam_pulang);
                    $durasi = strtotime($real_pulang) - strtotime($real_masuk);
                    if ($durasi < 0) $durasi = 0;
                    $jam_kerja = gmdate("H:i:s", $durasi);

                    $status = "Tepat Waktu";
                    if ($checkin > $jam_masuk && $checkout < $jam_pulang) $status = "Telat & Pulang Cepat";
                    elseif ($checkin > $jam_masuk) $status = "Terlambat";
                    elseif ($checkout < $jam_pulang) $status = "Pulang Cepat";
                } else {
                    // Hanya check-in, belum check-out
                    $jam_kerja = "00:00:00";
                    $status    = $checkin > $jam_masuk ? "Terlambat" : "Belum Pulang";
                }

                // Gunakan internal PIN langsung sebagai identifier employee
                $actualPin    = $pin;
                $namaKaryawan = $nameByInternalPin[$pin] ?? 'Tidak Diketahui';

                $finalLogs[] = [
                    'pin'       => $actualPin,
                    'nama'      => $namaKaryawan,
                    'tanggal'   => $tgl,
                    'checkin'   => $checkin,
                    'checkout'  => $checkout,
                    'jam_kerja' => $jam_kerja,
                    'status'    => $status,
                ];
            }
        }

        \Illuminate\Support\Facades\Log::info("Total final logs: " . count($finalLogs));
        return $finalLogs;
    }
}

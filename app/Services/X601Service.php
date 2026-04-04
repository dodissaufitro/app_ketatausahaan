<?php

namespace App\Services;

class X601Service
{
    protected string $ip;
    protected int $port;
    protected string $key;

    public function __construct(string $ip, string $key, int $port = 1121)
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

        preg_match_all('/<Row[^>]*>(.*?)<\/Row>/s', $buffer, $rows);
        if (!empty($rows[1])) {
            foreach ($rows[1] as $row) {
                preg_match('/<PIN>(.*?)<\/PIN>/', $row, $pin);
                preg_match('/<Name>(.*?)<\/Name>/', $row, $name);
                $PIN  = trim($pin[1] ?? '');
                $Name = trim($name[1] ?? 'Tanpa Nama');
                if ($PIN !== '') $users[$PIN] = $Name;
            }
        }

        return $users;
    }

    public function getLogs(string $tgl_awal = '', string $tgl_akhir = ''): array
    {
        try {
            $users = $this->getUsers();
        } catch (\Exception $e) {
            // Continue with empty users array if unable to fetch
            \Illuminate\Support\Facades\Log::warning("Could not fetch users from X601: " . $e->getMessage());
            $users = [];
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
        foreach ($rows[1] as $row) {
            preg_match('/<PIN>(.*?)<\/PIN>/', $row, $pin);
            preg_match('/<DateTime>(.*?)<\/DateTime>/', $row, $time);

            $PIN = $pin[1] ?? '';
            $DateTime = $time[1] ?? '';
            if (!$PIN || !$DateTime) continue;

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
            if (!isset($rawLogs[$PIN][$tanggal])) $rawLogs[$PIN][$tanggal] = [];
            $rawLogs[$PIN][$tanggal][] = $jam;
        }

        $finalLogs = [];
        foreach ($rawLogs as $pin => $dates) {
            foreach ($dates as $tgl => $jam_list) {
                sort($jam_list);
                $checkin  = $jam_list[0];
                $checkout = end($jam_list);

                $jam_masuk  = "07:30:00";
                $jam_pulang = "16:30:00";

                $real_masuk  = max($checkin, $jam_masuk);
                $real_pulang = min($checkout, $jam_pulang);

                $durasi = strtotime($real_pulang) - strtotime($real_masuk);
                if ($durasi < 0) $durasi = 0;

                $jam_kerja = gmdate("H:i:s", $durasi);

                $status = "Tepat Waktu";
                if ($checkin > $jam_masuk && $checkout < $jam_pulang) $status = "Telat & Pulang Cepat";
                elseif ($checkin > $jam_masuk) $status = "Terlambat";
                elseif ($checkout < $jam_pulang) $status = "Pulang Cepat";

                $finalLogs[] = [
                    'pin'       => $pin,
                    'nama'      => $users[$pin] ?? 'Tidak Diketahui',
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

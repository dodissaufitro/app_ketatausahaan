<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\LoginAttemptService;
use App\Models\LoginAttempt;
use Illuminate\Support\Facades\Auth;

$service   = new LoginAttemptService();
$sessionId = 'cli_test_session_admin';
$email     = 'admin@admin.com';
$password  = 'passwordSALAH123';
$ip        = '127.0.0.1';

// Bersihkan data lama
LoginAttempt::where('session_id', $sessionId)->delete();

echo "=== TEST LOGIN 3x GAGAL: admin@admin.com ===\n\n";

for ($i = 1; $i <= 3; $i++) {
    echo "--- Percobaan ke-{$i} ---\n";

    // Cek apakah sudah diblokir sebelum percobaan
    $status = $service->isBlocked($sessionId);
    if ($status['blocked']) {
        echo "Status  : SUDAH DIBLOKIR (sebelum percobaan)\n";
        echo "Sisa    : {$status['remaining_minutes']} menit\n\n";
        break;
    }

    // Simulasi Auth::attempt dengan password salah
    $berhasil = Auth::attempt(['email' => $email, 'password' => $password]);

    if (!$berhasil) {
        $result = $service->recordFailedAttempt($sessionId, $email, $ip);

        if ($result['blocked']) {
            echo "Hasil   : GAGAL LOGIN\n";
            echo "Status  : >>> LANGSUNG DIBLOKIR! <<<\n";
            echo "Level   : {$result['block_level']}\n";
            echo "Durasi  : {$result['remaining_minutes']} menit\n";
            echo "Sampai  : {$result['blocked_until']}\n";
        } else {
            echo "Hasil   : GAGAL LOGIN\n";
            echo "Sisa    : {$result['remaining_attempts']} percobaan lagi\n";
        }
    } else {
        echo "Hasil   : LOGIN BERHASIL\n";
    }

    echo "\n";
}

echo "=== HASIL AKHIR DI DATABASE ===\n";
$rec = LoginAttempt::where('session_id', $sessionId)->first();
if ($rec) {
    echo "Session   : {$rec->session_id}\n";
    echo "Email     : {$rec->email}\n";
    echo "Blok Level: {$rec->block_level}\n";
    echo "Diblokir  : " . ($rec->isBlocked() ? "YA - sampai {$rec->blocked_until}" : 'TIDAK') . "\n";
} else {
    echo "Tidak ada record di database\n";
}

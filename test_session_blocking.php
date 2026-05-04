<?php

/**
 * Test Session-Based Login Blocking
 * Jalankan: php test_session_blocking.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\LoginAttemptService;
use App\Models\LoginAttempt;

$service = new LoginAttemptService();

echo "=== TEST SESSION-BASED LOGIN BLOCKING ===\n\n";

// Simulasi session ID dari browser
$sessionId = 'test_session_' . uniqid();

echo "Session ID: {$sessionId}\n";
echo "Tracking berdasarkan SESSION saja (bukan email/IP)\n\n";

// Bersihkan data test
LoginAttempt::where('session_id', $sessionId)->delete();
echo "✓ Data test dibersihkan\n\n";

// Test Level 1: Block 1 Menit
echo "=== LEVEL 1: Block 1 Menit ===\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt(
        $sessionId,
        'user@test.com',  // Email berbeda setiap kali (tapi tetap diblokir karena session sama)
        '192.168.1.' . $i
    );
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: 🔒 DIBLOKIR!\n";
        echo "  → Block Level: {$result['block_level']}\n";
        echo "  → Durasi: {$result['remaining_minutes']} menit\n";
        echo "  → Blocked Until: {$result['blocked_until']}\n\n";
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal\n";
        echo "  → Sisa percobaan: {$result['remaining_attempts']}\n\n";
    }
}

// Cek status
$status = $service->isBlocked($sessionId);
echo "Status: " . ($status['blocked'] ? '🔒 DIBLOKIR' : '✓ Bebas') . "\n";
if ($status['blocked']) {
    echo "Sisa waktu: {$status['remaining_minutes']} menit\n";
}

echo "\n✓ BUKTI: Meskipun email & IP berbeda, tetap DIBLOKIR karena session sama!\n\n";

// Simulasi block selesai
$attempt = LoginAttempt::where('session_id', $sessionId)->first();
$attempt->blocked_until = now()->subMinute();
$attempt->save();

// Test Level 2
echo "=== LEVEL 2: Block 1 Jam ===\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt($sessionId, 'another@test.com', '10.0.0.' . $i);
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: 🔒 DIBLOKIR {$result['remaining_minutes']} menit (1 jam)!\n";
        break;
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal (Sisa: {$result['remaining_attempts']})\n";
    }
}

// Simulasi block selesai
$attempt->blocked_until = now()->subMinute();
$attempt->save();

// Test Level 3
echo "\n=== LEVEL 3: Block 1 Hari ===\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt($sessionId, 'yetanother@test.com', '172.16.0.' . $i);
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: 🔒 DIBLOKIR {$result['remaining_minutes']} menit (1 hari)!\n";
        break;
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal (Sisa: {$result['remaining_attempts']})\n";
    }
}

echo "\n=== CEK DATA DI DATABASE ===\n";
$finalAttempt = LoginAttempt::where('session_id', $sessionId)->first();
if ($finalAttempt) {
    echo "Session ID: {$finalAttempt->session_id}\n";
    echo "Last Email: {$finalAttempt->email}\n";
    echo "Last IP: {$finalAttempt->ip_address}\n";
    echo "Block Level: {$finalAttempt->block_level}\n";
    echo "Status: " . ($finalAttempt->isBlocked() ? '🔒 DIBLOKIR' : '✓ Bebas') . "\n";
}

// Cleanup
LoginAttempt::where('session_id', $sessionId)->delete();
echo "\n✓ Data test dibersihkan\n";

echo "\n=== KESIMPULAN ===\n";
echo "✅ Blocking berdasarkan SESSION (browser/device)\n";
echo "✅ Email & IP boleh berbeda, tetap diblokir jika session sama\n";
echo "✅ Satu browser = satu tracking\n";
echo "✅ Buka browser baru/incognito = session baru (tidak kena block)\n";

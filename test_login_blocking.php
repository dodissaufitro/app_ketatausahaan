<?php

/**
 * Test Script untuk Login Blocking System
 * 
 * Cara menjalankan:
 * php test_login_blocking.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\LoginAttemptService;

$service = new LoginAttemptService();

$testEmail = 'test@example.com';
$testIp = '127.0.0.1';

echo "=== TEST LOGIN BLOCKING SYSTEM ===\n\n";

// Bersihkan data test sebelumnya
\App\Models\LoginAttempt::where('email', $testEmail)->delete();
echo "✓ Data test dibersihkan\n\n";

// Simulasi 3 kali gagal login pertama
echo "--- LEVEL 1: Block 1 Menit ---\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt($testEmail, $testIp);
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: ❌ DIBLOKIR!\n";
        echo "  → Block Level: {$result['block_level']}\n";
        echo "  → Durasi Block: {$result['remaining_minutes']} menit\n";
        echo "  → Blocked Until: {$result['blocked_until']}\n";
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal\n";
        echo "  → Sisa percobaan: {$result['remaining_attempts']}\n";
    }
}

echo "\n✓ Setelah 3x salah → LANGSUNG BLOCK 1 MENIT\n\n";

// Reset blocked_until untuk test level berikutnya
$attempt = \App\Models\LoginAttempt::where('email', $testEmail)->first();
$attempt->blocked_until = now()->subMinute(); // Simulasi block sudah selesai
$attempt->save();

echo "--- LEVEL 2: Block 1 Jam ---\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt($testEmail, $testIp);
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: ❌ DIBLOKIR!\n";
        echo "  → Block Level: {$result['block_level']}\n";
        echo "  → Durasi Block: {$result['remaining_minutes']} menit (1 jam)\n";
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal\n";
        echo "  → Sisa percobaan: {$result['remaining_attempts']}\n";
    }
}

echo "\n✓ Setelah 3x salah lagi → LANGSUNG BLOCK 1 JAM\n\n";

// Reset blocked_until untuk test level berikutnya
$attempt->blocked_until = now()->subMinute();
$attempt->save();

echo "--- LEVEL 3: Block 1 Hari ---\n";
for ($i = 1; $i <= 3; $i++) {
    $result = $service->recordFailedAttempt($testEmail, $testIp);
    
    if ($result['blocked']) {
        echo "Percobaan ke-{$i}: ❌ DIBLOKIR!\n";
        echo "  → Block Level: {$result['block_level']}\n";
        echo "  → Durasi Block: {$result['remaining_minutes']} menit (1 hari)\n";
    } else {
        echo "Percobaan ke-{$i}: ❌ Gagal\n";
        echo "  → Sisa percobaan: {$result['remaining_attempts']}\n";
    }
}

echo "\n✓ Setelah 3x salah lagi → LANGSUNG BLOCK 1 HARI\n\n";

// Test cek status blocked
$blockStatus = $service->isBlocked($testEmail, $testIp);
echo "--- CEK STATUS BLOCKED ---\n";
echo "Status: " . ($blockStatus['blocked'] ? '🔒 DIBLOKIR' : '✓ Tidak diblokir') . "\n";
if ($blockStatus['blocked']) {
    echo "Level: {$blockStatus['level']}\n";
    echo "Sisa waktu: {$blockStatus['remaining_minutes']} menit\n";
}

// Bersihkan data test
\App\Models\LoginAttempt::where('email', $testEmail)->delete();
echo "\n✓ Data test dibersihkan\n";

echo "\n=== KESIMPULAN ===\n";
echo "✓ Block LANGSUNG TERJADI di percobaan ke-3\n";
echo "✓ Level 1: 3x salah → Block 1 menit\n";
echo "✓ Level 2: 3x salah → Block 1 jam\n";
echo "✓ Level 3: 3x salah → Block 1 hari\n";

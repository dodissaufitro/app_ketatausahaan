<?php

/**
 * Cek status login attempts di database (Session-Based)
 * Jalankan: php check_login_status.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\LoginAttempt;

echo "=== STATUS LOGIN ATTEMPTS (SESSION-BASED) ===\n\n";

$attempts = LoginAttempt::orderBy('updated_at', 'desc')->get();

if ($attempts->isEmpty()) {
    echo "Tidak ada data login attempts.\n";
} else {
    foreach ($attempts as $attempt) {
        echo "Session ID: {$attempt->session_id}\n";
        echo "Email: " . ($attempt->email ?? '-') . "\n";
        echo "IP Address: {$attempt->ip_address}\n";
        echo "Failed Attempts: {$attempt->failed_attempts}\n";
        echo "Block Level: {$attempt->block_level}\n";
        echo "Blocked Until: " . ($attempt->blocked_until ? $attempt->blocked_until : '-') . "\n";
        echo "Status: " . ($attempt->isBlocked() ? '🔒 DIBLOKIR' : '✓ Tidak diblokir') . "\n";
        
        if ($attempt->isBlocked()) {
            $remaining = ceil($attempt->remainingBlockTime() / 60);
            echo "Sisa waktu: {$remaining} menit\n";
        }
        
        echo "Last Attempt: {$attempt->last_attempt_at}\n";
        echo "----------------------------------------\n";
    }
}

echo "\nTotal records: " . $attempts->count() . "\n";
echo "\n💡 Tracking berdasarkan SESSION (bukan email)\n";
echo "   - Satu browser/tab = satu session\n";
echo "   - Buka incognito/browser baru = session baru\n";

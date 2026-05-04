<?php

/**
 * Test Login Real dengan HTTP Request
 * Simulasi login dari browser
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\Validator;

echo "=== TEST LOGIN REAL (HTTP Simulation) ===\n\n";

// Bersihkan data test
\App\Models\LoginAttempt::where('email', 'test@updp.com')->delete();
echo "✓ Data test dibersihkan\n\n";

$testEmail = 'test@updp.com';
$testPassword = 'passwordsalah';

echo "Email: {$testEmail}\n";
echo "Password: {$testPassword} (sengaja salah)\n";
echo "IP: 127.0.0.1\n\n";

for ($i = 1; $i <= 5; $i++) {
    echo "--- PERCOBAAN KE-{$i} ---\n";
    
    try {
        // Create request instance
        $request = Request::create('/login', 'POST', [
            'email' => $testEmail,
            'password' => $testPassword,
        ], [], [], [
            'REMOTE_ADDR' => '127.0.0.1',
        ]);
        
        // Create LoginRequest instance and validate
        $loginRequest = LoginRequest::createFrom($request);
        $loginRequest->setContainer(app());
        
        // Validate
        $validator = Validator::make($loginRequest->all(), $loginRequest->rules());
        if ($validator->fails()) {
            echo "❌ Validasi gagal: " . $validator->errors()->first() . "\n";
            continue;
        }
        
        // Try authenticate
        $loginRequest->authenticate();
        
        echo "✓ Login berhasil!\n";
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        $errors = $e->errors();
        echo "❌ LOGIN GAGAL\n";
        echo "Pesan: " . ($errors['email'][0] ?? 'Unknown error') . "\n";
    } catch (\Exception $e) {
        echo "❌ ERROR: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Cek status di database
    $attempt = \App\Models\LoginAttempt::where('email', $testEmail)->first();
    if ($attempt) {
        echo "Database Status:\n";
        echo "  - Failed Attempts: {$attempt->failed_attempts}\n";
        echo "  - Block Level: {$attempt->block_level}\n";
        echo "  - Blocked Until: " . ($attempt->blocked_until ? $attempt->blocked_until : 'Tidak') . "\n";
    }
    
    echo "\n";
    
    // Jika sudah block, stop
    if ($attempt && $attempt->isBlocked()) {
        echo "🔒 USER SUDAH DIBLOKIR! Test selesai.\n";
        break;
    }
    
    sleep(1); // Delay 1 detik
}

echo "\n=== HASIL AKHIR ===\n";
$finalAttempt = \App\Models\LoginAttempt::where('email', $testEmail)->first();
if ($finalAttempt) {
    echo "✓ Data tersimpan di database\n";
    echo "  - Total failed attempts: {$finalAttempt->failed_attempts}\n";
    echo "  - Block level: {$finalAttempt->block_level}\n";
    echo "  - Status: " . ($finalAttempt->isBlocked() ? '🔒 DIBLOKIR' : '✓ Tidak diblokir') . "\n";
    
    if ($finalAttempt->isBlocked()) {
        $remaining = $finalAttempt->remainingBlockTime();
        echo "  - Sisa waktu block: " . ceil($remaining / 60) . " menit\n";
    }
}

// Cleanup
\App\Models\LoginAttempt::where('email', $testEmail)->delete();
echo "\n✓ Data test dibersihkan\n";

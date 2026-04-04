<?php

namespace App\Console\Commands;

use App\Services\X601AttendanceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncX601Users extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'x601:sync-users
                            {--ip= : IP address mesin X601 (default dari config)}
                            {--key= : Communication key (default dari config)}
                            {--port= : Port mesin X601 (default 1121)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronisasi daftar user/karyawan dari mesin X601 ke database employees';

    /**
     * Execute the console command.
     */
    public function handle(X601AttendanceService $service): int
    {
        $verbose = $this->getOutput()->isVerbose();

        if ($verbose) {
            $this->info('🚀 Starting X601 User Synchronization...');
            $this->newLine();
        }

        $ip   = $this->option('ip');
        $key  = $this->option('key');
        $port = $this->option('port') ? (int) $this->option('port') : null;

        Log::info('X601 User Sync: Command started', compact('ip', 'key', 'port'));

        try {
            if ($verbose) {
                $this->info('📡 Fetching user list from X601 machine...');
            }

            $result = $service->syncUsersFromX601($ip, $key, $port);

            if ($verbose) {
                $this->newLine();
            }

            // Display results
            $this->info("✅ Sinkronisasi selesai:");
            $this->line("   • User baru dibuat    : {$result['created']}");
            $this->line("   • User diupdate       : {$result['updated']}");
            $this->line("   • User tidak berubah  : {$result['skipped']}");
            $this->line("   • Total di mesin      : {$result['total']}");

            if (!empty($result['errors'])) {
                $this->newLine();
                $this->error("❌ Terjadi error pada " . count($result['errors']) . " user:");
                if ($verbose) {
                    foreach ($result['errors'] as $error) {
                        $this->line("  • <fg=red>{$error}</>");
                    }
                }
            }

            Log::info('X601 User Sync: Completed', [
                'created' => $result['created'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped'],
                'errors'  => count($result['errors'])
            ]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $errorMessage = "❌ Sinkronisasi user gagal: " . $e->getMessage();
            $this->error($errorMessage);
            Log::error('X601 User Sync: Failed', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString()
            ]);

            if ($verbose) {
                $this->newLine();
                $this->line("<fg=red>" . $e->getTraceAsString() . "</>");
            }

            return self::FAILURE;
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Services\X601AttendanceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncX601AttendanceDaily extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:sync-x601-daily';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize all attendance data from X601 machine (daily comprehensive sync)';

    /**
     * Execute the console command.
     */
    public function handle(X601AttendanceService $service): int
    {
        $verbose = $this->getOutput()->isVerbose();

        if ($verbose) {
            $this->info('🚀 Starting Daily X601 Attendance Synchronization...');
            $this->newLine();
        }

        // Log the start of synchronization
        Log::info('Daily X601 Attendance Synchronization started');

        try {
            if ($verbose) {
                $this->info('📡 Fetching all available data from X601 machine...');
            }

            // Use the comprehensive sync method
            $result = $service->syncAllAttendance();

            if ($verbose) {
                $this->newLine();
            }

            // Display results
            if ($result['synced'] > 0) {
                $message = "✅ Successfully synced: {$result['synced']} records";
                $this->info($message);
                Log::info($message);
            }

            if (isset($result['absent_marked']) && $result['absent_marked'] > 0) {
                $absentMessage = "📋 Marked as absent: {$result['absent_marked']} employees";
                $this->info($absentMessage);
                Log::info($absentMessage);
            }

            if (isset($result['dates_processed'])) {
                $datesMessage = "📅 Dates processed: {$result['dates_processed']} days";
                if ($verbose) {
                    $this->info($datesMessage);
                }
                Log::info($datesMessage);
            }

            if (!empty($result['errors'])) {
                $errorCount = count($result['errors']);
                $errorMessage = "❌ Errors encountered: {$errorCount} records";
                $this->error($errorMessage);
                Log::warning($errorMessage);

                if ($verbose) {
                    $this->line("\n📋 Error Details:");
                    foreach ($result['errors'] as $error) {
                        $this->line("  • <fg=red>$error</>");
                        Log::warning("Sync error: $error");
                    }
                }
            } else {
                $this->info("✅ No errors encountered");
            }

            $totalMessage = "\n📊 Total records processed: {$result['total_processed']}";
            if ($verbose) {
                $this->info($totalMessage);
            }

            $successRate = round(($result['synced'] / ($result['total_processed'] ?: 1)) * 100, 2);
            $rateMessage = "📈 Success rate: {$successRate}%";

            if ($verbose) {
                $this->info($rateMessage);
            }

            // Log completion
            Log::info("Daily X601 sync completed. Total: {$result['total_processed']}, Synced: {$result['synced']}, Absent Marked: " . ($result['absent_marked'] ?? 0) . ", Errors: " . count($result['errors'] ?? []));

            return self::SUCCESS;
        } catch (\Exception $e) {
            $errorMessage = "❌ Daily synchronization failed: " . $e->getMessage();
            $this->error($errorMessage);
            Log::error($errorMessage, [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($verbose) {
                $this->newLine();
                $this->line("<fg=red>" . $e->getTraceAsString() . "</>");
            }

            return self::FAILURE;
        }
    }
}

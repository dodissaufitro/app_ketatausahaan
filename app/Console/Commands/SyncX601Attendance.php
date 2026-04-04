<?php

namespace App\Console\Commands;

use App\Services\X601AttendanceService;
use Illuminate\Console\Command;

class SyncX601Attendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:sync-x601 
                            {--date= : Filter by specific date (Y-m-d format)}
                            {--employee-id= : Filter by employee ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize attendance data from X601 machine';

    /**
     * Execute the console command.
     */
    public function handle(X601AttendanceService $service): int
    {
        $verbose = $this->getOutput()->isVerbose();

        $this->info('Starting X601 Attendance Synchronization...');
        $this->newLine();

        $date = $this->option('date');
        $employeeId = $this->option('employee-id');

        if ($date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $this->error('Invalid date format. Please use Y-m-d format (e.g., 2025-01-15)');
            return self::FAILURE;
        }

        try {
            $this->info('Fetching data from X601 machine...');

            if ($date) {
                $this->line("  Date filter: <fg=cyan>$date</>");
            }
            if ($employeeId) {
                $this->line("  Employee ID filter: <fg=cyan>$employeeId</>");
            }

            $result = $service->syncAttendance($date, $employeeId);

            $this->newLine();

            // Display results
            if ($result['synced'] > 0) {
                $this->info("✓ Successfully synced: {$result['synced']} records");
            }

            if (isset($result['absent_marked']) && $result['absent_marked'] > 0) {
                $this->info("✓ Marked as absent: {$result['absent_marked']} employees");
            }

            if (!empty($result['errors'])) {
                $this->error("✗ Errors encountered: " . count($result['errors']) . " records");

                $this->line("\nError Details:");
                foreach ($result['errors'] as $error) {
                    $this->line("  • <fg=red>$error</>");
                }
            } else {
                $this->info("✓ No errors encountered");
            }

            $this->info("\nTotal records processed: {$result['total']}");
            $this->info("Success rate: " . round(($result['synced'] / ($result['total'] ?: 1)) * 100, 2) . "%");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Synchronization failed: " . $e->getMessage());

            if ($verbose) {
                $this->newLine();
                $this->line("<fg=red>" . $e->getTraceAsString() . "</>");
            }

            return self::FAILURE;
        }
    }
}

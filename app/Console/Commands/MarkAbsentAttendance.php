<?php

namespace App\Console\Commands;

use App\Services\X601AttendanceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MarkAbsentAttendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:mark-absent
                            {--date= : Tanggal yang diproses (format Y-m-d, default: kemarin)}
                            {--no-skip-weekends : Proses juga hari Sabtu dan Minggu}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tandai semua karyawan aktif yang tidak absen pada tanggal tertentu sebagai tidak hadir (absent)';

    /**
     * Execute the console command.
     */
    public function handle(X601AttendanceService $service): int
    {
        $date = $this->option('date') ?? now()->subDay()->format('Y-m-d');
        $skipWeekends = !$this->option('no-skip-weekends');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $this->error("Format tanggal tidak valid: {$date}. Gunakan format Y-m-d (contoh: 2026-04-01)");
            return self::FAILURE;
        }

        $this->info("Memproses absensi untuk tanggal: {$date}");
        if ($skipWeekends) {
            $this->line('  Hari Sabtu/Minggu akan dilewati.');
        }

        Log::info("MarkAbsentAttendance: Starting for date={$date}, skipWeekends=" . ($skipWeekends ? 'yes' : 'no'));

        try {
            $result = $service->markAbsentForDate($date, $skipWeekends);

            $this->info("Selesai. Ditandai tidak hadir : {$result['marked']} karyawan");
            $this->info("Sudah memiliki absensi      : {$result['skipped']} karyawan");

            if (!empty($result['errors'])) {
                $this->warn("Terjadi error pada " . count($result['errors']) . " karyawan:");
                foreach ($result['errors'] as $err) {
                    $this->line("  - {$err}");
                }
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $message = "MarkAbsentAttendance gagal: " . $e->getMessage();
            $this->error($message);
            Log::error($message, ['trace' => $e->getTraceAsString()]);
            return self::FAILURE;
        }
    }
}

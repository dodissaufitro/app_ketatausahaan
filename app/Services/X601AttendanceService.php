<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class X601AttendanceService
{
    protected X601Service $x601Service;

    public function __construct()
    {
        // Initialize with values from config
        $baseUrl = config('services.x601.base_url', '10.1.7.28:80');
        $key = config('services.x601.api_key', '0');

        // Parse IP and port from base_url
        $parsedUrl = parse_url($baseUrl);
        $ip = $parsedUrl['host'] ?? '10.1.7.28';
        $port = $parsedUrl['port'] ?? 80;

        $this->x601Service = new X601Service($ip, $key, $port);
    }

    protected function createService(?string $ip, ?string $key, ?int $port = null): X601Service
    {
        if ($ip && $key) {
            return new X601Service($ip, $key, $port ?? 80);
        }

        return $this->x601Service;
    }

    /**
     * Sync attendance data from X601 machine
     */
    public function syncAttendance(?string $date = null, ?string $employeeId = null, ?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $synced = 0;
        $errors = [];

        $service = $this->createService($ip, $key, $port);

        try {
            $tglAwal = $date ?? '';
            $tglAkhir = $date ?? '';

            Log::info("X601 Sync: Fetching logs - Date range: {$tglAwal} to {$tglAkhir}");

            $logs = $service->getLogs($tglAwal, $tglAkhir);

            Log::info("X601 Sync: Retrieved " . count($logs) . " logs");

            foreach ($logs as $log) {
                try {
                    // Find employee by PIN or employee_id
                    $employee = Employee::where('employee_id', $log['pin'])
                        ->orWhere('pin', $log['pin'])
                        ->first();

                    if (!$employee) {
                        $errors[] = "Employee not found for PIN: {$log['pin']}";
                        Log::warning("X601 Sync: Employee not found - PIN: {$log['pin']}");
                        continue;
                    }

                    // Check if attendance already exists
                    $existing = Attendance::where('employee_id', $employee->id)
                        ->whereDate('date', $log['tanggal'])
                        ->first();

                    $data = [
                        'employee_id' => $employee->id,
                        'date' => $log['tanggal'],
                        'check_in' => $log['checkin'] ?: null,
                        'check_out' => $log['checkout'] ?: null,
                        'status' => $this->determineStatus($log),
                        'work_hours' => $this->calculateWorkHours($log['checkin'], $log['checkout']),
                        'source' => 'x601',
                        'machine_name' => $log['nama'] ?? null,
                    ];

                    if ($existing) {
                        $existing->update($data);
                        Log::info("X601 Sync: Updated attendance for {$employee->name} on {$log['tanggal']}");
                    } else {
                        Attendance::create($data);
                        Log::info("X601 Sync: Created attendance for {$employee->name} on {$log['tanggal']}");
                    }

                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = "Error processing employee {$log['pin']}: " . $e->getMessage();
                    Log::error("X601 Sync Error for PIN {$log['pin']}: " . $e->getMessage());
                }
            }

            Log::info("X601 Sync Complete: Synced {$synced}, Errors: " . count($errors));
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 Connection Error: " . $e->getMessage());
        }

        return [
            'synced' => $synced,
            'errors' => $errors,
            'total' => $synced + count($errors)
        ];
    }

    /**
     * Fetch data from X601 machine without syncing
     */
    public function fetchFromMachine(?string $date = null, ?string $employeeId = null, ?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $service = $this->createService($ip, $key, $port);
        $logs = $service->getLogs($date ?? '', $date ?? '');

        // Filter by date if provided
        if ($date) {
            $logs = array_filter($logs, function ($log) use ($date) {
                return $log['tanggal'] === $date;
            });
        }

        // Filter by employee if provided
        if ($employeeId) {
            $logs = array_filter($logs, function ($log) use ($employeeId) {
                return $log['pin'] === $employeeId;
            });
        }

        return array_values($logs);
    }

    /**
     * Sync all attendance data from X601 machine (comprehensive sync)
     */
    public function syncAllAttendance(?string $employeeId = null, ?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $synced = 0;
        $errors = [];

        $service = $this->createService($ip, $key, $port);

        try {
            Log::info("X601 Comprehensive Sync: Fetching all logs from machine");

            // Fetch all logs without date filter
            $logs = $service->getLogs('', '');

            Log::info("X601 Comprehensive Sync: Retrieved " . count($logs) . " logs from machine");

            foreach ($logs as $log) {
                try {
                    // Filter by employee if specified
                    if ($employeeId && $log['pin'] !== $employeeId) {
                        continue;
                    }

                    // Find employee by PIN or employee_id
                    $employee = Employee::where('employee_id', $log['pin'])
                        ->orWhere('pin', $log['pin'])
                        ->first();

                    if (!$employee) {
                        $errors[] = "Employee not found for PIN: {$log['pin']} (Date: {$log['tanggal']})";
                        Log::warning("X601 Comprehensive Sync: Employee not found - PIN: {$log['pin']}, Date: {$log['tanggal']}");
                        continue;
                    }

                    // Check if attendance already exists
                    $existing = Attendance::where('employee_id', $employee->id)
                        ->whereDate('date', $log['tanggal'])
                        ->first();

                    $data = [
                        'employee_id' => $employee->id,
                        'date' => $log['tanggal'],
                        'check_in' => $log['checkin'] ?: null,
                        'check_out' => $log['checkout'] ?: null,
                        'status' => $this->determineStatus($log),
                        'work_hours' => $this->calculateWorkHours($log['checkin'], $log['checkout']),
                        'source' => 'x601',
                        'machine_name' => $log['nama'] ?? null,
                    ];

                    if ($existing) {
                        $existing->update($data);
                        Log::info("X601 Comprehensive Sync: Updated attendance for {$employee->name} on {$log['tanggal']}");
                    } else {
                        Attendance::create($data);
                        Log::info("X601 Comprehensive Sync: Created attendance for {$employee->name} on {$log['tanggal']}");
                    }

                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = "Error processing employee {$log['pin']} on {$log['tanggal']}: " . $e->getMessage();
                    Log::error("X601 Comprehensive Sync Error for PIN {$log['pin']} on {$log['tanggal']}: " . $e->getMessage());
                }
            }

            Log::info("X601 Comprehensive Sync Complete: Synced {$synced}, Errors: " . count($errors));
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 Comprehensive Connection Error: " . $e->getMessage());
        }

        return [
            'synced' => $synced,
            'errors' => $errors,
            'total_processed' => $synced + count($errors),
            'message' => 'Comprehensive sync completed'
        ];
    }

    /**
     * Determine attendance status based on log data
     */
    private function determineStatus(array $log): string
    {
        if (isset($log['status'])) {
            // Map X601 status to our system
            $statusMap = [
                'Tepat Waktu' => 'present',
                'Terlambat' => 'late',
                'Pulang Cepat' => 'half-day',
                'Telat & Pulang Cepat' => 'half-day',
            ];

            return $statusMap[$log['status']] ?? 'present';
        }

        // Default logic
        if (!$log['checkin']) {
            return 'absent';
        }

        return 'present';
    }

    /**
     * Calculate work hours from check in/out times
     */
    private function calculateWorkHours(?string $checkIn, ?string $checkOut): ?float
    {
        if (!$checkIn || !$checkOut) {
            return null;
        }

        try {
            $start = strtotime($checkIn);
            $end = strtotime($checkOut);

            if ($end <= $start) {
                return null;
            }

            $hours = ($end - $start) / 3600;
            return round($hours, 2);
        } catch (\Exception $e) {
            return null;
        }
    }
}

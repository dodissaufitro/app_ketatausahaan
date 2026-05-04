<?php

declare(strict_types=1);

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
        $baseUrl = config('services.x601.base_url', '10.88.125.230:80');
        $key = config('services.x601.api_key', '0');

        // Parse IP and port from base_url
        $parsedUrl = parse_url($baseUrl);
        $ip = $parsedUrl['host'] ?? '10.88.125.230';
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
    public function syncAttendance(?string $startDate = null, ?string $endDate = null, ?string $employeeId = null, ?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $synced = 0;
        $errors = [];
        $absentMarked = 0;

        $service = $this->createService($ip, $key, $port);

        try {
            $tglAwal = $startDate ?? '';
            $tglAkhir = $endDate ?? $tglAwal;

            Log::info("X601 Sync: Fetching logs - Date range: {$tglAwal} to {$tglAkhir}");

            $logs = $service->getLogs($tglAwal, $tglAkhir);

            Log::info("X601 Sync: Retrieved " . count($logs) . " logs");

            foreach ($logs as $log) {
                try {
                    // Find employee by PIN or employee_id
                    $employee = Employee::where('employee_id', $log['pin'])
                        ->orWhere('pin', $log['pin'])
                        ->first();

                    // Fallback: match by name if not found by PIN
                    if (!$employee && !empty($log['nama']) && $log['nama'] !== 'Tidak Diketahui') {
                        $employee = Employee::where('name', $log['nama'])->first();
                        if ($employee) {
                            $employee->update(['pin' => $log['pin']]);
                            Log::info("X601 Sync: Matched employee '{$employee->name}' by name, updated PIN to {$log['pin']}");
                        }
                    }

                    if (!$employee) {
                        // Auto-create employee if not found
                        $employeeName = $log['nama'] ?? "Employee {$log['pin']}";
                        $employee = Employee::create([
                            'pin'         => $log['pin'],
                            'employee_id' => $log['pin'],
                            'name'        => $employeeName,
                            'email'       => "employee{$log['pin']}@company.local",
                            'phone'       => '-',
                            'department'  => 'Belum Ditentukan',
                            'position'    => 'Belum Ditentukan',
                            'join_date'   => now()->format('Y-m-d'),
                            'status'      => 'active',
                            'user_id'     => null,
                            'salary'      => 0,
                        ]);
                        Log::info("X601 Sync: Auto-created employee - PIN: {$log['pin']}, Name: {$employeeName}");
                    }

                    // Check if attendance already exists
                    $existing = Attendance::where('employee_id', $employee->id)
                        ->whereDate('date', $log['tanggal'])
                        ->first();

                    if ($existing) {
                        // check_in: jangan timpa jika sudah ada
                        // check_out: selalu update dengan tap terakhir dari mesin
                        $newCheckIn  = $existing->check_in ?? ($log['checkin'] ?: null);
                        $newCheckOut = $log['checkout'] ?: $existing->check_out;
                        $existing->update([
                            'check_in'    => $newCheckIn,
                            'check_out'   => $newCheckOut,
                            'status'      => $this->determineStatus($log),
                            'work_hours'  => $this->calculateWorkHours($newCheckIn, $newCheckOut),
                            'machine_name' => $existing->machine_name ?? ($log['nama'] ?? null),
                        ]);
                        Log::info("X601 Sync: Updated for {$employee->name} on {$log['tanggal']}");
                    } else {
                        // Create new attendance record with all data
                        Attendance::create([
                            'employee_id' => $employee->id,
                            'date' => $log['tanggal'],
                            'check_in' => $log['checkin'] ?: null,
                            'check_out' => $log['checkout'] ?: null,
                            'status' => $this->determineStatus($log),
                            'work_hours' => $this->calculateWorkHours($log['checkin'], $log['checkout']),
                            'source' => 'x601',
                            'machine_name' => $log['nama'] ?? null,
                        ]);
                        Log::info("X601 Sync: Created attendance for {$employee->name} on {$log['tanggal']}");
                    }

                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = "Error processing employee {$log['pin']}: " . $e->getMessage();
                    Log::error("X601 Sync Error for PIN {$log['pin']}: " . $e->getMessage());
                }
            }

            Log::info("X601 Sync Complete: Synced {$synced}, Errors: " . count($errors));

            // Mark absent for weekdays in the date range that have no attendance
            if ($tglAwal && $tglAkhir) {
                $current   = new \DateTime($tglAwal);
                $end       = new \DateTime($tglAkhir);
                $today     = new \DateTime(date('Y-m-d'));
                // Don't mark absent beyond today
                if ($end > $today) $end = $today;

                while ($current <= $end) {
                    $dateStr     = $current->format('Y-m-d');
                    $absentResult = $this->markAbsentForDate($dateStr, true); // skipWeekends=true
                    $absentMarked += $absentResult['marked'];
                    if (!empty($absentResult['errors'])) {
                        $errors = array_merge($errors, $absentResult['errors']);
                    }
                    $current->modify('+1 day');
                }
            } elseif ($tglAwal) {
                // Only start date given
                $absentResult = $this->markAbsentForDate($tglAwal, true);
                $absentMarked = $absentResult['marked'];
                if (!empty($absentResult['errors'])) {
                    $errors = array_merge($errors, $absentResult['errors']);
                }
            }
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 Connection Error: " . $e->getMessage());
        }

        return [
            'synced' => $synced,
            'absent_marked' => $absentMarked,
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
        $uniqueDates = [];
        $totalAbsentMarked = 0;

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

                    // Fallback: match by name if not found by PIN
                    if (!$employee && !empty($log['nama']) && $log['nama'] !== 'Tidak Diketahui') {
                        $employee = Employee::where('name', $log['nama'])->first();
                        if ($employee) {
                            $employee->update(['pin' => $log['pin']]);
                            Log::info("X601 Comprehensive Sync: Matched employee '{$employee->name}' by name, updated PIN to {$log['pin']}");
                        }
                    }

                    if (!$employee) {
                        // Auto-create employee if not found
                        $employeeName = $log['nama'] ?? "Employee {$log['pin']}";
                        $employee = Employee::create([
                            'pin'         => $log['pin'],
                            'employee_id' => $log['pin'],
                            'name'        => $employeeName,
                            'email'       => "employee{$log['pin']}@company.local",
                            'phone'       => '-',
                            'department'  => 'Belum Ditentukan',
                            'position'    => 'Belum Ditentukan',
                            'join_date'   => now()->format('Y-m-d'),
                            'status'      => 'active',
                            'user_id'     => null,
                            'salary'      => 0,
                        ]);
                        Log::info("X601 Comprehensive Sync: Auto-created employee - PIN: {$log['pin']}, Name: {$employeeName}");
                    }

                    // Check if attendance already exists
                    $existing = Attendance::where('employee_id', $employee->id)
                        ->whereDate('date', $log['tanggal'])
                        ->first();

                    if ($existing) {
                        // check_in: jangan timpa jika sudah ada
                        // check_out: selalu update dengan tap terakhir dari mesin
                        $newCheckIn  = $existing->check_in ?? ($log['checkin'] ?: null);
                        $newCheckOut = $log['checkout'] ?: $existing->check_out;
                        $existing->update([
                            'check_in'    => $newCheckIn,
                            'check_out'   => $newCheckOut,
                            'status'      => $this->determineStatus($log),
                            'work_hours'  => $this->calculateWorkHours($newCheckIn, $newCheckOut),
                            'machine_name' => $existing->machine_name ?? ($log['nama'] ?? null),
                        ]);
                        Log::info("X601 Comprehensive Sync: Updated for {$employee->name} on {$log['tanggal']}");
                    } else {
                        // Create new attendance record with all data
                        Attendance::create([
                            'employee_id' => $employee->id,
                            'date' => $log['tanggal'],
                            'check_in' => $log['checkin'] ?: null,
                            'check_out' => $log['checkout'] ?: null,
                            'status' => $this->determineStatus($log),
                            'work_hours' => $this->calculateWorkHours($log['checkin'], $log['checkout']),
                            'source' => 'x601',
                            'machine_name' => $log['nama'] ?? null,
                        ]);
                        Log::info("X601 Comprehensive Sync: Created attendance for {$employee->name} on {$log['tanggal']}");
                    }

                    // Collect unique dates for marking absent later
                    if (!in_array($log['tanggal'], $uniqueDates)) {
                        $uniqueDates[] = $log['tanggal'];
                    }

                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = "Error processing employee {$log['pin']} on {$log['tanggal']}: " . $e->getMessage();
                    Log::error("X601 Comprehensive Sync Error for PIN {$log['pin']} on {$log['tanggal']}: " . $e->getMessage());
                }
            }

            Log::info("X601 Comprehensive Sync Complete: Synced {$synced}, Errors: " . count($errors));

            // Mark absent for all active employees who don't have attendance on each synced date
            Log::info("X601 Comprehensive Sync: Marking absent for " . count($uniqueDates) . " unique dates");
            foreach ($uniqueDates as $date) {
                $absentResult = $this->markAbsentForDate($date, true);
                $totalAbsentMarked += $absentResult['marked'];
                if (!empty($absentResult['errors'])) {
                    $errors = array_merge($errors, $absentResult['errors']);
                }
            }
            Log::info("X601 Comprehensive Sync: Total absent marked across all dates: {$totalAbsentMarked}");
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 Comprehensive Connection Error: " . $e->getMessage());
        }

        return [
            'synced' => $synced,
            'absent_marked' => $totalAbsentMarked,
            'dates_processed' => count($uniqueDates),
            'errors' => $errors,
            'total_processed' => $synced + count($errors),
            'message' => 'Comprehensive sync completed'
        ];
    }

    /**
     * Sync employee/user data from X601 machine to employees table.
     * Creates new employees if they don't exist, updates name if changed.
     */
    public function syncUsersFromX601(?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors  = [];

        $service = $this->createService($ip, $key, $port);

        try {
            Log::info("X601 User Sync: Fetching users from machine");

            $users = $service->getUsers();

            Log::info("X601 User Sync: Retrieved " . count($users) . " users");

            foreach ($users as $internalPin => $info) {
                // Support both old format (string) and new format (array with name+pin2)
                $name = is_array($info) ? $info['name'] : $info;
                $pin  = is_array($info) ? $info['pin2'] : $internalPin;

                try {
                    // Check if employee with this PIN already exists
                    $employee = Employee::where('pin', $pin)
                        ->orWhere('employee_id', $pin)
                        ->first();

                    // Fallback: match by name if not found by PIN
                    if (!$employee) {
                        $employee = Employee::where('name', $name)->first();
                        if ($employee) {
                            $employee->update(['pin' => $pin]);
                            Log::info("X601 User Sync: Matched employee '{$name}' by name, updated PIN to {$pin}");
                        }
                    }

                    if ($employee) {
                        // Update name if it has changed
                        if ($employee->name !== $name) {
                            $employee->update(['name' => $name]);
                            $updated++;
                            Log::info("X601 User Sync: Updated name for PIN {$pin}: {$name}");
                        } else {
                            $skipped++;
                        }
                    } else {
                        // Create new employee
                        Employee::create([
                            'pin'         => $pin,
                            'employee_id' => $pin,
                            'name'        => $name,
                            'email'       => "employee{$pin}@company.local",
                            'phone'       => '-',
                            'department'  => 'Belum Ditentukan',
                            'position'    => 'Belum Ditentukan',
                            'join_date'   => now()->format('Y-m-d'),
                            'status'      => 'active',
                            'user_id'     => null,
                            'salary'      => 0,
                        ]);
                        $created++;
                        Log::info("X601 User Sync: Created new employee - PIN: {$pin}, Name: {$name}");
                    }
                } catch (\Exception $e) {
                    $errors[] = "Error processing PIN {$pin} ({$name}): " . $e->getMessage();
                    Log::error("X601 User Sync Error for PIN {$pin}: " . $e->getMessage());
                }
            }

            Log::info("X601 User Sync Complete: Created={$created}, Updated={$updated}, Skipped={$skipped}, Errors=" . count($errors));
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 User Sync Connection Error: " . $e->getMessage());
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors'  => $errors,
            'total'   => count($users ?? []),
            'message' => 'User sync completed'
        ];
    }

    /**
     * Sync ONLY checkout data from X601 machine for a given date.
     * Only updates check_out on existing attendance records — never creates new records
     * and never overwrites check_in.
     */
    public function syncCheckoutOnly(string $date, ?string $ip = null, ?string $key = null, ?int $port = null): array
    {
        $updated = 0;
        $skipped = 0;
        $errors  = [];

        $service = $this->createService($ip, $key, $port);

        try {
            Log::info("X601 Checkout Sync: Fetching logs for date {$date}");

            $logs = $service->getLogs($date, $date);

            Log::info("X601 Checkout Sync: Retrieved " . count($logs) . " log entries for {$date}");

            foreach ($logs as $log) {
                try {
                    // Skip if no checkout data from machine
                    if (empty($log['checkout'])) {
                        $skipped++;
                        continue;
                    }

                    // Find employee
                    $employee = Employee::where('employee_id', $log['pin'])
                        ->orWhere('pin', $log['pin'])
                        ->first();

                    if (!$employee && !empty($log['nama']) && $log['nama'] !== 'Tidak Diketahui') {
                        $employee = Employee::where('name', $log['nama'])->first();
                    }

                    if (!$employee) {
                        $skipped++;
                        continue;
                    }

                    // Only update EXISTING records
                    $existing = Attendance::where('employee_id', $employee->id)
                        ->whereDate('date', $log['tanggal'])
                        ->first();

                    if (!$existing) {
                        $skipped++;
                        Log::info("X601 Checkout Sync: No existing record for {$employee->name} on {$log['tanggal']}, skip");
                        continue;
                    }

                    $checkIn  = $existing->check_in;
                    $checkOut = $log['checkout'];

                    $existing->update([
                        'check_out'  => $checkOut,
                        'work_hours' => $this->calculateWorkHours($checkIn, $checkOut),
                        'status'     => $checkIn ? $this->determineStatus($log) : $existing->status,
                    ]);

                    $updated++;
                    Log::info("X601 Checkout Sync: Updated check_out for {$employee->name} on {$log['tanggal']} → {$checkOut}");
                } catch (\Exception $e) {
                    $errors[] = "Error processing PIN {$log['pin']}: " . $e->getMessage();
                    Log::error("X601 Checkout Sync Error for PIN {$log['pin']}: " . $e->getMessage());
                }
            }

            Log::info("X601 Checkout Sync Complete: Updated={$updated}, Skipped={$skipped}, Errors=" . count($errors));
        } catch (\Exception $e) {
            $errors[] = "Failed to connect to X601 machine: " . $e->getMessage();
            Log::error("X601 Checkout Sync Connection Error: " . $e->getMessage());
        }

        return [
            'updated' => $updated,
            'skipped' => $skipped,
            'errors'  => $errors,
            'date'    => $date,
        ];
    }

    /**
     * Mark all active employees who have no attendance record on a given date as absent.
     * Skips weekends (Saturday=6, Sunday=0) by default.
     */
    public function markAbsentForDate(string $date, bool $skipWeekends = true): array
    {
        $marked  = 0;
        $skipped = 0;
        $errors  = [];

        $dayOfWeek = (int) date('w', strtotime($date));
        if ($skipWeekends && ($dayOfWeek === 0 || $dayOfWeek === 6)) {
            Log::info("Mark Absent: Skipping weekend date {$date}");
            return [
                'marked'   => 0,
                'skipped'  => 0,
                'errors'   => [],
                'message'  => "Skipped: {$date} is a weekend",
            ];
        }

        $employees = Employee::where('status', 'active')->get();

        Log::info("Mark Absent: Processing {$date} for " . $employees->count() . " active employees");

        foreach ($employees as $employee) {
            try {
                $exists = Attendance::where('employee_id', $employee->id)
                    ->whereDate('date', $date)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Attendance::create([
                    'employee_id' => $employee->id,
                    'date'        => $date,
                    'check_in'    => null,
                    'check_out'   => null,
                    'status'      => 'absent',
                    'work_hours'  => 0,
                    'source'      => 'system',
                ]);

                $marked++;
                Log::info("Mark Absent: Created absent record for {$employee->name} on {$date}");
            } catch (\Exception $e) {
                $errors[] = "Error for {$employee->name}: " . $e->getMessage();
                Log::error("Mark Absent Error for employee {$employee->id} on {$date}: " . $e->getMessage());
            }
        }

        Log::info("Mark Absent Complete for {$date}: Marked={$marked}, Skipped={$skipped}, Errors=" . count($errors));

        return [
            'marked'  => $marked,
            'skipped' => $skipped,
            'errors'  => $errors,
            'message' => "Absent marking completed for {$date}",
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
    private function calculateWorkHours(?string $checkIn, ?string $checkOut): float
    {
        if (!$checkIn || !$checkOut) {
            return 0;
        }

        try {
            $start = strtotime($checkIn);
            $end = strtotime($checkOut);

            if ($end <= $start) {
                return 0;
            }

            $hours = ($end - $start) / 3600;
            return round($hours, 2);
        } catch (\Exception $e) {
            return 0;
        }
    }
}

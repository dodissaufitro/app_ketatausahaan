<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class X601AttendanceService
{
    protected $apiBaseUrl;
    protected $apiKey;

    public function __construct()
    {
        $this->apiBaseUrl = config('services.x601.base_url', 'http://localhost:8080');
        $this->apiKey = config('services.x601.api_key', '');
    }

    /**
     * Fetch attendance data from x601 machine API
     *
     * @param string|null $date Filter by specific date (Y-m-d format)
     * @param string|null $employeeId Filter by employee ID
     * @return array
     */
    public function fetchFromMachine(string $date = null, string $employeeId = null): array
    {
        try {
            $params = [];

            if ($date) {
                $params['date'] = $date;
            }

            if ($employeeId) {
                $params['emp_id'] = $employeeId;
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->get($this->apiBaseUrl . '/api/attendance', $params);

            if ($response->failed()) {
                Log::error('X601 API Error', [
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);
                return [];
            }

            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('X601 Attendance Service Error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Sync attendance data from x601 machine to database
     *
     * @param string|null $date
     * @param string|null $employeeId
     * @return array
     */
    public function syncAttendance(string $date = null, string $employeeId = null): array
    {
        $machineData = $this->fetchFromMachine($date, $employeeId);

        if (empty($machineData)) {
            return ['synced' => 0, 'errors' => []];
        }

        $synced = 0;
        $errors = [];

        foreach ($machineData as $record) {
            try {
                $employee = Employee::where('employee_id', $record['emp_id'] ?? null)->first();

                if (!$employee) {
                    $errors[] = "Employee not found: {$record['emp_id']}";
                    continue;
                }

                $attendanceDate = Carbon::parse($record['date'] ?? now());

                $attendance = Attendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date' => $attendanceDate,
                    ],
                    [
                        'check_in' => $this->parseTime($record['check_in'] ?? null),
                        'check_out' => $this->parseTime($record['check_out'] ?? null),
                        'status' => $this->determineStatus(
                            $record['check_in'] ?? null,
                            $record['check_out'] ?? null
                        ),
                        'work_hours' => $this->calculateWorkHours(
                            $record['check_in'] ?? null,
                            $record['check_out'] ?? null
                        ),
                    ]
                );

                $synced++;
            } catch (\Exception $e) {
                Log::error('Error syncing attendance record', [
                    'record' => $record,
                    'error' => $e->getMessage(),
                ]);
                $errors[] = "Error processing employee {$record['emp_id']}: {$e->getMessage()}";
            }
        }

        return [
            'synced' => $synced,
            'errors' => $errors,
            'total' => count($machineData),
        ];
    }

    /**
     * Parse time string to time format
     *
     * @param string|null $timeString
     * @return string|null
     */
    protected function parseTime(?string $timeString): ?string
    {
        if (!$timeString) {
            return null;
        }

        try {
            return Carbon::createFromFormat('H:i:s', $timeString)->format('H:i');
        } catch (\Exception $e) {
            Log::warning('Could not parse time: ' . $timeString);
            return null;
        }
    }

    /**
     * Determine attendance status
     *
     * @param string|null $checkIn
     * @param string|null $checkOut
     * @return string
     */
    protected function determineStatus(?string $checkIn, ?string $checkOut): string
    {
        if (!$checkIn) {
            return 'absent';
        }

        // Check-in time threshold (07:00 for on-time, after 07:00 is late)
        $checkInTime = Carbon::createFromFormat('H:i:s', $checkIn);
        $officeStartTime = Carbon::parse('07:00:00');

        if ($checkInTime->greaterThan($officeStartTime)) {
            return 'late';
        }

        if (!$checkOut) {
            return 'half-day';
        }

        return 'present';
    }

    /**
     * Calculate work hours
     *
     * @param string|null $checkIn
     * @param string|null $checkOut
     * @return float|null
     */
    protected function calculateWorkHours(?string $checkIn, ?string $checkOut): ?float
    {
        if (!$checkIn || !$checkOut) {
            return null;
        }

        try {
            $checkInTime = Carbon::createFromFormat('H:i:s', $checkIn);
            $checkOutTime = Carbon::createFromFormat('H:i:s', $checkOut);

            $hours = $checkOutTime->diffInMinutes($checkInTime) / 60;

            return round($hours, 2);
        } catch (\Exception $e) {
            Log::warning('Could not calculate work hours', [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
            ]);
            return null;
        }
    }
}

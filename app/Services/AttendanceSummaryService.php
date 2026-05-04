<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class AttendanceSummaryService
{
    /**
     * Get monthly attendance summary for all employees
     */
    public function getMonthlySummary(int $year, int $month): array
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        // Get ALL active employees
        $allEmployees = Employee::where('status', 'active')->get();

        // Get all attendances for the month
        $attendances = Attendance::with('employee')
            ->whereBetween('date', [$startDate, $endDate])
            ->where('source', 'x601')
            ->get()
            ->groupBy('employee_id');

        $summary = [];
        $workingDays = $this->getWorkingDaysInMonth($year, $month);

        // Loop through ALL employees (not just those with attendance)
        foreach ($allEmployees as $employee) {
            $employeeAttendances = $attendances->get($employee->id, collect([]));

            $employeeSummary = $this->calculateEmployeeMonthlySummary(
                $employee,
                $employeeAttendances,
                $workingDays,
                $year,
                $month
            );

            $summary[] = $employeeSummary;
        }

        return [
            'year' => $year,
            'month' => $month,
            'month_name' => Carbon::create($year, $month, 1)->locale('id')->monthName,
            'working_days' => $workingDays,
            'employees' => $summary,
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Calculate monthly summary for a single employee
     */
    private function calculateEmployeeMonthlySummary(Employee $employee, Collection $attendances, int $workingDays, int $year, int $month): array
    {
        $stats = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'half-day' => 0,
            'total_work_hours' => 0,
            'average_work_hours' => 0,
        ];

        $dailyRecords = [];
        $totalWorkHours = 0;
        $presentDays = 0;

        // Initialize all working days as absent
        for ($day = 1; $day <= Carbon::create($year, $month, 1)->daysInMonth; $day++) {
            $date = Carbon::create($year, $month, $day);
            if ($this->isWorkingDay($date)) {
                $dailyRecords[$day] = [
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->locale('id')->dayName,
                    'status' => 'absent',
                    'check_in' => null,
                    'check_out' => null,
                    'work_hours' => 0,
                ];
            }
        }

        // Fill in actual attendance data
        foreach ($attendances as $attendance) {
            $day = $attendance->date->day;

            if (isset($dailyRecords[$day])) {
                $dailyRecords[$day] = [
                    'date' => $attendance->date->format('Y-m-d'),
                    'day' => $attendance->date->locale('id')->dayName,
                    'status' => $attendance->status,
                    'check_in' => $attendance->check_in,
                    'check_out' => $attendance->check_out,
                    'work_hours' => (float) $attendance->work_hours,
                ];

                // Update stats
                $stats[$attendance->status]++;
                if ($attendance->status !== 'absent') {
                    $totalWorkHours += (float) $attendance->work_hours;
                    $presentDays++;
                }
            }
        }

        // Count remaining absent days (days that were initialized as absent but not updated)
        foreach ($dailyRecords as $record) {
            if ($record['status'] === 'absent' && $record['check_in'] === null) {
                $stats['absent']++;
            }
        }

        // Calculate final stats
        $stats['total_work_hours'] = round($totalWorkHours, 2);
        $stats['average_work_hours'] = $presentDays > 0 ? round($totalWorkHours / $presentDays, 2) : 0;

        return [
            'id'           => $employee->id,
            'employee_id'  => $employee->employee_id,
            'employee_name' => $employee->name,
            'department' => $employee->department,
            'position' => $employee->position,
            'stats' => $stats,
            'daily_records' => array_values($dailyRecords),
            'total_days' => count($dailyRecords),
            'present_percentage' => count($dailyRecords) > 0 ?
                round((($stats['present'] + $stats['late'] + $stats['half-day']) / count($dailyRecords)) * 100, 1) : 0,
        ];
    }

    /**
     * Get number of working days in a month (excluding weekends)
     */
    private function getWorkingDaysInMonth(int $year, int $month): int
    {
        $workingDays = 0;
        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = Carbon::create($year, $month, $day);
            if ($this->isWorkingDay($date)) {
                $workingDays++;
            }
        }

        return $workingDays;
    }

    /**
     * Check if a date is a working day (Monday to Friday)
     */
    private function isWorkingDay(Carbon $date): bool
    {
        // 0 = Sunday, 6 = Saturday
        return !in_array($date->dayOfWeek, [0, 6]);
    }

    /**
     * Get attendance summary data for Excel export
     */
    public function getExportData(int $year, int $month): array
    {
        $summary = $this->getMonthlySummary($year, $month);

        $exportData = [
            'summary' => [
                'Periode' => $summary['month_name'] . ' ' . $summary['year'],
                'Hari Kerja' => $summary['working_days'],
                'Total Karyawan' => count($summary['employees']),
                'Dibuat pada' => $summary['generated_at'],
            ],
            'employees' => [],
        ];

        foreach ($summary['employees'] as $employee) {
            $exportData['employees'][] = [
                'ID Karyawan' => $employee['employee_id'],
                'Nama Karyawan' => $employee['machine_name'] ?? $employee['employee_name'],
                'Departemen' => $employee['department'] ?? '-',
                'Jabatan' => $employee['position'] ?? '-',
                'Hadir' => $employee['stats']['present'],
                'Terlambat' => $employee['stats']['late'],
                'Absen' => $employee['stats']['absent'],
                'Setengah Hari' => $employee['stats']['half-day'],
                'Total Jam Kerja' => $employee['stats']['total_work_hours'],
                'Rata-rata Jam Kerja' => $employee['stats']['average_work_hours'],
                'Persentase Kehadiran' => $employee['present_percentage'] . '%',
            ];
        }

        return $exportData;
    }
}

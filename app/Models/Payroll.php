<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Payroll extends Model
{
    protected $fillable = [
        'employee_id',
        'month',
        'base_salary',
        'allowances',
        'deductions',
        'late_deductions',
        'late_count',
        'late_hours',
        'absent_count',
        'absent_deductions',
        'net_salary',
        'status',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'allowances' => 'decimal:2',
        'deductions' => 'decimal:2',
        'late_deductions' => 'decimal:2',
        'late_hours' => 'decimal:2',
        'absent_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'late_count' => 'integer',
        'absent_count' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Calculate late deductions based on attendance
     * Deduction: Rp 50,000 per hour of lateness
     * Standard work start time: 08:00
     */
    public static function calculateLateDeductions(int $employeeId, string $month): array
    {
        $startDate = Carbon::parse($month . '-01')->startOfMonth();
        $endDate = Carbon::parse($month . '-01')->endOfMonth();

        // Standard work start time (08:00)
        $standardStartTime = Carbon::createFromTime(8, 0, 0);

        // Get all late attendances for the month
        $lateAttendances = Attendance::where('employee_id', $employeeId)
            ->where('status', 'late')
            ->whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('check_in')
            ->get();

        $totalLateHours = 0;
        $lateCount = $lateAttendances->count();

        foreach ($lateAttendances as $attendance) {
            if ($attendance->check_in) {
                // Parse check_in time (only time part, not date)
                $checkInTime = Carbon::parse($attendance->check_in);

                // Create standard start time for the same date
                $standardTime = Carbon::parse($attendance->date)->setTime(8, 0, 0);

                // Only calculate if check-in is after standard time
                if ($checkInTime->greaterThan($standardTime)) {
                    // Calculate how many minutes late
                    $lateMinutes = $standardTime->diffInMinutes($checkInTime);

                    // Convert to hours (round up to nearest hour)
                    $lateHours = ceil($lateMinutes / 60);

                    $totalLateHours += $lateHours;
                }
            }
        }

        // Rp 50,000 per hour of lateness
        $lateDeductions = $totalLateHours * 50000;

        return [
            'late_count' => $lateCount,
            'late_hours' => $totalLateHours,
            'late_deductions' => $lateDeductions,
        ];
    }

    /**
     * Calculate absent deductions based on attendance
     * Deduction: Daily salary per absent day
     * Formula: (base_salary / 22 working days) per absent
     */
    public static function calculateAbsentDeductions(int $employeeId, string $month, float $baseSalary): array
    {
        $startDate = Carbon::parse($month . '-01')->startOfMonth();
        $endDate = Carbon::parse($month . '-01')->endOfMonth();

        // Get all absent days for the month
        $absentDays = Attendance::where('employee_id', $employeeId)
            ->where('status', 'absent')
            ->whereBetween('date', [$startDate, $endDate])
            ->count();

        // Calculate daily salary (assuming 22 working days per month)
        $dailySalary = $baseSalary / 22;

        // Calculate absent deductions
        $absentDeductions = $absentDays * $dailySalary;

        return [
            'absent_count' => $absentDays,
            'absent_deductions' => round($absentDeductions, 2),
        ];
    }

    /**
     * Calculate net salary
     */
    public function calculateNetSalary(): void
    {
        $this->net_salary = $this->base_salary + $this->allowances - $this->deductions - $this->late_deductions - $this->absent_deductions;
        $this->save();
    }

    /**
     * Process payroll with attendance-based deductions
     */
    public static function processPayroll(int $employeeId, string $month): ?self
    {
        $employee = Employee::find($employeeId);
        if (!$employee) {
            return null;
        }

        // Calculate late deductions
        $lateData = self::calculateLateDeductions($employeeId, $month);

        // Calculate absent deductions
        $absentData = self::calculateAbsentDeductions($employeeId, $month, $employee->salary);

        // Check if payroll already exists
        $payroll = self::where('employee_id', $employeeId)
            ->where('month', $month)
            ->first();

        if ($payroll) {
            // Update existing payroll
            $payroll->update([
                'base_salary' => $employee->salary,
                'late_count' => $lateData['late_count'],
                'late_hours' => $lateData['late_hours'],
                'late_deductions' => $lateData['late_deductions'],
                'absent_count' => $absentData['absent_count'],
                'absent_deductions' => $absentData['absent_deductions'],
            ]);
        } else {
            // Create new payroll
            $payroll = self::create([
                'employee_id' => $employeeId,
                'month' => $month,
                'base_salary' => $employee->salary,
                'allowances' => 0,
                'deductions' => 0,
                'late_count' => $lateData['late_count'],
                'late_hours' => $lateData['late_hours'],
                'late_deductions' => $lateData['late_deductions'],
                'absent_count' => $absentData['absent_count'],
                'absent_deductions' => $absentData['absent_deductions'],
                'net_salary' => 0,
                'status' => 'pending',
            ]);
        }

        // Calculate net salary
        $payroll->calculateNetSalary();

        return $payroll;
    }
}

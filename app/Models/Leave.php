<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Leave extends Model
{
    protected $fillable = [
        'employee_id',
        'type',
        'start_date',
        'end_date',
        'reason',
        'status',
        'applied_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'applied_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Create attendance records when leave is approved
     */
    public function createAttendanceRecords(): void
    {
        if ($this->status !== 'approved') {
            return;
        }

        $startDate = Carbon::parse($this->start_date);
        $endDate = Carbon::parse($this->end_date);

        // Map leave type to attendance status
        $attendanceStatus = match ($this->type) {
            'annual' => 'on-leave',
            'sick' => 'sick-leave',
            'personal' => 'personal-leave',
            'maternity' => 'maternity-leave',
            'paternity' => 'paternity-leave',
            default => 'on-leave',
        };

        // Loop through each day in the leave period
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Skip weekends (optional - adjust based on business rules)
            if ($date->isWeekend()) {
                continue;
            }

            // Check if attendance record already exists
            $existingAttendance = Attendance::where('employee_id', $this->employee_id)
                ->whereDate('date', $date)
                ->first();

            if ($existingAttendance) {
                // Update existing attendance to leave status
                $existingAttendance->update([
                    'status' => $attendanceStatus,
                    'source' => 'leave',
                    'check_in' => null,
                    'check_out' => null,
                    'work_hours' => 0,
                ]);
            } else {
                // Create new attendance record with leave status
                Attendance::create([
                    'employee_id' => $this->employee_id,
                    'date' => $date->format('Y-m-d'),
                    'check_in' => null,
                    'check_out' => null,
                    'status' => $attendanceStatus,
                    'work_hours' => 0,
                    'source' => 'leave',
                ]);
            }
        }
    }

    /**
     * Delete attendance records when leave is rejected
     */
    public function deleteAttendanceRecords(): void
    {
        $startDate = Carbon::parse($this->start_date);
        $endDate = Carbon::parse($this->end_date);

        // Delete attendance records created for this leave period (with source 'leave')
        Attendance::where('employee_id', $this->employee_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('source', 'leave')
            ->delete();
    }
}

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

            if (!$existingAttendance) {
                // Create new attendance record with status 'absent' for leave
                Attendance::create([
                    'employee_id' => $this->employee_id,
                    'date' => $date->format('Y-m-d'),
                    'check_in' => null,
                    'check_out' => null,
                    'status' => 'absent', // Using 'absent' status to indicate on leave
                    'work_hours' => 0,
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

        // Delete attendance records created for this leave period
        Attendance::where('employee_id', $this->employee_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', 'absent')
            ->whereNull('check_in')
            ->whereNull('check_out')
            ->delete();
    }
}

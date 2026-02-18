<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = Employee::all();

        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Please run EmployeeSeeder first.');
            return;
        }

        // Generate attendance for last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);

            foreach ($employees as $employee) {
                // Random attendance pattern
                $rand = rand(1, 10);

                if ($rand <= 7) {
                    // 70% present or late
                    $checkIn = Carbon::parse($date->format('Y-m-d') . ' ' . '08:' . rand(0, 30) . ':00');
                    $status = $checkIn->format('H:i') > '08:15' ? 'late' : 'present';
                    $checkOut = (clone $checkIn)->addHours(8)->addMinutes(rand(0, 60));
                    $workHours = $checkOut->diffInHours($checkIn, true);

                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'check_in' => $checkIn->format('H:i'),
                        'check_out' => $checkOut->format('H:i'),
                        'status' => $status,
                        'work_hours' => round($workHours, 2),
                    ]);
                } elseif ($rand == 8) {
                    // 10% half-day
                    $checkIn = Carbon::parse($date->format('Y-m-d') . ' 08:00:00');
                    $checkOut = (clone $checkIn)->addHours(4);

                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'check_in' => $checkIn->format('H:i'),
                        'check_out' => $checkOut->format('H:i'),
                        'status' => 'half-day',
                        'work_hours' => 4,
                    ]);
                } else {
                    // 20% absent
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'check_in' => null,
                        'check_out' => null,
                        'status' => 'absent',
                        'work_hours' => 0,
                    ]);
                }
            }
        }
    }
}

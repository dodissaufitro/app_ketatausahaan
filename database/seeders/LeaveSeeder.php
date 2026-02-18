<?php

namespace Database\Seeders;

use App\Models\Leave;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class LeaveSeeder extends Seeder
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

        $leaveTypes = ['annual', 'sick', 'personal', 'maternity', 'paternity'];
        $statuses = ['pending', 'approved', 'rejected'];

        // Create 15 leave requests with different scenarios
        $leaveRequests = [
            [
                'employee' => $employees->random(),
                'type' => 'annual',
                'start_date' => Carbon::now()->addDays(5),
                'end_date' => Carbon::now()->addDays(7),
                'reason' => 'Liburan keluarga ke Bali',
                'status' => 'pending',
                'applied_date' => Carbon::now()->subDays(2),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'sick',
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now(),
                'reason' => 'Sakit demam dan flu',
                'status' => 'approved',
                'applied_date' => Carbon::now()->subDays(3),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'personal',
                'start_date' => Carbon::now()->addDays(10),
                'end_date' => Carbon::now()->addDays(12),
                'reason' => 'Urusan keluarga mendesak',
                'status' => 'pending',
                'applied_date' => Carbon::now()->subDays(1),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'annual',
                'start_date' => Carbon::now()->addDays(15),
                'end_date' => Carbon::now()->addDays(20),
                'reason' => 'Cuti tahunan',
                'status' => 'approved',
                'applied_date' => Carbon::now()->subDays(5),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'sick',
                'start_date' => Carbon::now()->addDays(3),
                'end_date' => Carbon::now()->addDays(4),
                'reason' => 'Kontrol kesehatan rutin',
                'status' => 'rejected',
                'applied_date' => Carbon::now()->subDays(1),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'annual',
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->subDays(4),
                'reason' => 'Liburan dengan keluarga',
                'status' => 'approved',
                'applied_date' => Carbon::now()->subDays(10),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'personal',
                'start_date' => Carbon::now()->addDays(7),
                'end_date' => Carbon::now()->addDays(8),
                'reason' => 'Menghadiri acara keluarga',
                'status' => 'pending',
                'applied_date' => Carbon::now(),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'sick',
                'start_date' => Carbon::now()->subDays(1),
                'end_date' => Carbon::now()->subDays(1),
                'reason' => 'Sakit kepala migrain',
                'status' => 'approved',
                'applied_date' => Carbon::now()->subDays(2),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'annual',
                'start_date' => Carbon::now()->addDays(20),
                'end_date' => Carbon::now()->addDays(25),
                'reason' => 'Berlibur ke luar negeri',
                'status' => 'pending',
                'applied_date' => Carbon::now()->subDays(3),
            ],
            [
                'employee' => $employees->random(),
                'type' => 'personal',
                'start_date' => Carbon::now()->addDays(2),
                'end_date' => Carbon::now()->addDays(3),
                'reason' => 'Keperluan pribadi',
                'status' => 'rejected',
                'applied_date' => Carbon::now()->subDays(1),
            ],
        ];

        foreach ($leaveRequests as $leaveData) {
            $leave = Leave::create([
                'employee_id' => $leaveData['employee']->id,
                'type' => $leaveData['type'],
                'start_date' => $leaveData['start_date']->format('Y-m-d'),
                'end_date' => $leaveData['end_date']->format('Y-m-d'),
                'reason' => $leaveData['reason'],
                'status' => $leaveData['status'],
                'applied_date' => $leaveData['applied_date']->format('Y-m-d'),
            ]);

            // Create attendance records for approved leaves
            if ($leave->status === 'approved') {
                $leave->createAttendanceRecords();
            }
        }
    }
}

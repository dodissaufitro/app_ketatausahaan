<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Leave;
use App\Models\Payroll;
use Illuminate\Database\Seeder;

class TestUserDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get employee for user@example.com
        $employee = Employee::where('email', 'user@example.com')->first();

        if (!$employee) {
            $this->command->error('Employee with email user@example.com not found!');
            return;
        }

        // Create leave requests
        Leave::create([
            'employee_id' => $employee->id,
            'type' => 'annual',
            'start_date' => '2025-12-20',
            'end_date' => '2025-12-25',
            'reason' => 'Liburan akhir tahun bersama keluarga',
            'status' => 'pending',
            'applied_date' => now(),
        ]);

        Leave::create([
            'employee_id' => $employee->id,
            'type' => 'sick',
            'start_date' => '2025-11-15',
            'end_date' => '2025-11-16',
            'reason' => 'Sakit flu',
            'status' => 'approved',
            'applied_date' => now()->subDays(20),
        ]);

        // Create payroll records
        Payroll::create([
            'employee_id' => $employee->id,
            'month' => '2025-12',
            'base_salary' => 5000000,
            'allowances' => 500000,
            'deductions' => 100000,
            'late_deductions' => 0,
            'late_count' => 0,
            'net_salary' => 5400000,
            'status' => 'processed',
        ]);

        Payroll::create([
            'employee_id' => $employee->id,
            'month' => '2025-11',
            'base_salary' => 5000000,
            'allowances' => 500000,
            'deductions' => 100000,
            'late_deductions' => 50000,
            'late_count' => 1,
            'net_salary' => 5350000,
            'status' => 'paid',
        ]);

        $this->command->info('Test data created for user@example.com!');
    }
}

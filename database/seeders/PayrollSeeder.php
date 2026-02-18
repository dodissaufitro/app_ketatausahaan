<?php

namespace Database\Seeders;

use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PayrollSeeder extends Seeder
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

        // Generate payroll for current month and last 2 months
        $months = [
            Carbon::now()->subMonths(2)->format('Y-m'),
            Carbon::now()->subMonths(1)->format('Y-m'),
            Carbon::now()->format('Y-m'),
        ];

        foreach ($months as $month) {
            foreach ($employees as $employee) {
                // Process payroll (will auto-calculate late deductions)
                $payroll = Payroll::processPayroll($employee->id, $month);

                if ($payroll) {
                    // Set random status based on month
                    $monthDate = Carbon::parse($month . '-01');
                    if ($monthDate->lt(Carbon::now()->startOfMonth())) {
                        // Past months should be paid
                        $payroll->update(['status' => 'paid']);
                    } elseif ($monthDate->format('Y-m') === Carbon::now()->format('Y-m')) {
                        // Current month: mix of pending and processed
                        $statuses = ['pending', 'processed', 'processed'];
                        $payroll->update(['status' => $statuses[array_rand($statuses)]]);
                    }

                    // Add random allowances for some employees
                    if (rand(1, 3) === 1) {
                        $allowances = rand(50000, 200000);
                        $payroll->update([
                            'allowances' => $allowances,
                        ]);
                        $payroll->calculateNetSalary();
                    }

                    // Add random deductions for some employees
                    if (rand(1, 4) === 1) {
                        $deductions = rand(25000, 100000);
                        $payroll->update([
                            'deductions' => $deductions,
                        ]);
                        $payroll->calculateNetSalary();
                    }
                }
            }
        }

        $this->command->info('Payroll data seeded successfully with late deductions calculated.');
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Payroll;
use App\Models\Employee;
use Carbon\Carbon;

class GenerateMonthlyPayroll extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payroll:generate 
                            {month? : The month to generate payroll for (Y-m format)}
                            {--employee-id= : Generate for specific employee ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly payroll for all employees based on their salary';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $month = $this->argument('month') ?? Carbon::now()->format('Y-m');
        $specificEmployeeId = $this->option('employee-id');

        $this->info("Generating payroll for month: {$month}");

        if ($specificEmployeeId) {
            $employee = Employee::find($specificEmployeeId);
            if (!$employee) {
                $this->error("Employee with ID {$specificEmployeeId} not found");
                return 1;
            }
            $employees = collect([$employee]);
        } else {
            $employees = Employee::where('status', 'active')->get();
        }

        if ($employees->isEmpty()) {
            $this->warn('No active employees found');
            return 0;
        }

        $this->info("Processing {$employees->count()} employee(s)...");

        $bar = $this->output->createProgressBar($employees->count());
        $bar->start();

        $created = 0;
        $updated = 0;
        $errors = 0;

        foreach ($employees as $employee) {
            try {
                // Check if payroll already exists
                $existing = Payroll::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->first();

                if ($existing) {
                    $this->newLine();
                    $this->warn("Payroll already exists for {$employee->name} ({$employee->employee_id}) for {$month}");
                    $updated++;
                } else {
                    // Process payroll (calculates late deductions automatically)
                    $payroll = Payroll::processPayroll($employee->id, $month);

                    if ($payroll) {
                        $this->newLine();
                        $this->info("Created payroll for {$employee->name} ({$employee->employee_id})");
                        $this->line("  Base Salary: Rp " . number_format($payroll->base_salary, 0, ',', '.'));
                        $this->line("  Late: {$payroll->late_count} times ({$payroll->late_hours} hours) - Rp " . number_format($payroll->late_deductions, 0, ',', '.'));
                        $this->line("  Absent: {$payroll->absent_count} days - Rp " . number_format($payroll->absent_deductions, 0, ',', '.'));
                        $this->line("  Net Salary: Rp " . number_format($payroll->net_salary, 0, ',', '.'));
                        $created++;
                    }
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("Error processing {$employee->name}: {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Payroll generation completed!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Created', $created],
                ['Already Exists', $updated],
                ['Errors', $errors],
                ['Total', $employees->count()],
            ]
        );

        return 0;
    }
}

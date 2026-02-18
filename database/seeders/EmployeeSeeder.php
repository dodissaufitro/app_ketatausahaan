<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = [
            [
                'employee_id' => 'EMP001',
                'name' => 'John Doe',
                'email' => 'john.doe@company.com',
                'phone' => '+62 812-3456-7890',
                'department' => 'IT',
                'position' => 'Senior Developer',
                'join_date' => '2020-01-15',
                'status' => 'active',
                'salary' => 15000000.00,
            ],
            [
                'employee_id' => 'EMP002',
                'name' => 'Jane Smith',
                'email' => 'jane.smith@company.com',
                'phone' => '+62 813-4567-8901',
                'department' => 'HR',
                'position' => 'HR Manager',
                'join_date' => '2019-03-20',
                'status' => 'active',
                'salary' => 12000000.00,
            ],
            [
                'employee_id' => 'EMP003',
                'name' => 'Bob Johnson',
                'email' => 'bob.johnson@company.com',
                'phone' => '+62 814-5678-9012',
                'department' => 'Finance',
                'position' => 'Finance Director',
                'join_date' => '2018-06-10',
                'status' => 'active',
                'salary' => 18000000.00,
            ],
            [
                'employee_id' => 'EMP004',
                'name' => 'Alice Brown',
                'email' => 'alice.brown@company.com',
                'phone' => '+62 815-6789-0123',
                'department' => 'Marketing',
                'position' => 'Marketing Specialist',
                'join_date' => '2021-02-14',
                'status' => 'active',
                'salary' => 10000000.00,
            ],
            [
                'employee_id' => 'EMP005',
                'name' => 'Charlie Wilson',
                'email' => 'charlie.wilson@company.com',
                'phone' => '+62 816-7890-1234',
                'department' => 'IT',
                'position' => 'DevOps Engineer',
                'join_date' => '2020-08-25',
                'status' => 'active',
                'salary' => 13000000.00,
            ],
            [
                'employee_id' => 'EMP006',
                'name' => 'Diana Martinez',
                'email' => 'diana.martinez@company.com',
                'phone' => '+62 817-8901-2345',
                'department' => 'Operations',
                'position' => 'Operations Manager',
                'join_date' => '2019-11-30',
                'status' => 'active',
                'salary' => 14000000.00,
            ],
            [
                'employee_id' => 'EMP007',
                'name' => 'Edward Davis',
                'email' => 'edward.davis@company.com',
                'phone' => '+62 818-9012-3456',
                'department' => 'Sales',
                'position' => 'Sales Executive',
                'join_date' => '2021-05-12',
                'status' => 'active',
                'salary' => 9000000.00,
            ],
            [
                'employee_id' => 'EMP008',
                'name' => 'Fiona Taylor',
                'email' => 'fiona.taylor@company.com',
                'phone' => '+62 819-0123-4567',
                'department' => 'HR',
                'position' => 'HR Assistant',
                'join_date' => '2022-01-18',
                'status' => 'active',
                'salary' => 7000000.00,
            ],
            [
                'employee_id' => 'EMP009',
                'name' => 'George Anderson',
                'email' => 'george.anderson@company.com',
                'phone' => '+62 820-1234-5678',
                'department' => 'IT',
                'position' => 'UI/UX Designer',
                'join_date' => '2021-09-05',
                'status' => 'on-leave',
                'salary' => 11000000.00,
            ],
            [
                'employee_id' => 'EMP010',
                'name' => 'Hannah White',
                'email' => 'hannah.white@company.com',
                'phone' => '+62 821-2345-6789',
                'department' => 'Finance',
                'position' => 'Accountant',
                'join_date' => '2020-04-22',
                'status' => 'active',
                'salary' => 8500000.00,
            ],
        ];

        foreach ($employees as $employee) {
            Employee::create($employee);
        }
    }
}

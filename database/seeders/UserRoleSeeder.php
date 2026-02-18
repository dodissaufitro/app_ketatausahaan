<?php

namespace Database\Seeders;

use App\Models\UserRole;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'superadmin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with ability to manage users and roles',
                'permissions' => [
                    'manage_users',
                    'manage_roles',
                    'manage_employees',
                    'manage_agendas',
                    'manage_attendances',
                    'manage_leaves',
                    'manage_payrolls',
                    'manage_incoming_mails',
                    'manage_outgoing_mails',
                    'view_dashboard',
                    'view_reports',
                    'export_data',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Manage employees, attendance, leaves, and payrolls',
                'permissions' => [
                    'manage_employees',
                    'manage_agendas',
                    'manage_attendances',
                    'manage_leaves',
                    'manage_payrolls',
                    'manage_incoming_mails',
                    'manage_outgoing_mails',
                    'view_dashboard',
                    'view_reports',
                    'export_data',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Basic user with view-only access',
                'permissions' => [
                    'view_dashboard',
                    'view_own_attendance',
                    'view_own_leave',
                    'view_own_payroll',
                    'submit_leave_request',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            UserRole::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }

        $this->command->info('User roles seeded successfully!');
    }
}

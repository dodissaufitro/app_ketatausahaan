<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRole = UserRole::where('name', 'superadmin')->first();
        $adminRole = UserRole::where('name', 'admin')->first();
        $userRole = UserRole::where('name', 'user')->first();

        // Create Superadmin
        User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'user_role_id' => $superAdminRole?->id,
                'is_active' => true,
            ]
        );

        // Create Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'user_role_id' => $adminRole?->id,
                'is_active' => true,
            ]
        );

        // Create Regular User
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('password'),
                'role' => 'user',
                'user_role_id' => $userRole?->id,
                'is_active' => true,
            ]
        );

        $this->command->info('Users seeded successfully!');
        $this->command->info('Superadmin: admin@admin.com / password');
        $this->command->info('Admin: admin@example.com / password');
        $this->command->info('User: user@example.com / password');
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Seed Agendas
        $this->call([
            AgendaSeeder::class,
            AttendanceSeeder::class,
            EmployeeSeeder::class,
            LeaveSeeder::class,
            UserRoleSeeder::class,
            SuperAdminSeeder::class,
            LeaveAttendanceExampleSeeder::class,
            TestUserDataSeeder::class,
            PayrollSeeder::class,
            OutGoingMailSeeder::class,
        ]);
    }
}

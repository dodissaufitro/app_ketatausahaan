<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Attendance;
use Carbon\Carbon;

/**
 * CONTOH SEEDER DEMONSTRASI INTEGRASI LEAVE DENGAN ATTENDANCE
 * 
 * Seeder ini mendemonstrasikan bagaimana sistem leave terintegrasi dengan attendance:
 * - Ketika karyawan mengajukan cuti dan disetujui, status attendance otomatis berubah
 * - Status attendance mengikuti jenis leave (cuti tahunan, sakit, izin pribadi, dll)
 * - Source attendance berubah menjadi 'leave' untuk membedakan dengan absent biasa
 * 
 * Cara menjalankan:
 * php artisan db:seed --class=LeaveAttendanceExampleSeeder
 * 
 * CATATAN: Pastikan sudah ada data karyawan di database
 */
class LeaveAttendanceExampleSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil 5 karyawan pertama untuk contoh
        $employees = Employee::where('status', 'active')->take(5)->get();

        if ($employees->count() < 5) {
            $this->command->error('Tidak cukup karyawan aktif. Minimal 5 karyawan diperlukan untuk demo.');
            return;
        }

        $today = Carbon::today();

        // ========== CONTOH 1: CUTI TAHUNAN (Annual Leave) ==========
        $employee1 = $employees[0];
        $this->command->info("\n--- CONTOH 1: CUTI TAHUNAN ---");
        $this->command->info("Karyawan: {$employee1->full_name} ({$employee1->employee_id})");

        $leave1 = Leave::create([
            'employee_id' => $employee1->id,
            'type' => 'annual',
            'start_date' => $today->copy()->addDays(1)->toDateString(),
            'end_date' => $today->copy()->addDays(3)->toDateString(),
            'reason' => 'Liburan keluarga ke Bali',
            'status' => 'approved',
            'applied_date' => Carbon::now(),
        ]);

        // Buat attendance records untuk leave
        $leave1->createAttendanceRecords();

        $this->command->info("✓ Cuti tahunan dibuat: {$leave1->start_date} s/d {$leave1->end_date}");
        $this->command->info("✓ Status attendance: on-leave");
        $this->command->info("✓ Source: leave");

        // ========== CONTOH 2: SAKIT (Sick Leave) ==========
        $employee2 = $employees[1];
        $this->command->info("\n--- CONTOH 2: IZIN SAKIT ---");
        $this->command->info("Karyawan: {$employee2->full_name} ({$employee2->employee_id})");

        $leave2 = Leave::create([
            'employee_id' => $employee2->id,
            'type' => 'sick',
            'start_date' => $today->toDateString(),
            'end_date' => $today->copy()->addDays(2)->toDateString(),
            'reason' => 'Demam tinggi, perlu istirahat',
            'status' => 'approved',
            'applied_date' => Carbon::now(),
        ]);

        $leave2->createAttendanceRecords();

        $this->command->info("✓ Izin sakit dibuat: {$leave2->start_date} s/d {$leave2->end_date}");
        $this->command->info("✓ Status attendance: sick-leave");
        $this->command->info("✓ Source: leave");

        // ========== CONTOH 3: IZIN PRIBADI (Personal Leave) ==========
        $employee3 = $employees[2];
        $this->command->info("\n--- CONTOH 3: IZIN PRIBADI ---");
        $this->command->info("Karyawan: {$employee3->full_name} ({$employee3->employee_id})");

        $leave3 = Leave::create([
            'employee_id' => $employee3->id,
            'type' => 'personal',
            'start_date' => $today->copy()->addDays(5)->toDateString(),
            'end_date' => $today->copy()->addDays(5)->toDateString(),
            'reason' => 'Keperluan keluarga mendesak',
            'status' => 'approved',
            'applied_date' => Carbon::now(),
        ]);

        $leave3->createAttendanceRecords();

        $this->command->info("✓ Izin pribadi dibuat: {$leave3->start_date}");
        $this->command->info("✓ Status attendance: personal-leave");
        $this->command->info("✓ Source: leave");

        // ========== CONTOH 4: CUTI MELAHIRKAN (Maternity Leave) ==========
        $employee4 = $employees[3];
        $this->command->info("\n--- CONTOH 4: CUTI MELAHIRKAN ---");
        $this->command->info("Karyawan: {$employee4->full_name} ({$employee4->employee_id})");

        $leave4 = Leave::create([
            'employee_id' => $employee4->id,
            'type' => 'maternity',
            'start_date' => $today->copy()->addDays(7)->toDateString(),
            'end_date' => $today->copy()->addDays(97)->toDateString(), // 90 hari
            'reason' => 'Cuti melahirkan anak pertama',
            'status' => 'approved',
            'applied_date' => Carbon::now(),
        ]);

        $leave4->createAttendanceRecords();

        $this->command->info("✓ Cuti melahirkan dibuat: {$leave4->start_date} s/d {$leave4->end_date}");
        $this->command->info("✓ Status attendance: maternity-leave");
        $this->command->info("✓ Source: leave");
        $this->command->info("✓ Durasi: 90 hari");

        // ========== CONTOH 5: CUTI AYAH (Paternity Leave) ==========
        $employee5 = $employees[4];
        $this->command->info("\n--- CONTOH 5: CUTI AYAH ---");
        $this->command->info("Karyawan: {$employee5->full_name} ({$employee5->employee_id})");

        $leave5 = Leave::create([
            'employee_id' => $employee5->id,
            'type' => 'paternity',
            'start_date' => $today->copy()->addDays(10)->toDateString(),
            'end_date' => $today->copy()->addDays(12)->toDateString(), // 3 hari
            'reason' => 'Menemani istri melahirkan',
            'status' => 'approved',
            'applied_date' => Carbon::now(),
        ]);

        $leave5->createAttendanceRecords();

        $this->command->info("✓ Cuti ayah dibuat: {$leave5->start_date} s/d {$leave5->end_date}");
        $this->command->info("✓ Status attendance: paternity-leave");
        $this->command->info("✓ Source: leave");

        // ========== DEMONSTRASI PROSES SINKRONISASI ==========
        $this->command->info("\n=== DEMONSTRASI PROSES SINKRONISASI X601 ===");
        $this->command->info("Ketika sinkronisasi X601 dilakukan:");
        $this->command->info("1. Jika karyawan memiliki leave yang approved pada tanggal tersebut:");
        $this->command->info("   → Status attendance tetap mengikuti jenis leave");
        $this->command->info("   → Source tetap 'leave', tidak berubah ke 'x601'");
        $this->command->info("   → Data check_in/check_out TIDAK akan di-update");
        $this->command->info("");
        $this->command->info("2. Jika karyawan TIDAK memiliki leave:");
        $this->command->info("   → Data check_in/check_out akan di-update dari X601");
        $this->command->info("   → Status dihitung berdasarkan jam masuk/pulang");
        $this->command->info("   → Source berubah menjadi 'x601'");

        // ========== CARA PENGGUNAAN ==========
        $this->command->info("\n=== CARA MENGGUNAKAN DI APLIKASI ===");
        $this->command->info("1. Buka menu Attendance/Kehadiran");
        $this->command->info("2. Pilih tanggal sesuai contoh di atas");
        $this->command->info("3. Lihat karyawan dengan status cuti/izin/sakit");
        $this->command->info("4. Badge status akan menampilkan:");
        $this->command->info("   - Hijau dengan ikon kalender: Cuti Tahunan");
        $this->command->info("   - Orange dengan ikon stethoscope: Sakit");
        $this->command->info("   - Ungu dengan ikon user: Izin Pribadi");
        $this->command->info("   - Pink dengan ikon baby: Cuti Melahirkan");
        $this->command->info("   - Indigo dengan ikon heart: Cuti Ayah");
        $this->command->info("");
        $this->command->info("5. Badge source akan menampilkan 'Cuti/Izin' dengan warna hijau");

        // ========== DATA SUMMARY ==========
        $totalLeaves = Leave::where('status', 'approved')->count();
        $totalAttendances = Attendance::where('source', 'leave')->count();

        $this->command->info("\n=== RINGKASAN DATA ===");
        $this->command->info("Total leave yang dibuat: 5");
        $this->command->info("Total leave approved di database: {$totalLeaves}");
        $this->command->info("Total attendance dengan source 'leave': {$totalAttendances}");

        $this->command->info("\n✓ Seeder berhasil dijalankan!");
        $this->command->info("✓ Silakan cek database dan aplikasi untuk melihat hasilnya.");
    }
}

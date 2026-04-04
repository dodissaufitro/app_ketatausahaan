<?php

// Script untuk membuat cuti Dodis hari ini (2 April 2026)
// Jalankan: php create_dodis_leave.php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Employee;
use App\Models\Leave;
use Carbon\Carbon;

try {
    // Cari employee dengan nama dodis (case-insensitive)
    $employee = Employee::whereRaw('LOWER(name) LIKE ?', ['%dodis%'])
        ->orWhereRaw('LOWER(employee_id) LIKE ?', ['%dodis%'])
        ->first();

    if (!$employee) {
        echo "❌ Employee 'dodis' tidak ditemukan!\n";
        echo "Mencoba mencari semua karyawan...\n";

        $allEmployees = Employee::where('status', 'active')->limit(5)->get(['id', 'employee_id', 'name']);
        if ($allEmployees->count() > 0) {
            echo "\nKaryawan yang tersedia:\n";
            foreach ($allEmployees as $emp) {
                echo "- ID: {$emp->employee_id}, Nama: {$emp->name}\n";
            }
        }
        exit(1);
    }

    echo "✓ Employee ditemukan: {$employee->name} ({$employee->employee_id})\n";

    $today = Carbon::parse('2026-04-02'); // Tanggal hari ini

    // Cek apakah sudah ada leave untuk hari ini
    $existingLeave = Leave::where('employee_id', $employee->id)
        ->where('start_date', '<=', $today->toDateString())
        ->where('end_date', '>=', $today->toDateString())
        ->first();

    if ($existingLeave) {
        echo "⚠ Sudah ada leave untuk tanggal ini:\n";
        echo "  Jenis: {$existingLeave->type}\n";
        echo "  Status: {$existingLeave->status}\n";
        echo "  Periode: {$existingLeave->start_date} s/d {$existingLeave->end_date}\n";
        exit(0);
    }

    // Buat leave cuti tahunan untuk hari ini
    $leave = Leave::create([
        'employee_id' => $employee->id,
        'type' => 'annual', // Cuti tahunan
        'start_date' => $today->toDateString(),
        'end_date' => $today->toDateString(),
        'reason' => 'Cuti tahunan - keperluan pribadi',
        'status' => 'approved', // Langsung approved
        'applied_date' => Carbon::now(),
    ]);

    echo "✓ Leave berhasil dibuat!\n";
    echo "  ID: {$leave->id}\n";
    echo "  Jenis: Cuti Tahunan (annual)\n";
    echo "  Tanggal: {$leave->start_date}\n";
    echo "  Status: {$leave->status}\n";

    // Buat attendance records untuk leave
    $leave->createAttendanceRecords();

    echo "✓ Attendance record berhasil dibuat!\n";
    echo "\n";
    echo "=== DETAIL ATTENDANCE ===\n";

    $attendance = \App\Models\Attendance::where('employee_id', $employee->id)
        ->whereDate('date', $today->toDateString())
        ->first();

    if ($attendance) {
        echo "  Tanggal: {$attendance->date}\n";
        echo "  Status: {$attendance->status}\n";
        echo "  Source: {$attendance->source}\n";
        echo "  Check In: " . ($attendance->check_in ?? '-') . "\n";
        echo "  Check Out: " . ($attendance->check_out ?? '-') . "\n";
    }

    echo "\n✅ Selesai! Silakan cek di aplikasi.\n";
    echo "   Buka menu Attendance dan pilih tanggal: 2 April 2026\n";
    echo "   {$employee->name} akan tampil dengan badge 'Cuti' (biru)\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "   Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}

<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$attendances = \App\Models\Attendance::with('employee')
    ->where('source', 'x601')
    ->whereYear('date', 2026)
    ->whereMonth('date', 3)
    ->get();

echo "Total attendance records: " . $attendances->count() . "\n\n";

foreach ($attendances as $att) {
    echo "ID: {$att->id}\n";
    echo "Employee: " . ($att->employee ? $att->employee->name : 'N/A') . "\n";
    echo "Machine Name: " . ($att->machine_name ?? 'N/A') . "\n";
    echo "Date: {$att->date}\n";
    echo "Status: {$att->status}\n";
    echo "Work Hours: {$att->work_hours}\n";
    echo "Check In: {$att->check_in}\n";
    echo "Check Out: {$att->check_out}\n";
    echo "---\n";
}

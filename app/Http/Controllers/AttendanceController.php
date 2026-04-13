<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Leave;
use App\Exports\AttendanceExport;
use App\Services\X601AttendanceService;
use App\Services\X601Service;
use App\Services\AttendanceSummaryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $canManageAll = $user->hasPermission('manage_attendances');

        // Determine the date to display (default to today)
        $date = $request->has('date') ? $request->date : now()->format('Y-m-d');

        // If user only has view_own_attendance, filter to their own employee record
        if (!$canManageAll) {
            $ownEmployee = $user->employee ?? \App\Models\Employee::where('email', $user->email)->first();
            if (!$ownEmployee) {
                return response()->json([]);
            }
            $employees = collect([$ownEmployee]);
        } else {
            // Get all active employees
            $employees = Employee::where('status', 'active')->get();
        }

        // Get attendance records for the specified date
        $attendanceQuery = Attendance::with('employee')
            ->whereDate('date', $date);

        // Filter by source (if specified)
        $sourceFilter = $request->get('source', 'x601'); // default to x601
        if ($sourceFilter && $sourceFilter !== 'all' && in_array($sourceFilter, ['manual', 'x601'])) {
            $attendanceQuery->where('source', $sourceFilter);
        }

        $attendances = $attendanceQuery->get()->keyBy('employee_id');

        // Get approved leaves for this date
        $approvedLeaves = Leave::where('status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->get()
            ->keyBy('employee_id');

        // Build the result with all employees
        $transformed = $employees->map(function ($employee) use ($attendances, $approvedLeaves, $date, $sourceFilter) {
            $attendance = $attendances->get($employee->id);
            $leave = $approvedLeaves->get($employee->id);

            if ($attendance) {
                // Employee has attendance record
                $status = $attendance->status;
                $leaveType = null;

                // Override status if employee has approved leave
                if ($leave) {
                    $status = $this->getLeaveStatus($leave->type);
                    $leaveType = $leave->type;
                }

                return [
                    'id' => (string) $attendance->id,
                    'employeeId' => $employee->employee_id ?? '',
                    'employeeName' => $attendance->machine_name ?? $employee->name ?? '',
                    'date' => $attendance->date->format('Y-m-d'),
                    'checkIn' => $attendance->check_in ?? '',
                    'checkOut' => $attendance->check_out ?? '',
                    'status' => $status,
                    'leaveType' => $leaveType,
                    'workHours' => (float) $attendance->work_hours,
                    'source' => $attendance->source ?? 'manual',
                    'include' => true, // always include if has attendance
                ];
            } else {
                // Employee does not have attendance record
                // Check if employee has approved leave
                if ($leave) {
                    return [
                        'id' => null,
                        'employeeId' => $employee->employee_id ?? '',
                        'employeeName' => $employee->name ?? '',
                        'date' => $date,
                        'checkIn' => '',
                        'checkOut' => '',
                        'status' => $this->getLeaveStatus($leave->type),
                        'leaveType' => $leave->type,
                        'workHours' => 0,
                        'source' => 'leave',
                        'include' => true,
                    ];
                }

                // No attendance and no leave - mark as absent
                // Only include absent employees if showing x601 or all
                $includeAbsent = ($sourceFilter === 'all' || $sourceFilter === 'x601');

                return [
                    'id' => null,
                    'employeeId' => $employee->employee_id ?? '',
                    'employeeName' => $employee->name ?? '',
                    'date' => $date,
                    'checkIn' => '',
                    'checkOut' => '',
                    'status' => 'absent',
                    'leaveType' => null,
                    'workHours' => 0,
                    'source' => 'system',
                    'include' => $includeAbsent,
                ];
            }
        });

        // Filter out records that should not be included
        $transformed = $transformed->filter(function ($item) {
            return $item['include'] ?? true;
        })->map(function ($item) {
            unset($item['include']);
            return $item;
        });

        // Apply status filter on the final result
        if ($request->has('status') && $request->status !== 'all') {
            $transformed = $transformed->filter(function ($item) use ($request) {
                return $item['status'] === $request->status;
            })->values();
        }

        // Apply employee_id filter on the final result
        if ($request->has('employee_id')) {
            $transformed = $transformed->filter(function ($item) use ($request) {
                return $item['employeeId'] === $request->employee_id;
            })->values();
        }

        return response()->json($transformed->values());
    }

    /**
     * Get leave status based on leave type
     */
    private function getLeaveStatus(string $leaveType): string
    {
        $statusMap = [
            'annual' => 'on-leave',      // Cuti tahunan
            'sick' => 'sick-leave',      // Sakit
            'personal' => 'personal-leave', // Izin pribadi
            'maternity' => 'maternity-leave', // Cuti melahirkan
            'paternity' => 'paternity-leave', // Cuti ayah
        ];

        return $statusMap[$leaveType] ?? 'on-leave';
    }

    /**
     * Show X601 Dashboard (direct view)
     */
    public function x601Dashboard(Request $request)
    {
        $IP = $request->get('ip', '10.1.7.28');
        $Key = $request->get('key', '0');
        $tgl_awal = $request->get('tgl_awal', '');
        $tgl_akhir = $request->get('tgl_akhir', '');

        $users = [];
        $rows = [];
        $error = null;

        try {
            $x601 = new X601Service($IP, $Key, 80);

            $users = $x601->getUsers();
            $logs = $x601->getLogs($tgl_awal, $tgl_akhir);

            foreach ($logs as $row) {
                $rows[] = [
                    'pin' => $row['pin'] ?? null,
                    'nama' => $row['nama'] ?? ($users[$row['pin']] ?? 'Tidak Diketahui'),
                    'tanggal' => $row['tanggal'] ?? null,
                    'checkin' => $row['checkin'] ?? null,
                    'checkout' => $row['checkout'] ?? null,
                    'jam_kerja' => $row['jam_kerja'] ?? null,
                    'status' => $row['status'] ?? null,
                ];
            }
        } catch (\Throwable $th) {
            $error = $th->getMessage();
        }

        return view('attendance.x601_attendance', compact('IP', 'Key', 'tgl_awal', 'tgl_akhir', 'users', 'rows', 'error'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,late,absent,half-day',
            'work_hours' => 'nullable|numeric|min:0|max:24',
        ]);

        // Calculate work hours if not provided
        if (!isset($validated['work_hours']) && isset($validated['check_in']) && isset($validated['check_out'])) {
            $checkIn = Carbon::createFromFormat('H:i', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('H:i', $validated['check_out']);
            $validated['work_hours'] = $checkOut->diffInHours($checkIn, true);
        }

        $attendance = Attendance::create($validated + ['source' => 'manual']);
        return response()->json($attendance->load('employee'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $attendance = Attendance::with('employee')->findOrFail($id);
        return response()->json($attendance);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $attendance = Attendance::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,late,absent,half-day',
            'work_hours' => 'nullable|numeric|min:0|max:24',
        ]);

        // Calculate work hours if not provided
        if (!isset($validated['work_hours']) && isset($validated['check_in']) && isset($validated['check_out'])) {
            $checkIn = Carbon::createFromFormat('H:i', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('H:i', $validated['check_out']);
            $validated['work_hours'] = $checkOut->diffInHours($checkIn, true);
        }

        $attendance->update($validated);
        return response()->json($attendance->load('employee'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();
        return response()->json(['message' => 'Attendance deleted successfully']);
    }

    /**
     * Sync attendance data from X601 machine
     */
    public function syncFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d',
            'employee_id' => 'nullable|string',
            'ip' => 'nullable|string',
            'key' => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip = $validated['ip'] ?? '10.1.7.28';
        $key = $validated['key'] ?? config('services.x601.api_key', '0');
        $port = $validated['port'] ?? 80;

        $result = $service->syncAttendance(
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null,
            $validated['employee_id'] ?? null,
            $ip,
            $key,
            $port
        );

        if (!empty($result['errors'])) {
            return response()->json($result, 207); // Multi-Status
        }

        return response()->json($result);
    }

    /**
     * Fetch attendance data directly from X601 machine (preview before sync)
     */
    public function fetchFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'employee_id' => 'nullable|string',
            'ip' => 'nullable|string',
            'key' => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip = $validated['ip'] ?? '10.1.7.28';
        $key = $validated['key'] ?? config('services.x601.api_key', '0');
        $port = $validated['port'] ?? 80;

        $data = $service->fetchFromMachine(
            $validated['date'] ?? null,
            $validated['employee_id'] ?? null,
            $ip,
            $key,
            $port
        );

        return response()->json(['data' => $data]);
    }

    /**
     * Direct connection to X601 machine using GET parameters
     */
    public function connectX601(Request $request)
    {
        $ipParam = $request->get('ip', '10.1.7.28');
        $Key = $request->get('key', '0');
        $tgl_awal = $request->get('tgl_awal', '');
        $tgl_akhir = $request->get('tgl_akhir', '');

        // Parse IP and port
        if (strpos($ipParam, ':') !== false) {
            list($IP, $port) = explode(':', $ipParam, 2);
            $port = (int) $port;
        } else {
            $IP = $ipParam;
            $port = 80;
        }

        try {
            $x601Service = new X601Service($IP, $Key, $port);

            // Get attendance logs
            $logs = $x601Service->getLogs($tgl_awal, $tgl_akhir);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'count' => count($logs),
                'parameters' => [
                    'ip' => $IP,
                    'port' => $port,
                    'key' => $Key,
                    'tgl_awal' => $tgl_awal,
                    'tgl_akhir' => $tgl_akhir
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'parameters' => [
                    'ip' => $IP,
                    'port' => $port,
                    'key' => $Key,
                    'tgl_awal' => $tgl_awal,
                    'tgl_akhir' => $tgl_akhir
                ]
            ], 500);
        }
    }

    /**
     * Get monthly attendance summary
     */
    public function monthlySummary(Request $request, AttendanceSummaryService $summaryService)
    {
        try {
            $validated = $request->validate([
                'year' => 'required|integer|min:2020|max:' . (date('Y') + 1),
                'month' => 'required|integer|min:1|max:12',
            ]);

            $summary = $summaryService->getMonthlySummary(
                $validated['year'],
                $validated['month']
            );

            return response()->json($summary);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Export monthly attendance summary to Excel
     */
    public function exportMonthly(Request $request, AttendanceSummaryService $summaryService)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:' . (date('Y') + 1),
            'month' => 'required|integer|min:1|max:12',
            'format' => 'nullable|string|in:excel,csv',
        ]);

        $format = $validated['format'] ?? 'excel';
        $exportData = $summaryService->getExportData(
            $validated['year'],
            $validated['month']
        );

        if ($format === 'excel') {
            return $this->exportToExcel($exportData, $validated['year'], $validated['month']);
        } else {
            return $this->exportToCsv($exportData, $validated['year'], $validated['month']);
        }
    }

    /**
     * Export data to Excel format
     */
    private function exportToExcel(array $data, int $year, int $month): StreamedResponse
    {
        $filename = "absensi_{$year}_{$month}.xlsx";

        return response()->stream(function () use ($data, $year, $month) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set title
            $sheet->setTitle('Rangkuman Absensi');

            // Summary section
            $sheet->setCellValue('A1', 'RANGKUMAN ABSENSI BULANAN');
            $sheet->mergeCells('A1:K1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

            $row = 3;
            $sheet->setCellValue("A{$row}", 'Periode');
            $sheet->setCellValue("B{$row}", $data['summary']['Periode']);
            $row++;
            $sheet->setCellValue("A{$row}", 'Hari Kerja');
            $sheet->setCellValue("B{$row}", $data['summary']['Hari Kerja']);
            $row++;
            $sheet->setCellValue("A{$row}", 'Total Karyawan');
            $sheet->setCellValue("B{$row}", $data['summary']['Total Karyawan']);
            $row++;
            $sheet->setCellValue("A{$row}", 'Dibuat pada');
            $sheet->setCellValue("B{$row}", $data['summary']['Dibuat pada']);
            $row += 2;

            // Employee data headers
            $headers = [
                'ID Karyawan',
                'Nama Karyawan',
                'Departemen',
                'Jabatan',
                'Hadir',
                'Terlambat',
                'Absen',
                'Setengah Hari',
                'Total Jam Kerja',
                'Rata-rata Jam Kerja',
                'Persentase Kehadiran'
            ];

            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue("{$col}{$row}", $header);
                $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true);
                $sheet->getColumnDimension($col)->setAutoSize(true);
                $col++;
            }
            $row++;

            // Employee data
            foreach ($data['employees'] as $employee) {
                $sheet->setCellValue("A{$row}", $employee['ID Karyawan']);
                $sheet->setCellValue("B{$row}", $employee['Nama Karyawan']);
                $sheet->setCellValue("C{$row}", $employee['Departemen']);
                $sheet->setCellValue("D{$row}", $employee['Jabatan']);
                $sheet->setCellValue("E{$row}", $employee['Hadir']);
                $sheet->setCellValue("F{$row}", $employee['Terlambat']);
                $sheet->setCellValue("G{$row}", $employee['Absen']);
                $sheet->setCellValue("H{$row}", $employee['Setengah Hari']);
                $sheet->setCellValue("I{$row}", $employee['Total Jam Kerja']);
                $sheet->setCellValue("J{$row}", $employee['Rata-rata Jam Kerja']);
                $sheet->setCellValue("K{$row}", $employee['Persentase Kehadiran']);
                $row++;
            }

            // Style the header row
            $headerStyle = $sheet->getStyle("A" . ($row - count($data['employees']) - 1) . ":K" . ($row - count($data['employees']) - 1));
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setRGB('E3F2FD');
            $headerStyle->getBorders()->getAllBorders()->setBorderStyle('thin');

            // Style data rows
            $dataStyle = $sheet->getStyle("A" . ($row - count($data['employees'])) . ":K" . ($row - 1));
            $dataStyle->getBorders()->getAllBorders()->setBorderStyle('thin');

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Export data to CSV format
     */
    private function exportToCsv(array $data, int $year, int $month)
    {
        $filename = "absensi_{$year}_{$month}.csv";

        $csvContent = $this->generateCsvContent($data);

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'max-age=0');
    }

    /**
     * Generate CSV content
     */
    private function generateCsvContent(array $data): string
    {
        $output = fopen('php://temp', 'r+');

        // Summary sheet
        fputcsv($output, ['RANGKUMAN ABSENSI BULANAN']);
        fputcsv($output, []);
        fputcsv($output, ['Periode', $data['summary']['Periode']]);
        fputcsv($output, ['Hari Kerja', $data['summary']['Hari Kerja']]);
        fputcsv($output, ['Total Karyawan', $data['summary']['Total Karyawan']]);
        fputcsv($output, ['Dibuat pada', $data['summary']['Dibuat pada']]);
        fputcsv($output, []);

        // Employee data headers
        fputcsv($output, [
            'ID Karyawan',
            'Nama Karyawan',
            'Departemen',
            'Jabatan',
            'Hadir',
            'Terlambat',
            'Absen',
            'Setengah Hari',
            'Total Jam Kerja',
            'Rata-rata Jam Kerja',
            'Persentase Kehadiran'
        ]);

        // Employee data
        foreach ($data['employees'] as $employee) {
            fputcsv($output, [
                $employee['ID Karyawan'],
                $employee['Nama Karyawan'],
                $employee['Departemen'],
                $employee['Jabatan'],
                $employee['Hadir'],
                $employee['Terlambat'],
                $employee['Absen'],
                $employee['Setengah Hari'],
                $employee['Total Jam Kerja'],
                $employee['Rata-rata Jam Kerja'],
                $employee['Persentase Kehadiran']
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Comprehensive sync - sync all attendance data from X601 machine
     */
    public function comprehensiveSyncFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|string',
            'ip' => 'nullable|string',
            'key' => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip = $validated['ip'] ?? '10.1.7.28';
        $key = $validated['key'] ?? config('services.x601.api_key', '0');
        $port = $validated['port'] ?? 80;

        $result = $service->syncAllAttendance(
            $validated['employee_id'] ?? null,
            $ip,
            $key,
            $port
        );

        if (!empty($result['errors'])) {
            return response()->json($result, 207); // Multi-Status
        }

        return response()->json($result);
    }

    /**
     * Export attendance data to Excel with filters
     */
    public function exportExcel(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        try {
            $export = new AttendanceExport(
                $validated['start_date'],
                $validated['end_date'],
                $validated['employee_id'] ?? null
            );

            $spreadsheet = $export->export();
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

            // Generate filename
            $filename = 'Laporan_Kehadiran_' .
                date('Ymd', strtotime($validated['start_date'])) . '-' .
                date('Ymd', strtotime($validated['end_date']));

            if (!empty($validated['employee_id'])) {
                $employee = Employee::find($validated['employee_id']);
                if ($employee) {
                    $filename .= '_' . str_replace(' ', '_', $employee->name);
                }
            }

            $filename .= '.xlsx';

            // Stream response
            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal export data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all active employees without attendance on a given date as absent.
     * Accepts optional 'date' (Y-m-d) and 'skip_weekends' (bool) in the request body.
     */
    public function markAbsent(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'date'          => 'nullable|date_format:Y-m-d',
            'skip_weekends' => 'nullable|boolean',
        ]);

        $date         = $validated['date'] ?? now()->subDay()->format('Y-m-d');
        $skipWeekends = $validated['skip_weekends'] ?? true;

        $result = $service->markAbsentForDate($date, (bool) $skipWeekends);

        $status = !empty($result['errors']) ? 207 : 200;
        return response()->json($result, $status);
    }

    /**
     * Sync users/employees from X601 machine to employees table.
     * Creates new employees if they don't exist, updates name if changed.
     */
    public function syncUsersFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'ip'   => 'nullable|string',
            'key'  => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip   = $validated['ip'] ?? null;
        $key  = $validated['key'] ?? null;
        $port = $validated['port'] ?? null;

        $result = $service->syncUsersFromX601($ip, $key, $port);

        $status = !empty($result['errors']) ? 207 : 200;
        return response()->json($result, $status);
    }

    /**
     * Fetch users list directly from X601 machine (preview before sync).
     */
    public function fetchUsersFromX601(Request $request)
    {
        $validated = $request->validate([
            'ip'   => 'nullable|string',
            'key'  => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip = $validated['ip'] ?? '10.1.7.28';
        $key = $validated['key'] ?? '0';
        $port = $validated['port'] ?? 80;

        try {
            $x601Service = new X601Service($ip, $key, $port);
            $users = $x601Service->getUsers();

            // Convert to array of objects for frontend
            $userList = [];
            foreach ($users as $pin => $name) {
                $userList[] = [
                    'pin' => $pin,
                    'name' => $name,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $userList,
                'count' => count($userList),
                'parameters' => [
                    'ip' => $ip,
                    'port' => $port,
                    'key' => $key,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'parameters' => [
                    'ip' => $ip,
                    'port' => $port,
                    'key' => $key,
                ]
            ], 500);
        }
    }
}

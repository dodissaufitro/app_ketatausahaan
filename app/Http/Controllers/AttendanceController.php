<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Services\X601AttendanceService;
use App\Services\X601Service;
use App\Services\AttendanceSummaryService;
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
        $query = Attendance::with('employee');

        // Filter by date
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by source (default from X601)
        if ($request->has('source') && in_array($request->source, ['manual', 'x601'])) {
            $query->where('source', $request->source);
        } else {
            $query->where('source', 'x601');
        }

        $attendances = $query->orderBy('date', 'desc')->orderBy('check_in', 'desc')->get();

        // Transform data to match frontend expectations
        $transformed = $attendances->map(function ($attendance) {
            return [
                'id' => (string) $attendance->id,
                'employeeId' => $attendance->employee->employee_id ?? '',
                'employeeName' => $attendance->machine_name ?? $attendance->employee->name ?? '',
                'date' => $attendance->date->format('Y-m-d'),
                'checkIn' => $attendance->check_in ?? '',
                'checkOut' => $attendance->check_out ?? '',
                'status' => $attendance->status,
                'workHours' => (float) $attendance->work_hours,
                'source' => $attendance->source ?? 'manual',
            ];
        });

        return response()->json($transformed);
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
            'date' => 'nullable|date_format:Y-m-d',
            'employee_id' => 'nullable|string',
            'ip' => 'nullable|string',
            'key' => 'nullable|string',
            'port' => 'nullable|integer',
        ]);

        $ip = $validated['ip'] ?? '10.1.7.28';
        $key = $validated['key'] ?? config('services.x601.api_key', '0');
        $port = $validated['port'] ?? 80;

        $result = $service->syncAttendance(
            $validated['date'] ?? null,
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
}

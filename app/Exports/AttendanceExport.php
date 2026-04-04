<?php

namespace App\Exports;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Leave;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AttendanceExport
{
    protected $startDate;
    protected $endDate;
    protected $employeeId;

    public function __construct($startDate, $endDate, $employeeId = null)
    {
        $this->startDate = Carbon::parse($startDate);
        $this->endDate = Carbon::parse($endDate);
        $this->employeeId = $employeeId;
    }

    public function export()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set document properties
        $spreadsheet->getProperties()
            ->setCreator('Sistem Ketatausahaan')
            ->setTitle('Laporan Kehadiran Karyawan')
            ->setSubject('Data Kehadiran')
            ->setDescription('Laporan kehadiran karyawan periode ' . $this->startDate->format('d/m/Y') . ' - ' . $this->endDate->format('d/m/Y'));

        // HEADER SECTION
        $sheet->setCellValue('A1', 'LAPORAN KEHADIRAN KARYAWAN');
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Info periode
        $sheet->setCellValue('A2', 'Periode: ' . $this->startDate->format('d F Y') . ' s/d ' . $this->endDate->format('d F Y'));
        $sheet->mergeCells('A2:I2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Tanggal export
        $sheet->setCellValue('A3', 'Dicetak pada: ' . Carbon::now()->format('d F Y H:i:s'));
        $sheet->mergeCells('A3:I3');
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A3')->getFont()->setSize(9)->setItalic(true);

        // Empty row
        $row = 5;

        // TABLE HEADER
        $headers = ['No', 'ID Karyawan', 'Nama Karyawan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Jam Kerja', 'Status', 'Keterangan'];
        $column = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($column . $row, $header);
            $sheet->getStyle($column . $row)->getFont()->setBold(true);
            $sheet->getStyle($column . $row)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('4472C4');
            $sheet->getStyle($column . $row)->getFont()->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($column . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle($column . $row)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $column++;
        }

        // QUERY DATA
        $query = Attendance::with('employee');

        // Filter by date range
        $query->whereBetween('date', [$this->startDate, $this->endDate]);

        // Filter by employee if specified
        if ($this->employeeId) {
            $query->where('employee_id', $this->employeeId);
        }

        // Get data
        $attendances = $query->orderBy('date', 'asc')
            ->orderBy('employee_id', 'asc')
            ->get();

        // DATA ROWS
        $row++;
        $no = 1;
        foreach ($attendances as $attendance) {
            // Check for approved leave
            $leave = Leave::where('employee_id', $attendance->employee_id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $attendance->date)
                ->whereDate('end_date', '>=', $attendance->date)
                ->first();

            $status = $attendance->status;
            $keterangan = '';

            if ($leave) {
                $status = $this->getLeaveStatusText($leave->type);
                $keterangan = 'Cuti: ' . $leave->reason;
            } else {
                $status = $this->getStatusText($attendance->status);
                $keterangan = $attendance->source === 'x601' ? 'X601 Machine' : ($attendance->source === 'manual' ? 'Input Manual' : ($attendance->source === 'leave' ? 'Cuti/Izin' : 'Sistem'));
            }

            // Populate row
            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $attendance->employee->employee_id ?? '-');
            $sheet->setCellValue('C' . $row, $attendance->employee->name ?? '-');
            $sheet->setCellValue('D' . $row, Carbon::parse($attendance->date)->format('d/m/Y'));
            $sheet->setCellValue('E' . $row, $attendance->check_in ?? '-');
            $sheet->setCellValue('F' . $row, $attendance->check_out ?? '-');
            $sheet->setCellValue('G' . $row, $attendance->work_hours ? number_format($attendance->work_hours, 2) . ' jam' : '-');
            $sheet->setCellValue('H' . $row, $status);
            $sheet->setCellValue('I' . $row, $keterangan);

            // Apply styling based on status
            $this->applyStatusColor($sheet, 'H' . $row, $attendance->status, $leave);

            // Center align for number and dates
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('H' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
            $no++;
        }

        // SUMMARY SECTION
        $row++;
        $summaryRow = $row;

        // Calculate statistics
        $totalRecords = $attendances->count();
        $present = $attendances->filter(fn($a) => in_array($a->status, ['present', 'late', 'half-day']))->count();
        $absent = $attendances->where('status', 'absent')->count();
        $onLeave = $attendances->filter(fn($a) => in_array($a->status, ['on-leave', 'sick-leave', 'personal-leave', 'maternity-leave', 'paternity-leave']))->count();

        $sheet->setCellValue('A' . $row, 'RINGKASAN');
        $sheet->mergeCells('A' . $row . ':B' . $row);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Total Kehadiran:');
        $sheet->setCellValue('B' . $row, $totalRecords . ' record');
        $row++;

        $sheet->setCellValue('A' . $row, 'Hadir:');
        $sheet->setCellValue('B' . $row, $present . ' hari');
        $sheet->getStyle('B' . $row)->getFont()->getColor()->setRGB('00B050');
        $row++;

        $sheet->setCellValue('A' . $row, 'Tidak Hadir:');
        $sheet->setCellValue('B' . $row, $absent . ' hari');
        $sheet->getStyle('B' . $row)->getFont()->getColor()->setRGB('FF0000');
        $row++;

        $sheet->setCellValue('A' . $row, 'Cuti/Izin:');
        $sheet->setCellValue('B' . $row, $onLeave . ' hari');
        $sheet->getStyle('B' . $row)->getFont()->getColor()->setRGB('0066CC');

        // BORDERS
        $lastRow = $row;
        $sheet->getStyle('A5:I' . ($lastRow - 6))->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A5:I5')->getBorders()->getBottom()->setBorderStyle(Border::BORDER_MEDIUM);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(25);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(15);
        $sheet->getColumnDimension('I')->setWidth(30);

        return $spreadsheet;
    }

    private function getStatusText($status)
    {
        return match ($status) {
            'present' => 'Tepat Waktu',
            'late' => 'Terlambat',
            'absent' => 'Tidak Hadir',
            'half-day' => 'Pulang Cepat',
            'on-leave' => 'Cuti',
            'sick-leave' => 'Sakit',
            'personal-leave' => 'Izin Pribadi',
            'maternity-leave' => 'Cuti Melahirkan',
            'paternity-leave' => 'Cuti Ayah',
            default => $status,
        };
    }

    private function getLeaveStatusText($leaveType)
    {
        return match ($leaveType) {
            'annual' => 'Cuti Tahunan',
            'sick' => 'Sakit',
            'personal' => 'Izin Pribadi',
            'maternity' => 'Cuti Melahirkan',
            'paternity' => 'Cuti Ayah',
            default => 'Cuti',
        };
    }

    private function applyStatusColor($sheet, $cell, $status, $leave)
    {
        if ($leave) {
            // Leave status - blue
            $sheet->getStyle($cell)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D6EAF8');
            $sheet->getStyle($cell)->getFont()->getColor()->setRGB('1F618D');
        } else {
            switch ($status) {
                case 'present':
                    // Green for present
                    $sheet->getStyle($cell)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('D5F4E6');
                    $sheet->getStyle($cell)->getFont()->getColor()->setRGB('0B5345');
                    break;
                case 'late':
                    // Yellow for late
                    $sheet->getStyle($cell)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('FEF9E7');
                    $sheet->getStyle($cell)->getFont()->getColor()->setRGB('7D6608');
                    break;
                case 'absent':
                    // Red for absent
                    $sheet->getStyle($cell)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F5B7B1');
                    $sheet->getStyle($cell)->getFont()->getColor()->setRGB('922B21');
                    break;
                case 'half-day':
                    // Orange for half-day
                    $sheet->getStyle($cell)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('FAE5D3');
                    $sheet->getStyle($cell)->getFont()->getColor()->setRGB('935116');
                    break;
            }
        }

        $sheet->getStyle($cell)->getFont()->setBold(true);
    }
}

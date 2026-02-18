<?php

namespace App\Exports;

use App\Models\AngkutanUmum;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class AngkutanUmumPdfExport
{
    public function export($dateFrom = null, $dateTo = null)
    {
        $query = AngkutanUmum::query();

        // Filter berdasarkan tanggal jika diberikan
        if ($dateFrom) {
            $query->whereDate('tanggal_pelaksanaan', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('tanggal_pelaksanaan', '<=', $dateTo);
        }

        $data = $query->orderBy('tanggal_pelaksanaan', 'desc')->get();

        // Create HTML content for PDF
        $html = $this->generateHtmlPdf($data, $dateFrom, $dateTo);

        $filename = 'data-angkutan-umum-' . date('Y-m-d-His') . '.pdf';

        // Create PDF
        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'landscape')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isPhpEnabled', true);

        return $pdf->download($filename);
    }

    private function generateHtmlPdf($data, $dateFrom = null, $dateTo = null)
    {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #2F5597;
            margin-bottom: 5px;
            text-align: center;
        }
        .subtitle {
            font-size: 11px;
            color: #666;
            margin-bottom: 20px;
            text-align: center;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th {
            background-color: #4472C4;
            color: white;
            font-weight: bold;
            padding: 8px 5px;
            border: 1px solid #2F5597;
            text-align: center;
            font-size: 9px;
        }
        td {
            padding: 5px;
            border: 1px solid #D0D0D0;
            vertical-align: middle;
            font-size: 8px;
        }
        .row-odd {
            background-color: #F8F9FA;
        }
        .row-even {
            background-color: #FFFFFF;
        }
        .text-center {
            text-align: center;
        }
        .foto-cell {
            text-align: center;
            width: 60px;
        }
        .foto-cell img {
            max-width: 50px;
            max-height: 50px;
            border-radius: 4px;
        }
        .no-foto {
            color: #999;
            font-style: italic;
            font-size: 8px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="title">DATA PENGGUNAAN ANGKUTAN UMUM</div>
    <div class="subtitle">' . $this->generateSubtitle($dateFrom, $dateTo) . '</div>
    <table>
        <thead>
            <tr>
                <th width="30">No</th>
                <th width="120">Nama Lengkap</th>
                <th width="80">Tanggal</th>
                <th width="100">Jabatan</th>
                <th width="100">Angkutan Umum</th>
                <th width="60">Foto Berangkat</th>
                <th width="60">Foto Pulang</th>
                <th width="80">Tanggal Dibuat</th>
            </tr>
        </thead>
        <tbody>';

        $no = 1;
        foreach ($data as $item) {
            $rowClass = $no % 2 == 0 ? 'row-even' : 'row-odd';

            $html .= '<tr class="' . $rowClass . '">
                <td class="text-center">' . $no . '</td>
                <td>' . htmlspecialchars($item->nama_lengkap) . '</td>
                <td class="text-center">' . \Carbon\Carbon::parse($item->tanggal_pelaksanaan)->format('d/m/Y') . '</td>
                <td>' . htmlspecialchars($item->jabatan) . '</td>
                <td>' . htmlspecialchars($item->angkutan_umum_digunakan) . '</td>
                <td class="foto-cell">';

            // Foto Keberangkatan
            if ($item->foto_timestamp_keberangkatan) {
                $imagePath = storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $item->foto_timestamp_keberangkatan);
                if (file_exists($imagePath)) {
                    try {
                        $imageData = base64_encode(file_get_contents($imagePath));
                        $imageInfo = getimagesize($imagePath);
                        $mimeType = $imageInfo['mime'];
                        $html .= '<img src="data:' . $mimeType . ';base64,' . $imageData . '" alt="Foto Keberangkatan" />';
                    } catch (\Exception $e) {
                        $html .= '<span class="no-foto">Error</span>';
                    }
                } else {
                    $html .= '<span class="no-foto">File Hilang</span>';
                }
            } else {
                $html .= '<span class="no-foto">Tidak Ada</span>';
            }

            $html .= '</td>
                <td class="foto-cell">';

            // Foto Kepulangan
            if ($item->foto_timestamp_kepulangan) {
                $imagePath = storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $item->foto_timestamp_kepulangan);
                if (file_exists($imagePath)) {
                    try {
                        $imageData = base64_encode(file_get_contents($imagePath));
                        $imageInfo = getimagesize($imagePath);
                        $mimeType = $imageInfo['mime'];
                        $html .= '<img src="data:' . $mimeType . ';base64,' . $imageData . '" alt="Foto Kepulangan" />';
                    } catch (\Exception $e) {
                        $html .= '<span class="no-foto">Error</span>';
                    }
                } else {
                    $html .= '<span class="no-foto">File Hilang</span>';
                }
            } else {
                $html .= '<span class="no-foto">Tidak Ada</span>';
            }

            $html .= '</td>
                <td class="text-center">' . \Carbon\Carbon::parse($item->created_at)->format('d/m/Y H:i') . '</td>
            </tr>';

            $no++;
        }

        $html .= '
        </tbody>
    </table>
    <div class="footer">
        Total Data: ' . $data->count() . ' | Generated by Sistem Ketatausahaan
    </div>
</body>
</html>';

        return $html;
    }

    private function generateSubtitle($dateFrom = null, $dateTo = null)
    {
        $subtitle = 'Tanggal Export: ' . date('d F Y H:i:s');

        if ($dateFrom || $dateTo) {
            $subtitle .= ' | Filter: ';
            if ($dateFrom && $dateTo) {
                $subtitle .= date('d M Y', strtotime($dateFrom)) . ' - ' . date('d M Y', strtotime($dateTo));
            } elseif ($dateFrom) {
                $subtitle .= 'Dari ' . date('d M Y', strtotime($dateFrom));
            } elseif ($dateTo) {
                $subtitle .= 'Hingga ' . date('d M Y', strtotime($dateTo));
            }
        }

        return $subtitle;
    }
}

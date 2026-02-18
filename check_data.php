<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Cek total data
$total = DB::table('angkutan_umum')->count();
echo "Total data: " . $total . PHP_EOL;
echo PHP_EOL;

// Ambil satu data sample
$data = DB::table('angkutan_umum')->first();

if ($data) {
    echo "Sample Data:" . PHP_EOL;
    echo "=============" . PHP_EOL;
    echo "ID: " . $data->id . PHP_EOL;
    echo "Nama: " . $data->nama_lengkap . PHP_EOL;
    echo "Foto Keberangkatan: " . ($data->foto_timestamp_keberangkatan ?? 'NULL') . PHP_EOL;
    echo "Foto Kepulangan: " . ($data->foto_timestamp_kepulangan ?? 'NULL') . PHP_EOL;
    echo PHP_EOL;

    // Cek apakah file foto benar-benar ada
    if ($data->foto_timestamp_keberangkatan) {
        $path = storage_path('app/public/' . $data->foto_timestamp_keberangkatan);
        echo "Path Foto Keberangkatan: " . $path . PHP_EOL;
        echo "File exists? " . (file_exists($path) ? 'YES' : 'NO') . PHP_EOL;
    }

    if ($data->foto_timestamp_kepulangan) {
        $path = storage_path('app/public/' . $data->foto_timestamp_kepulangan);
        echo "Path Foto Kepulangan: " . $path . PHP_EOL;
        echo "File exists? " . (file_exists($path) ? 'YES' : 'NO') . PHP_EOL;
    }
} else {
    echo "Belum ada data di database." . PHP_EOL;
    echo "Silakan tambah data terlebih dahulu melalui form." . PHP_EOL;
}

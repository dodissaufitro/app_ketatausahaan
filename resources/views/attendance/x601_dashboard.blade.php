<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Absensi X601</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #caffcb, #a0f1ff);
        }

        .card {
            border-radius: 15px;
        }
    </style>
</head>

<body>
    <div class="container mt-5">
        <div class="card shadow p-4">
            <h3 class="text-center mb-4">📊 Dashboard Absensi Mesin X601</h3>
            <form method="GET" class="row g-3">
                <div class="col-md-3">
                    <label>IP Address</label>
                    <input type="text" name="ip" class="form-control" value="{{ old('ip', $IP) }}">
                </div>
                <div class="col-md-2">
                    <label>Comm Key</label>
                    <input type="text" name="key" class="form-control" value="{{ old('key', $Key) }}">
                </div>
                <div class="col-md-3">
                    <label>Tanggal Awal</label>
                    <input type="date" name="tgl_awal" class="form-control" value="{{ old('tgl_awal', $tgl_awal) }}">
                </div>
                <div class="col-md-3">
                    <label>Tanggal Akhir</label>
                    <input type="date" name="tgl_akhir" class="form-control"
                        value="{{ old('tgl_akhir', $tgl_akhir) }}">
                </div>
                <div class="col-md-1 d-flex align-items-end">
                    <button class="btn btn-success w-100">🔍</button>
                </div>
            </form>
            <hr>

            @if ($error)
                <div class="alert alert-danger">Koneksi gagal: {{ $error }}</div>
            @else
                @if (empty($rows))
                    <div class="alert alert-warning">Tidak ada data absensi</div>
                @else
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped text-center">
                            <thead class="table-success">
                                <tr>
                                    <th>User ID</th>
                                    <th>Nama</th>
                                    <th>Tanggal</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Jam Kerja</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($rows as $row)
                                    <tr>
                                        <td>{{ $row['pin'] ?? '-' }}</td>
                                        <td>{{ $row['nama'] ?? 'Tidak Diketahui' }}</td>
                                        <td>{{ $row['tanggal'] ?? '-' }}</td>
                                        <td><span class="badge bg-success">{{ $row['checkin'] ?? '-' }}</span></td>
                                        <td><span class="badge bg-danger">{{ $row['checkout'] ?? '-' }}</span></td>
                                        <td>{{ $row['jam_kerja'] ?? '-' }}</td>
                                        <td><span class="badge bg-info">{{ $row['status'] ?? '-' }}</span></td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif
            @endif
        </div>
    </div>
</body>

</html>

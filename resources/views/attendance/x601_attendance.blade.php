@extends('layouts.app')

@section('content')
    <div class="container-fluid py-4">
        <!-- Header -->
        <div class="mb-5">
            <h1 class="h2 d-flex align-items-center gap-3 text-primary">
                <i class="bi bi-clock-history fs-1"></i>
                Dashboard Absensi Mesin X601
            </h1>
            <p class="text-muted">Sinkronisasi dan pantau data kehadiran dari mesin absensi</p>
        </div>

        <!-- Filter Card -->
        <div class="card shadow-sm mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-router"></i> IP Address
                        </label>
                        <input type="text" name="ip" class="form-control" placeholder="10.88.125.230"
                            value="{{ $IP ?? '10.88.125.230' }}">
                    </div>

                    <div class="col-lg-2 col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-key"></i> Comm Key
                        </label>
                        <input type="text" name="key" class="form-control" placeholder="0"
                            value="{{ $Key ?? '0' }}">
                    </div>

                    <div class="col-lg-2 col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-calendar"></i> Dari Tanggal
                        </label>
                        <input type="date" name="tgl_awal" class="form-control" value="{{ $tgl_awal ?? '' }}">
                    </div>

                    <div class="col-lg-2 col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-calendar"></i> Hingga Tanggal
                        </label>
                        <input type="date" name="tgl_akhir" class="form-control" value="{{ $tgl_akhir ?? '' }}">
                    </div>

                    <div class="col-lg-3 col-md-12">
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-search"></i> Cari Data
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Stats Cards -->
        @if (!empty($rows))
            <div class="row mb-4">
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 shadow-sm bg-gradient-success text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <p class="mb-1 opacity-75">Total Kehadiran</p>
                                    <h3 class="mb-0">{{ count($rows) }}</h3>
                                </div>
                                <i class="bi bi-check-circle fs-1 opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 shadow-sm bg-gradient-danger text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <p class="mb-1 opacity-75">Terlambat</p>
                                    <h3 class="mb-0">
                                        {{ collect($rows)->filter(fn($r) => strpos($r['status'], 'Terlambat') !== false)->count() }}
                                    </h3>
                                </div>
                                <i class="bi bi-exclamation-circle fs-1 opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 shadow-sm bg-gradient-warning text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <p class="mb-1 opacity-75">Pulang Cepat</p>
                                    <h3 class="mb-0">
                                        {{ collect($rows)->filter(fn($r) => strpos($r['status'], 'Pulang Cepat') !== false && strpos($r['status'], 'Terlambat') === false)->count() }}
                                    </h3>
                                </div>
                                <i class="bi bi-clock-history fs-1 opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 shadow-sm bg-gradient-info text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <p class="mb-1 opacity-75">Tepat Waktu</p>
                                    <h3 class="mb-0">
                                        {{ collect($rows)->filter(fn($r) => $r['status'] === 'Tepat Waktu')->count() }}</h3>
                                </div>
                                <i class="bi bi-star fs-1 opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @endif

        <!-- Data Table -->
        <div class="card shadow-sm">
            <div class="card-header bg-light border-bottom">
                <h5 class="mb-0">
                    <i class="bi bi-table"></i> Data Absensi Karyawan
                    @if (!empty($rows))
                        <span class="badge bg-primary ms-2">{{ count($rows) }} Records</span>
                    @endif
                </h5>
            </div>
            <div class="card-body p-0">
                @if (!empty($rows))
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th width="10%">
                                        <i class="bi bi-person-badge"></i> User ID
                                    </th>
                                    <th width="20%">
                                        <i class="bi bi-person"></i> Nama
                                    </th>
                                    <th width="15%">
                                        <i class="bi bi-calendar2"></i> Tanggal
                                    </th>
                                    <th width="12%">
                                        <i class="bi bi-arrow-down-circle"></i> Check In
                                    </th>
                                    <th width="12%">
                                        <i class="bi bi-arrow-up-circle"></i> Check Out
                                    </th>
                                    <th width="12%">
                                        <i class="bi bi-hourglass-split"></i> Jam Kerja
                                    </th>
                                    <th width="19%">
                                        <i class="bi bi-badge-check"></i> Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($rows as $row)
                                    @php
                                        $statusClass = match ($row['status']) {
                                            'Tepat Waktu' => 'success',
                                            'Terlambat' => 'danger',
                                            'Pulang Cepat' => 'warning',
                                            'Telat & Pulang Cepat' => 'dark',
                                            default => 'secondary',
                                        };

                                        $statusIcon = match ($row['status']) {
                                            'Tepat Waktu' => 'check-circle-fill',
                                            'Terlambat' => 'exclamation-circle-fill',
                                            'Pulang Cepat' => 'clock-history',
                                            'Telat & Pulang Cepat' => 'exclamation-triangle-fill',
                                            default => 'question-circle-fill',
                                        };
                                    @endphp
                                    <tr>
                                        <td>
                                            <span class="badge bg-light text-dark fs-6">{{ $row['pin'] }}</span>
                                        </td>
                                        <td class="fw-semibold">{{ $row['nama'] ?? 'Tidak Diketahui' }}</td>
                                        <td>{{ $row['tanggal'] }}</td>
                                        <td>
                                            <span class="badge bg-success bg-opacity-10 text-success">
                                                <i class="bi bi-arrow-down-circle"></i> {{ $row['checkin'] }}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-danger bg-opacity-10 text-danger">
                                                <i class="bi bi-arrow-up-circle"></i> {{ $row['checkout'] }}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{{ $row['jam_kerja'] }}</strong>
                                        </td>
                                        <td>
                                            <span class="badge bg-{{ $statusClass }}">
                                                <i class="bi bi-{{ $statusIcon }}"></i> {{ $row['status'] }}
                                            </span>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @else
                    <div class="p-5 text-center">
                        <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                        <p class="text-muted mb-0">Masukkan parameter pencarian untuk melihat data absensi</p>
                    </div>
                @endif
            </div>
        </div>

        <!-- Error Message -->
        @if (isset($error))
            <div class="alert alert-danger mt-4" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Koneksi Gagal:</strong> {{ $error }}
            </div>
        @endif
    </div>

    <style>
        .bg-gradient-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        }

        .bg-gradient-danger {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%) !important;
        }

        .bg-gradient-warning {
            background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%) !important;
        }

        .bg-gradient-info {
            background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
        }

        .table-hover tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05);
        }

        .card {
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
        }
    </style>
@endsection

<?php

namespace App\Http\Controllers;

use App\Models\AngkutanUmum;
use App\Models\DownloadPermission;
use App\Exports\AngkutanUmumPdfExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class AngkutanUmumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        // Check if user has download permission
        $hasDownloadPermission = $user->role === 'superadmin' ||
            DownloadPermission::hasPermission($user->id, 'angkutan_umum');

        if ($hasDownloadPermission) {
            // Users with download permission can see all data
            $angkutanUmum = AngkutanUmum::with('user')->latest()->paginate(10);
        } else {
            // Regular users without permission can only see their own data
            $angkutanUmum = AngkutanUmum::where('user_id', $user->id)
                ->latest()
                ->paginate(10);
        }

        return response()->json([
            'angkutanUmum' => $angkutanUmum
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'tanggal_pelaksanaan' => 'required|date',
            'jabatan' => 'required|string|max:255',
            'angkutan_umum_digunakan' => 'required|string|max:255',
            'foto_timestamp_keberangkatan' => 'nullable|image|max:2048',
            'foto_timestamp_kepulangan' => 'nullable|image|max:2048',
        ]);

        // Auto-fill user_id
        $validated['user_id'] = Auth::id();

        // Handle file upload for foto keberangkatan
        if ($request->hasFile('foto_timestamp_keberangkatan')) {
            $validated['foto_timestamp_keberangkatan'] = $request->file('foto_timestamp_keberangkatan')
                ->store('angkutan_umum/keberangkatan', 'public');
        }

        // Handle file upload for foto kepulangan
        if ($request->hasFile('foto_timestamp_kepulangan')) {
            $validated['foto_timestamp_kepulangan'] = $request->file('foto_timestamp_kepulangan')
                ->store('angkutan_umum/kepulangan', 'public');
        }

        AngkutanUmum::create($validated);

        return response()->json([
            'message' => 'Data angkutan umum berhasil ditambahkan.'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(AngkutanUmum $angkutanUmum)
    {
        $user = Auth::user();

        // Check ownership for regular users
        if ($user->role === 'user' && $angkutanUmum->user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke data ini.'
            ], 403);
        }

        return response()->json([
            'angkutanUmum' => $angkutanUmum
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AngkutanUmum $angkutanUmum)
    {
        $user = Auth::user();

        // Check ownership for regular users
        if ($user->role === 'user' && $angkutanUmum->user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk mengubah data ini.'
            ], 403);
        }

        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'tanggal_pelaksanaan' => 'required|date',
            'jabatan' => 'required|string|max:255',
            'angkutan_umum_digunakan' => 'required|string|max:255',
            'foto_timestamp_keberangkatan' => 'nullable|image|max:2048',
            'foto_timestamp_kepulangan' => 'nullable|image|max:2048',
        ]);

        // Handle file upload for foto keberangkatan
        if ($request->hasFile('foto_timestamp_keberangkatan')) {
            // Delete old file if exists
            if ($angkutanUmum->foto_timestamp_keberangkatan) {
                Storage::disk('public')->delete($angkutanUmum->foto_timestamp_keberangkatan);
            }
            $validated['foto_timestamp_keberangkatan'] = $request->file('foto_timestamp_keberangkatan')
                ->store('angkutan_umum/keberangkatan', 'public');
        }

        // Handle file upload for foto kepulangan
        if ($request->hasFile('foto_timestamp_kepulangan')) {
            // Delete old file if exists
            if ($angkutanUmum->foto_timestamp_kepulangan) {
                Storage::disk('public')->delete($angkutanUmum->foto_timestamp_kepulangan);
            }
            $validated['foto_timestamp_kepulangan'] = $request->file('foto_timestamp_kepulangan')
                ->store('angkutan_umum/kepulangan', 'public');
        }

        $angkutanUmum->update($validated);

        return response()->json([
            'message' => 'Data angkutan umum berhasil diperbarui.',
            'angkutanUmum' => $angkutanUmum
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AngkutanUmum $angkutanUmum)
    {
        $user = Auth::user();

        // Check ownership for regular users
        if ($user->role === 'user' && $angkutanUmum->user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk menghapus data ini.'
            ], 403);
        }

        // Delete associated files
        if ($angkutanUmum->foto_timestamp_keberangkatan) {
            Storage::disk('public')->delete($angkutanUmum->foto_timestamp_keberangkatan);
        }
        if ($angkutanUmum->foto_timestamp_kepulangan) {
            Storage::disk('public')->delete($angkutanUmum->foto_timestamp_kepulangan);
        }

        $angkutanUmum->delete();

        return response()->json([
            'message' => 'Data angkutan umum berhasil dihapus.'
        ]);
    }

    /**
     * Export data to PDF with photos
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        // Superadmin always can export
        if ($user->role === 'superadmin') {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');

            $exporter = new AngkutanUmumPdfExport();
            return $exporter->export($dateFrom, $dateTo);
        }

        // Check download permission for all non-superadmin users
        if ($user->role !== 'superadmin') {
            $hasPermission = DownloadPermission::hasPermission($user->id, 'angkutan_umum');

            if (!$hasPermission) {
                return response()->json([
                    'message' => 'Anda tidak memiliki permission untuk download data angkutan umum.'
                ], 403);
            }
        }

        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $exporter = new AngkutanUmumPdfExport();
        return $exporter->export($dateFrom, $dateTo);
    }
}

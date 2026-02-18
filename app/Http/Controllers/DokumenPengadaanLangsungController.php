<?php

namespace App\Http\Controllers;

use App\Models\DokumenPengadaanLangsung;
use App\Models\Pengadaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DokumenPengadaanLangsungController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DokumenPengadaanLangsung::with('pengadaan');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('dokumen', 'like', "%{$search}%")
                    ->orWhere('nomor', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $dokumen = $query->orderBy('created_at', 'desc')->get();

        return response()->json($dokumen);
    }

    /**
     * Get all pengadaan for dropdown.
     */
    public function getPengadaan()
    {
        $pengadaan = Pengadaan::select('id', 'belanja_operasi', 'jenis_pengadaan')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($pengadaan);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pengadaan_id' => 'nullable|exists:pengadaan,id',
            'no' => 'nullable|integer',
            'dokumen' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:5120',
            'tanggal' => 'required|date',
            'nomor' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('dokumen_pengadaan', $filename, 'public');
            $validated['file'] = $path;
        }

        $dokumen = DokumenPengadaanLangsung::create($validated);
        $dokumen->load('pengadaan');

        return response()->json([
            'message' => 'Dokumen berhasil ditambahkan',
            'data' => $dokumen
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(DokumenPengadaanLangsung $dokumenPengadaanLangsung)
    {
        return response()->json($dokumenPengadaanLangsung);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DokumenPengadaanLangsung $dokumenPengadaanLangsung)
    {
        $validated = $request->validate([
            'pengadaan_id' => 'nullable|exists:pengadaan,id',
            'no' => 'nullable|integer',
            'dokumen' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:5120',
            'tanggal' => 'required|date',
            'nomor' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        // Handle file upload
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($dokumenPengadaanLangsung->file) {
                Storage::disk('public')->delete($dokumenPengadaanLangsung->file);
            }

            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('dokumen_pengadaan', $filename, 'public');
            $validated['file'] = $path;
        }

        $dokumenPengadaanLangsung->update($validated);
        $dokumenPengadaanLangsung->load('pengadaan');

        return response()->json([
            'message' => 'Dokumen berhasil diperbarui',
            'data' => $dokumenPengadaanLangsung
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DokumenPengadaanLangsung $dokumenPengadaanLangsung)
    {
        // Delete file if exists
        if ($dokumenPengadaanLangsung->file) {
            Storage::disk('public')->delete($dokumenPengadaanLangsung->file);
        }

        $dokumenPengadaanLangsung->delete();

        return response()->json([
            'message' => 'Dokumen berhasil dihapus'
        ]);
    }
}

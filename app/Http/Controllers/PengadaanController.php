<?php

namespace App\Http\Controllers;

use App\Models\Pengadaan;
use App\Models\User;
use Illuminate\Http\Request;

class PengadaanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pengadaan::with(['pptk', 'asn', 'nonAsn']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('belanja_operasi', 'like', "%{$search}%")
                    ->orWhere('jenis_pengadaan', 'like', "%{$search}%");
            });
        }

        $pengadaan = $query->orderBy('created_at', 'desc')->get();

        return response()->json($pengadaan);
    }

    /**
     * Get all users for dropdown.
     */
    public function getUsers()
    {
        $users = User::where('is_active', true)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($users);
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
            'belanja_operasi' => 'required|string|max:255',
            'jumlah_anggaran' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'jenis_pengadaan' => 'required|string|max:255',
            'pptk_id' => 'nullable|exists:users,id',
            'asn_id' => 'nullable|exists:users,id',
            'non_asn_id' => 'nullable|exists:users,id',
        ]);

        $pengadaan = Pengadaan::create($validated);
        $pengadaan->load(['pptk', 'asn', 'nonAsn']);

        return response()->json([
            'message' => 'Pengadaan berhasil ditambahkan',
            'data' => $pengadaan
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Pengadaan $pengadaan)
    {
        $pengadaan->load(['pptk', 'asn', 'nonAsn']);
        return response()->json($pengadaan);
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
    public function update(Request $request, Pengadaan $pengadaan)
    {
        $validated = $request->validate([
            'belanja_operasi' => 'required|string|max:255',
            'jumlah_anggaran' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'jenis_pengadaan' => 'required|string|max:255',
            'pptk_id' => 'nullable|exists:users,id',
            'asn_id' => 'nullable|exists:users,id',
            'non_asn_id' => 'nullable|exists:users,id',
        ]);

        $pengadaan->update($validated);
        $pengadaan->load(['pptk', 'asn', 'nonAsn']);

        return response()->json([
            'message' => 'Pengadaan berhasil diperbarui',
            'data' => $pengadaan
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pengadaan $pengadaan)
    {
        $pengadaan->delete();

        return response()->json([
            'message' => 'Pengadaan berhasil dihapus'
        ]);
    }
}

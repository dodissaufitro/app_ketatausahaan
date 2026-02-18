<?php

namespace App\Http\Controllers;

use App\Models\DokumenChecklistItem;
use App\Models\Pengadaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DokumenChecklistItemController extends Controller
{
    public function index($pengadaanId)
    {
        $items = DokumenChecklistItem::where('pengadaan_id', $pengadaanId)
            ->orderBy('kategori')
            ->orderBy('no_urut')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pengadaan_id' => 'required|exists:pengadaan,id',
            'kategori' => 'required|string',
            'no_urut' => 'required|integer',
            'nama_dokumen' => 'required|string',
            'pihak_penanggung_jawab' => 'required|string',
            'file_soft_copy' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
            'tanggal' => 'nullable|date',
            'nomor' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'is_conditional' => 'boolean',
            'conditional_note' => 'nullable|string',
        ]);

        if ($request->hasFile('file_soft_copy')) {
            $file = $request->file('file_soft_copy');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('dokumen_checklist', $filename, 'public');
            $validated['file_soft_copy'] = $path;
        }

        $item = DokumenChecklistItem::create($validated);

        return response()->json($item, 201);
    }

    public function update(Request $request, $id)
    {
        $item = DokumenChecklistItem::findOrFail($id);

        $validated = $request->validate([
            'file_soft_copy' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
            'tanggal' => 'nullable|date',
            'nomor' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        if ($request->hasFile('file_soft_copy')) {
            // Delete old file if exists
            if ($item->file_soft_copy) {
                Storage::disk('public')->delete($item->file_soft_copy);
            }

            $file = $request->file('file_soft_copy');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('dokumen_checklist', $filename, 'public');
            $validated['file_soft_copy'] = $path;
        } elseif ($request->has('file_soft_copy') && $request->file_soft_copy === null) {
            // If explicitly setting file to null, delete the old file
            if ($item->file_soft_copy) {
                Storage::disk('public')->delete($item->file_soft_copy);
            }
            $validated['file_soft_copy'] = null;
        }

        $item->update($validated);

        return response()->json($item);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'pengadaan_id' => 'required|exists:pengadaan,id',
            'items' => 'required|array',
            'items.*.kategori' => 'required|string',
            'items.*.no_urut' => 'required|integer',
            'items.*.nama_dokumen' => 'required|string',
            'items.*.pihak_penanggung_jawab' => 'required|string',
            'items.*.tanggal' => 'nullable|date',
            'items.*.nomor' => 'nullable|string',
            'items.*.keterangan' => 'nullable|string',
            'items.*.is_conditional' => 'boolean',
            'items.*.conditional_note' => 'nullable|string',
        ]);

        $pengadaanId = $validated['pengadaan_id'];
        $createdItems = [];

        foreach ($validated['items'] as $itemData) {
            $itemData['pengadaan_id'] = $pengadaanId;

            // Check if item already exists
            $existing = DokumenChecklistItem::where('pengadaan_id', $pengadaanId)
                ->where('kategori', $itemData['kategori'])
                ->where('no_urut', $itemData['no_urut'])
                ->first();

            if ($existing) {
                $existing->update($itemData);
                $createdItems[] = $existing;
            } else {
                $createdItems[] = DokumenChecklistItem::create($itemData);
            }
        }

        return response()->json($createdItems, 201);
    }

    public function uploadFile(Request $request, $id)
    {
        $item = DokumenChecklistItem::findOrFail($id);

        $validated = $request->validate([
            'file_soft_copy' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
        ]);

        // Delete old file if exists
        if ($item->file_soft_copy) {
            Storage::disk('public')->delete($item->file_soft_copy);
        }

        $file = $request->file('file_soft_copy');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('dokumen_checklist', $filename, 'public');

        $item->update(['file_soft_copy' => $path]);

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = DokumenChecklistItem::findOrFail($id);

        // Delete file if exists
        if ($item->file_soft_copy) {
            Storage::disk('public')->delete($item->file_soft_copy);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}

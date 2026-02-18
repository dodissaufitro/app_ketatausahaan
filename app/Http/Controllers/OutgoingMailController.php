<?php

namespace App\Http\Controllers;

use App\Models\OutgoingMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OutgoingMailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = OutgoingMail::query();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('mail_number', 'like', "%{$search}%")
                    ->orWhere('recipient', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $mails = $query->orderBy('sent_date', 'desc')->get();

        return response()->json($mails->map(function ($mail) {
            return [
                'id' => (string) $mail->id,
                'mailNumber' => $mail->mail_number,
                'recipient' => $mail->recipient,
                'subject' => $mail->subject,
                'sentDate' => $mail->sent_date->format('Y-m-d'),
                'category' => $mail->category,
                'priority' => $mail->priority,
                'status' => $mail->status,
                'description' => $mail->description,
                'attachmentUrl' => $mail->attachment_path ? Storage::url($mail->attachment_path) : null,
                'attachmentName' => $mail->attachment_name,
            ];
        }));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mail_number' => 'required|string|unique:outgoing_mails,mail_number',
            'recipient' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'sent_date' => 'required|date',
            'category' => 'required|in:official,invitation,notification,complaint,other',
            'priority' => 'required|in:high,medium,low',
            'status' => 'required|in:draft,sent,delivered,archived',
            'description' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
        ]);

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('outgoing-mails', 'public');
        }

        $mail = OutgoingMail::create([
            'mail_number' => $validated['mail_number'],
            'recipient' => $validated['recipient'],
            'subject' => $validated['subject'],
            'sent_date' => $validated['sent_date'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'description' => $validated['description'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        return response()->json([
            'message' => 'Surat keluar berhasil ditambahkan',
            'data' => $mail,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(OutgoingMail $outgoingMail)
    {
        return response()->json([
            'id' => (string) $outgoingMail->id,
            'mailNumber' => $outgoingMail->mail_number,
            'recipient' => $outgoingMail->recipient,
            'subject' => $outgoingMail->subject,
            'sentDate' => $outgoingMail->sent_date->format('Y-m-d'),
            'category' => $outgoingMail->category,
            'priority' => $outgoingMail->priority,
            'status' => $outgoingMail->status,
            'description' => $outgoingMail->description,
            'attachmentUrl' => $outgoingMail->attachment_path ? Storage::url($outgoingMail->attachment_path) : null,
            'attachmentName' => $outgoingMail->attachment_name,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OutgoingMail $outgoingMail)
    {
        $validated = $request->validate([
            'mail_number' => 'required|string|unique:outgoing_mails,mail_number,' . $outgoingMail->id,
            'recipient' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'sent_date' => 'required|date',
            'category' => 'required|in:official,invitation,notification,complaint,other',
            'priority' => 'required|in:high,medium,low',
            'status' => 'required|in:draft,sent,delivered,archived',
            'description' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
        ]);

        // Handle file upload
        if ($request->hasFile('attachment')) {
            // Delete old file
            if ($outgoingMail->attachment_path) {
                Storage::disk('public')->delete($outgoingMail->attachment_path);
            }

            $file = $request->file('attachment');
            $validated['attachment_name'] = $file->getClientOriginalName();
            $validated['attachment_path'] = $file->store('outgoing-mails', 'public');
        }

        $outgoingMail->update($validated);

        return response()->json([
            'message' => 'Surat keluar berhasil diupdate',
            'data' => $outgoingMail,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OutgoingMail $outgoingMail)
    {
        // Delete file if exists
        if ($outgoingMail->attachment_path) {
            Storage::disk('public')->delete($outgoingMail->attachment_path);
        }

        $outgoingMail->delete();

        return response()->json([
            'message' => 'Surat keluar berhasil dihapus',
        ]);
    }

    /**
     * Download attachment
     */
    public function download(OutgoingMail $outgoingMail)
    {
        if (!$outgoingMail->attachment_path) {
            return response()->json([
                'message' => 'File tidak tersedia',
            ], 404);
        }

        $path = storage_path('app/public/' . $outgoingMail->attachment_path);

        if (!file_exists($path)) {
            return response()->json([
                'message' => 'File tidak ditemukan',
            ], 404);
        }

        return response()->download($path, $outgoingMail->attachment_name);
    }
}

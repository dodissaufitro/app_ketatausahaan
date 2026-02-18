<?php

namespace App\Http\Controllers;

use App\Models\IncomingMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IncomingMailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = IncomingMail::query();

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
                    ->orWhere('sender', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $mails = $query->orderBy('received_date', 'desc')->get();

        return response()->json($mails->map(function ($mail) {
            return [
                'id' => (string) $mail->id,
                'mailNumber' => $mail->mail_number,
                'sender' => $mail->sender,
                'subject' => $mail->subject,
                'receivedDate' => $mail->received_date->format('Y-m-d'),
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
            'mail_number' => 'required|string|unique:incoming_mails,mail_number',
            'sender' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'received_date' => 'required|date',
            'category' => 'required|in:official,invitation,notification,complaint,other',
            'priority' => 'required|in:high,medium,low',
            'status' => 'required|in:unread,read,processed,archived',
            'description' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
        ]);

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('incoming-mails', 'public');
        }

        $mail = IncomingMail::create([
            'mail_number' => $validated['mail_number'],
            'sender' => $validated['sender'],
            'subject' => $validated['subject'],
            'received_date' => $validated['received_date'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'description' => $validated['description'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        return response()->json([
            'message' => 'Surat masuk berhasil ditambahkan',
            'data' => $mail,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(IncomingMail $incomingMail)
    {
        return response()->json([
            'id' => (string) $incomingMail->id,
            'mailNumber' => $incomingMail->mail_number,
            'sender' => $incomingMail->sender,
            'subject' => $incomingMail->subject,
            'receivedDate' => $incomingMail->received_date->format('Y-m-d'),
            'category' => $incomingMail->category,
            'priority' => $incomingMail->priority,
            'status' => $incomingMail->status,
            'description' => $incomingMail->description,
            'attachmentUrl' => $incomingMail->attachment_path ? Storage::url($incomingMail->attachment_path) : null,
            'attachmentName' => $incomingMail->attachment_name,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, IncomingMail $incomingMail)
    {
        $validated = $request->validate([
            'mail_number' => 'required|string|unique:incoming_mails,mail_number,' . $incomingMail->id,
            'sender' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'received_date' => 'required|date',
            'category' => 'required|in:official,invitation,notification,complaint,other',
            'priority' => 'required|in:high,medium,low',
            'status' => 'required|in:unread,read,processed,archived',
            'description' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
        ]);

        // Handle file upload
        if ($request->hasFile('attachment')) {
            // Delete old file
            if ($incomingMail->attachment_path) {
                Storage::disk('public')->delete($incomingMail->attachment_path);
            }

            $file = $request->file('attachment');
            $validated['attachment_name'] = $file->getClientOriginalName();
            $validated['attachment_path'] = $file->store('incoming-mails', 'public');
        }

        $incomingMail->update($validated);

        return response()->json([
            'message' => 'Surat masuk berhasil diupdate',
            'data' => $incomingMail,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IncomingMail $incomingMail)
    {
        // Delete file if exists
        if ($incomingMail->attachment_path) {
            Storage::disk('public')->delete($incomingMail->attachment_path);
        }

        $incomingMail->delete();

        return response()->json([
            'message' => 'Surat masuk berhasil dihapus',
        ]);
    }

    /**
     * Download attachment
     */
    public function download(IncomingMail $incomingMail)
    {
        if (!$incomingMail->attachment_path) {
            return response()->json([
                'message' => 'File tidak tersedia',
            ], 404);
        }

        if (!Storage::disk('public')->exists($incomingMail->attachment_path)) {
            return response()->json([
                'message' => 'File tidak ditemukan',
            ], 404);
        }

        return Storage::disk('public')->download(
            $incomingMail->attachment_path,
            $incomingMail->attachment_name
        );
    }
}

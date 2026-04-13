<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Leave::with('employee');

        // If user doesn't have manage_leaves permission, only show their own leaves
        if (!$user->hasPermission('manage_leaves')) {
            // Use direct user_id relationship first, fallback to email
            $ownEmployee = $user->employee ?? \App\Models\Employee::where('email', $user->email)->first();
            if (!$ownEmployee) {
                return response()->json([]);
            }
            $query->where('employee_id', $ownEmployee->id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by employee (only if user has manage_leaves permission)
        if ($request->has('employee_id') && $user->hasPermission('manage_leaves')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $leaves = $query->orderBy('applied_date', 'desc')->get();

        // Transform data to match frontend expectations
        $transformed = $leaves->map(function ($leave) {
            return [
                'id' => (string) $leave->id,
                'employeeId' => $leave->employee->employee_id ?? '',
                'employeeName' => $leave->employee->name ?? '',
                'type' => $leave->type,
                'startDate' => $leave->start_date->format('Y-m-d'),
                'endDate' => $leave->end_date->format('Y-m-d'),
                'reason' => $leave->reason,
                'status' => $leave->status,
                'appliedDate' => $leave->applied_date->format('Y-m-d'),
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'type' => 'required|in:annual,sick,personal,maternity,paternity',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'applied_date' => 'nullable|date',
        ]);

        // If employee_id is not provided, find employee by user relationship
        if (!isset($validated['employee_id']) || empty($validated['employee_id'])) {
            $employee = $user->employee ?? \App\Models\Employee::where('email', $user->email)->first();

            if (!$employee) {
                return response()->json([
                    'message' => 'Data karyawan tidak ditemukan untuk user ini. Silakan hubungi admin.'
                ], 404);
            }

            $validated['employee_id'] = $employee->id;
        }

        // Set default values
        $validated['status'] = $validated['status'] ?? 'pending';
        $validated['applied_date'] = $validated['applied_date'] ?? now()->format('Y-m-d');

        $leave = Leave::create($validated);

        // If leave is approved on creation, create attendance records
        if ($leave->status === 'approved') {
            $leave->createAttendanceRecords();
        }

        return response()->json($leave->load('employee'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $leave = Leave::with('employee')->findOrFail($id);

        // If user doesn't have manage_leaves permission, verify they own this leave
        if (!$user->hasPermission('manage_leaves')) {
            $ownEmployee = $user->employee ?? \App\Models\Employee::where('email', $user->email)->first();
            if (!$ownEmployee || $leave->employee_id !== $ownEmployee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($leave);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $leave = Leave::with('employee')->findOrFail($id);

        // If user doesn't have manage_leaves permission, verify they own this leave
        if (!$user->hasPermission('manage_leaves')) {
            if (!$leave->employee || $leave->employee->email !== $user->email) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $previousStatus = $leave->status;

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|in:annual,sick,personal,maternity,paternity',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'status' => 'required|in:pending,approved,rejected',
            'applied_date' => 'nullable|date',
        ]);

        $leave->update($validated);

        // Handle status changes
        if ($previousStatus !== 'approved' && $leave->status === 'approved') {
            // Create attendance records when leave is approved
            $leave->createAttendanceRecords();
        } elseif ($previousStatus === 'approved' && $leave->status === 'rejected') {
            // Delete attendance records when leave is rejected
            $leave->deleteAttendanceRecords();
        }

        return response()->json($leave->load('employee'));
    }

    /**
     * Approve a leave request
     */
    public function approve(Request $request, string $id)
    {
        $user = $request->user();

        // Only users with manage_leaves permission can approve
        if (!$user->hasPermission('manage_leaves')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $leave = Leave::findOrFail($id);
        $leave->update(['status' => 'approved']);
        $leave->createAttendanceRecords();

        return response()->json([
            'message' => 'Leave approved and attendance records created',
            'leave' => $leave->load('employee')
        ]);
    }

    /**
     * Reject a leave request
     */
    public function reject(Request $request, string $id)
    {
        $user = $request->user();

        // Only users with manage_leaves permission can reject
        if (!$user->hasPermission('manage_leaves')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $leave = Leave::findOrFail($id);
        $previousStatus = $leave->status;
        $leave->update(['status' => 'rejected']);

        // Delete attendance records if previously approved
        if ($previousStatus === 'approved') {
            $leave->deleteAttendanceRecords();
        }

        return response()->json([
            'message' => 'Leave rejected',
            'leave' => $leave->load('employee')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $leave = Leave::with('employee')->findOrFail($id);

        // If user doesn't have manage_leaves permission, verify they own this leave
        if (!$user->hasPermission('manage_leaves')) {
            if (!$leave->employee || $leave->employee->email !== $user->email) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }


        // Delete related attendance records if leave was approved
        if ($leave->status === 'approved') {
            $leave->deleteAttendanceRecords();
        }

        $leave->delete();
        return response()->json(['message' => 'Leave deleted successfully']);
    }
}

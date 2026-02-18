<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Services\X601AttendanceService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Attendance::with('employee');

        // Filter by date
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $attendances = $query->orderBy('date', 'desc')->orderBy('check_in', 'desc')->get();

        // Transform data to match frontend expectations
        $transformed = $attendances->map(function ($attendance) {
            return [
                'id' => (string) $attendance->id,
                'employeeId' => $attendance->employee->employee_id ?? '',
                'employeeName' => $attendance->employee->name ?? '',
                'date' => $attendance->date->format('Y-m-d'),
                'checkIn' => $attendance->check_in ?? '',
                'checkOut' => $attendance->check_out ?? '',
                'status' => $attendance->status,
                'workHours' => (float) $attendance->work_hours,
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,late,absent,half-day',
            'work_hours' => 'nullable|numeric|min:0|max:24',
        ]);

        // Calculate work hours if not provided
        if (!isset($validated['work_hours']) && isset($validated['check_in']) && isset($validated['check_out'])) {
            $checkIn = Carbon::createFromFormat('H:i', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('H:i', $validated['check_out']);
            $validated['work_hours'] = $checkOut->diffInHours($checkIn, true);
        }

        $attendance = Attendance::create($validated);
        return response()->json($attendance->load('employee'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $attendance = Attendance::with('employee')->findOrFail($id);
        return response()->json($attendance);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $attendance = Attendance::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,late,absent,half-day',
            'work_hours' => 'nullable|numeric|min:0|max:24',
        ]);

        // Calculate work hours if not provided
        if (!isset($validated['work_hours']) && isset($validated['check_in']) && isset($validated['check_out'])) {
            $checkIn = Carbon::createFromFormat('H:i', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('H:i', $validated['check_out']);
            $validated['work_hours'] = $checkOut->diffInHours($checkIn, true);
        }

        $attendance->update($validated);
        return response()->json($attendance->load('employee'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();
        return response()->json(['message' => 'Attendance deleted successfully']);
    }

    /**
     * Sync attendance data from X601 machine
     */
    public function syncFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'employee_id' => 'nullable|string',
        ]);

        $result = $service->syncAttendance(
            $validated['date'] ?? null,
            $validated['employee_id'] ?? null
        );

        if (!empty($result['errors'])) {
            return response()->json($result, 207); // Multi-Status
        }

        return response()->json($result);
    }

    /**
     * Fetch attendance data directly from X601 machine (preview before sync)
     */
    public function fetchFromX601(Request $request, X601AttendanceService $service)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'employee_id' => 'nullable|string',
        ]);

        $data = $service->fetchFromMachine(
            $validated['date'] ?? null,
            $validated['employee_id'] ?? null
        );

        return response()->json(['data' => $data]);
    }
}

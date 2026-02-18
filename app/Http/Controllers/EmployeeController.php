<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = Employee::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($employees);
    }

    /**
     * Get the next employee ID
     */
    public function getNextId()
    {
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        if ($lastEmployee && preg_match('/EMP(\d+)/', $lastEmployee->employee_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        } else {
            $nextNumber = 1;
        }
        $nextId = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        return response()->json(['next_id' => $nextId]);
    }

    /**
     * Get list of users that are not yet employees
     */
    public function getAvailableUsers()
    {
        $userIds = Employee::pluck('user_id')->toArray();
        $availableUsers = User::whereNotIn('id', $userIds)
            ->where('is_active', true)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($availableUsers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:employees',
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'department' => 'required|string',
            'position' => 'required|string',
            'join_date' => 'required|date',
            'status' => 'nullable|in:active,inactive,on-leave',
            'salary' => 'required|numeric|min:0',
            'avatar' => 'nullable|string',
        ]);

        // Auto-generate employee_id
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        if ($lastEmployee && preg_match('/EMP(\d+)/', $lastEmployee->employee_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        } else {
            $nextNumber = 1;
        }
        $validated['employee_id'] = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $employee = Employee::create($validated);
        return response()->json($employee->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        return response()->json($employee->load('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'department' => 'required|string',
            'position' => 'required|string',
            'join_date' => 'required|date',
            'status' => 'nullable|in:active,inactive,on-leave',
            'salary' => 'required|numeric|min:0',
            'avatar' => 'nullable|string',
        ]);

        $employee->update($validated);
        return response()->json($employee->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(['message' => 'Employee deleted successfully']);
    }
}

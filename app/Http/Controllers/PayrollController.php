<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PayrollController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Payroll::with('employee');

        // If user doesn't have manage_payrolls permission, only show their own payroll
        if (!$user->hasPermission('manage_payrolls')) {
            // Use direct user_id relationship first, fallback to email
            $ownEmployee = $user->employee ?? \App\Models\Employee::where('email', $user->email)->first();
            if (!$ownEmployee) {
                return response()->json([]);
            }
            $query->where('employee_id', $ownEmployee->id);
        }

        // Filter by month
        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by employee (only if user has manage_payrolls permission)
        if ($request->has('employee_id') && $user->hasPermission('manage_payrolls')) {
            $query->where('employee_id', $request->employee_id);
        }

        $payrolls = $query->orderBy('month', 'desc')->get();

        // Transform data to match frontend expectations
        $transformed = $payrolls->map(function ($payroll) {
            return [
                'id' => (string) $payroll->id,
                'employeeId' => $payroll->employee->employee_id ?? '',
                'employeeName' => $payroll->employee->name ?? '',
                'month' => $payroll->month,
                'baseSalary' => (float) $payroll->base_salary,
                'allowances' => (float) $payroll->allowances,
                'deductions' => (float) $payroll->deductions,
                'lateDeductions' => (float) $payroll->late_deductions,
                'lateCount' => $payroll->late_count,
                'lateHours' => (float) $payroll->late_hours,
                'absentCount' => $payroll->absent_count,
                'absentDeductions' => (float) $payroll->absent_deductions,
                'netSalary' => (float) $payroll->net_salary,
                'status' => $payroll->status,
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
            'month' => 'required|date_format:Y-m',
            'base_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,processed,paid',
        ]);

        // Calculate late deductions automatically
        $lateData = Payroll::calculateLateDeductions($validated['employee_id'], $validated['month']);

        $validated['late_count'] = $lateData['late_count'];
        $validated['late_hours'] = $lateData['late_hours'];
        $validated['late_deductions'] = $lateData['late_deductions'];
        $validated['allowances'] = $validated['allowances'] ?? 0;
        $validated['deductions'] = $validated['deductions'] ?? 0;
        $validated['status'] = $validated['status'] ?? 'pending';

        // Calculate net salary
        $validated['net_salary'] = $validated['base_salary']
            + $validated['allowances']
            - $validated['deductions']
            - $validated['late_deductions'];

        $payroll = Payroll::create($validated);
        return response()->json($payroll->load('employee'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $payroll = Payroll::with('employee')->findOrFail($id);
        return response()->json($payroll);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $payroll = Payroll::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|date_format:Y-m',
            'base_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,processed,paid',
        ]);

        // Recalculate late deductions
        $lateData = Payroll::calculateLateDeductions($validated['employee_id'], $validated['month']);

        $validated['late_count'] = $lateData['late_count'];
        $validated['late_hours'] = $lateData['late_hours'];
        $validated['late_deductions'] = $lateData['late_deductions'];
        $validated['allowances'] = $validated['allowances'] ?? 0;
        $validated['deductions'] = $validated['deductions'] ?? 0;

        // Calculate net salary
        $validated['net_salary'] = $validated['base_salary']
            + $validated['allowances']
            - $validated['deductions']
            - $validated['late_deductions'];

        $payroll->update($validated);
        return response()->json($payroll->load('employee'));
    }

    /**
     * Process payroll for a specific month
     */
    public function process(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|date_format:Y-m',
        ]);

        $payroll = Payroll::processPayroll($validated['employee_id'], $validated['month']);

        if (!$payroll) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $payroll->update(['status' => 'processed']);

        return response()->json([
            'message' => 'Payroll processed successfully',
            'payroll' => $payroll->load('employee')
        ]);
    }

    /**
     * Process payroll for all employees in a month
     */
    public function processAll(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $employees = Employee::where('status', 'active')->get();
        $processed = [];

        foreach ($employees as $employee) {
            $payroll = Payroll::processPayroll($employee->id, $validated['month']);
            if ($payroll) {
                $payroll->update(['status' => 'processed']);
                $processed[] = $payroll;
            }
        }

        return response()->json([
            'message' => 'Payroll processed for all employees',
            'count' => count($processed),
            'payrolls' => $processed
        ]);
    }

    /**
     * Mark payroll as paid
     */
    public function markAsPaid(string $id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->update(['status' => 'paid']);

        return response()->json([
            'message' => 'Payroll marked as paid',
            'payroll' => $payroll->load('employee')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();
        return response()->json(['message' => 'Payroll deleted successfully']);
    }
}

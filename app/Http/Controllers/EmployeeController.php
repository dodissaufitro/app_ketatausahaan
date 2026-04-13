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
            'user_id' => 'nullable|exists:users,id|unique:employees',
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string',
            'department' => 'required|string',
            'position' => 'required|string',
            'join_date' => 'required|date',
            'status' => 'nullable|in:active,inactive,on-leave',
            'salary' => 'required|numeric|min:0',
            'avatar' => 'nullable|string',
            'username' => 'nullable|string|unique:users,email',
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|in:superadmin,admin,user,employee',
            'user_role_id' => 'nullable|exists:user_roles,id',
        ]);

        // Jika user_id tidak diberikan, buat user baru otomatis
        if (!isset($validated['user_id']) || empty($validated['user_id'])) {
            // Generate username dari email jika tidak diberikan
            $username = $validated['username'] ?? $validated['email'];

            // Generate password default jika tidak diberikan
            $password = $validated['password'] ?? '12344321'; // Default password

            // Gunakan role dari request, default ke 'employee'
            $userRole = $validated['role'] ?? 'employee';

            // Buat user baru
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($password),
                'role' => $userRole,
                'user_role_id' => $validated['user_role_id'] ?? null,
                'is_active' => true,
            ]);

            $validated['user_id'] = $user->id;
        }

        // Auto-generate employee_id
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        if ($lastEmployee && preg_match('/EMP(\d+)/', $lastEmployee->employee_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        } else {
            $nextNumber = 1;
        }
        $validated['employee_id'] = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        // Hapus field yang tidak ada di tabel employees
        unset($validated['username'], $validated['password'], $validated['user_role_id'], $validated['role']);

        $employee = Employee::create($validated);
        return response()->json([
            'employee' => $employee->load('user'),
            'message' => 'Karyawan dan user berhasil ditambahkan',
            'default_password' => !$request->has('password') ? '12344321' : null,
        ], 201);
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
            'user_id' => 'nullable|exists:users,id|unique:employees,user_id,' . $employee->id,
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

    /**
     * Sync users from the users table into employees table.
     * - If a user's email matches an existing employee without user_id, link them.
     * - Otherwise, create a new employee record for the user.
     * Also syncs employees without user_id: create a user account (role: user) for them.
     */
    public function syncFromUsers(Request $request)
    {
        $linked = 0;
        $employeeCreated = 0;
        $userCreated = 0;
        $details = [];

        // --- Direction 1: Users → Employees ---
        $linkedUserIds = Employee::whereNotNull('user_id')->pluck('user_id')->toArray();
        $users = User::whereNotIn('id', $linkedUserIds)->get();

        foreach ($users as $user) {
            $employee = Employee::where('email', $user->email)->whereNull('user_id')->first();

            if ($employee) {
                $employee->update(['user_id' => $user->id]);
                $linked++;
                $details[] = ['action' => 'linked', 'name' => $user->name, 'email' => $user->email];
            } else {
                $lastEmployee = Employee::orderBy('id', 'desc')->first();
                if ($lastEmployee && preg_match('/EMP(\d+)/', $lastEmployee->employee_id, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = 1;
                }
                $employeeId = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

                Employee::create([
                    'user_id'     => $user->id,
                    'employee_id' => $employeeId,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'phone'       => '-',
                    'department'  => '-',
                    'position'    => '-',
                    'join_date'   => now()->format('Y-m-d'),
                    'status'      => 'active',
                    'salary'      => 0,
                ]);
                $employeeCreated++;
                $details[] = ['action' => 'employee_created', 'name' => $user->name, 'email' => $user->email];
            }
        }

        // --- Direction 2: Employees → Users ---
        $employeesWithoutUser = Employee::whereNull('user_id')->get();

        foreach ($employeesWithoutUser as $employee) {
            // Check if a user with matching email already exists
            $existingUser = User::where('email', $employee->email)->first();

            if ($existingUser) {
                // Link them directly
                $employee->update(['user_id' => $existingUser->id]);
                $linked++;
                $details[] = ['action' => 'linked', 'name' => $employee->name, 'email' => $employee->email];
            } else {
                // Create a new user with role 'user' and default password
                $newUser = User::create([
                    'name'      => $employee->name,
                    'email'     => $employee->email,
                    'password'  => bcrypt('12344321'),
                    'role'      => 'user',
                    'is_active' => true,
                ]);
                $employee->update(['user_id' => $newUser->id]);
                $userCreated++;
                $details[] = ['action' => 'user_created', 'name' => $employee->name, 'email' => $employee->email];
            }
        }

        return response()->json([
            'message'          => "Sinkronisasi selesai: $linked ditautkan, $employeeCreated karyawan baru dibuat, $userCreated akun user baru dibuat.",
            'linked'           => $linked,
            'employee_created' => $employeeCreated,
            'user_created'     => $userCreated,
            'details'          => $details,
        ]);
    }

    /**
     * Preview what will be synced (no changes made).
     */
    public function syncPreview()
    {
        $linkedUserIds = Employee::whereNotNull('user_id')->pluck('user_id')->toArray();
        $unlinkedUsers = User::whereNotIn('id', $linkedUserIds)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        $unlinkedEmployees = Employee::whereNull('user_id')
            ->select('id', 'employee_id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'unlinked_users'      => $unlinkedUsers,
            'unlinked_employees'  => $unlinkedEmployees,
        ]);
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserRoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = UserRole::withCount('users');

        // Filter by status
        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $roles = $query->orderBy('created_at', 'desc')->get();

        return response()->json($roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'displayName' => $role->display_name,
                'description' => $role->description,
                'permissions' => $role->permissions,
                'isActive' => $role->is_active,
                'usersCount' => $role->users_count,
                'createdAt' => $role->created_at->format('Y-m-d H:i:s'),
            ];
        }));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:user_roles,name',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'is_active' => 'boolean',
        ]);

        $role = UserRole::create($validated);

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $role = UserRole::withCount('users')->findOrFail($id);

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'displayName' => $role->display_name,
            'description' => $role->description,
            'permissions' => $role->permissions,
            'isActive' => $role->is_active,
            'usersCount' => $role->users_count,
            'createdAt' => $role->created_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $role = UserRole::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('user_roles')->ignore($role->id)],
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'is_active' => 'boolean',
        ]);

        $role->update($validated);

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $role = UserRole::withCount('users')->findOrFail($id);

        // Prevent deleting role if it has users
        if ($role->users_count > 0) {
            return response()->json([
                'message' => 'Cannot delete role with assigned users. Please reassign users first.',
            ], 403);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }

    /**
     * Get available permissions list
     */
    public function getPermissions()
    {
        $permissions = [
            'manage_users' => 'Manage Users',
            'manage_roles' => 'Manage Roles',
            'manage_employees' => 'Manage Employees',
            'manage_agendas' => 'Manage Agendas',
            'manage_attendances' => 'Manage Attendances',
            'manage_leaves' => 'Manage Leaves',
            'manage_payrolls' => 'Manage Payrolls',
            'manage_incoming_mails' => 'Manage Incoming Mails',
            'manage_outgoing_mails' => 'Manage Outgoing Mails',
            'manage_pengadaan' => 'Manage Pengadaan',
            'manage_dokumen_pengadaan' => 'Manage Dokumen Pengadaan',
            'view_dashboard' => 'View Dashboard',
            'view_reports' => 'View Reports',
            'export_data' => 'Export Data',
            'view_own_attendance' => 'View Own Attendance',
            'view_own_leave' => 'View Own Leave',
            'view_own_payroll' => 'View Own Payroll',
            'submit_leave_request' => 'Submit Leave Request',
        ];

        return response()->json($permissions);
    }
}

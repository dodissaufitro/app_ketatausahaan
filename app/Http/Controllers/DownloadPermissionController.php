<?php

namespace App\Http\Controllers;

use App\Models\DownloadPermission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DownloadPermissionController extends Controller
{
    /**
     * Get all users with their download permissions
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Only superadmin can manage permissions
        if ($user->role !== 'superadmin') {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        $module = $request->get('module', 'angkutan_umum');

        $users = User::where('role', '!=', 'superadmin')
            ->where('is_active', true)
            ->with(['downloadPermissions' => function ($query) use ($module) {
                $query->where('module', $module);
            }, 'userRole'])
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(function ($user) use ($module) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_display' => $user->userRole?->display_name ?? ucfirst($user->role),
                    'can_download' => $user->downloadPermissions->first()
                        ? $user->downloadPermissions->first()->can_download
                        : false
                ];
            });

        return response()->json(['users' => $users]);
    }

    /**
     * Update download permission for a user
     */
    public function updatePermission(Request $request)
    {
        $user = Auth::user();

        // Only superadmin can manage permissions
        if ($user->role !== 'superadmin') {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'module' => 'required|string',
            'can_download' => 'required|boolean'
        ]);

        DownloadPermission::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'module' => $validated['module']
            ],
            [
                'can_download' => $validated['can_download'],
                'granted_by' => $user->id
            ]
        );

        return response()->json([
            'message' => 'Permission updated successfully'
        ]);
    }

    /**
     * Check if current user can download for specific module
     */
    public function checkPermission(Request $request)
    {
        $user = Auth::user();
        $module = $request->get('module', 'angkutan_umum');

        // Superadmin always can download
        if ($user->role === 'superadmin') {
            return response()->json(['can_download' => true]);
        }

        // Check permission for admin and regular users
        $hasPermission = DownloadPermission::hasPermission($user->id, $module);

        return response()->json(['can_download' => $hasPermission]);
    }
}

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

// Debug endpoint - TEMPORARY untuk troubleshooting
Route::get('/api/debug-user', function () {
    if (!Auth::check()) {
        return response()->json(['error' => 'Not authenticated']);
    }

    $user = Auth::user();
    $user->load('userRole');

    return response()->json([
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'user_role' => $user->role,
        'user_role_id' => $user->user_role_id,
        'user_role_object' => $user->userRole,
        'permissions_from_getPermissions' => $user->getPermissions(),
        'has_manage_incoming_mails' => $user->hasPermission('manage_incoming_mails'),
        'has_manage_outgoing_mails' => $user->hasPermission('manage_outgoing_mails'),
        'raw_permissions_from_user_role' => $user->userRole?->permissions,
    ], 200, [], JSON_PRETTY_PRINT);
});

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\LoginAttempt;

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
})->middleware('web');

// Debug: cek session ID dan status blocking dari browser
Route::get('/api/debug/session', function () {
    return response()->json([
        'session_id'     => session()->getId(),
        'login_attempts' => LoginAttempt::orderBy('updated_at', 'desc')->limit(10)->get(),
    ]);
})->middleware('web');

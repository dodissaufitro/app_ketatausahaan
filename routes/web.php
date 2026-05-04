<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\IncomingMailController;
use App\Http\Controllers\OutgoingMailController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DokumenPengadaanLangsungController;
use App\Http\Controllers\PengadaanController;
use App\Http\Controllers\DokumenChecklistItemController;
use App\Http\Controllers\AngkutanUmumController;
use App\Http\Controllers\DownloadPermissionController;

// API Routes for Employees
Route::prefix('api')->group(function () {
    // Public auth route
    Route::get('/user', function () {
        if (!Auth::check()) {
            return response()->json(['user' => null]);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();
        // Force fresh load of user role to get latest permissions
        $user->load(['userRole' => function ($query) {
            $query->select('id', 'name', 'display_name', 'permissions', 'is_active');
        }, 'employee' => function ($query) {
            $query->select('id', 'user_id', 'name', 'position');
        }]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'userRoleId' => $user->user_role_id,
                'userRoleName' => $user->userRole?->display_name,
                'permissions' => $user->getPermissions(),
                'isActive' => $user->is_active,
                'employee' => $user->employee ? [
                    'name' => $user->employee->name,
                    'position' => $user->employee->position,
                ] : null,
            ],
        ]);
    });

    // Dashboard route
    Route::middleware(['auth:web'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });

    // User Management Routes (Superadmin only)
    Route::middleware(['auth:web', 'role:superadmin'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);

        // User Role Routes
        Route::get('/user-roles', [UserRoleController::class, 'index']);
        Route::post('/user-roles', [UserRoleController::class, 'store']);
        Route::get('/user-roles/{userRole}', [UserRoleController::class, 'show']);
        Route::put('/user-roles/{userRole}', [UserRoleController::class, 'update']);
        Route::delete('/user-roles/{userRole}', [UserRoleController::class, 'destroy']);
        Route::get('/permissions', [UserRoleController::class, 'getPermissions']);
    });

    // Protected routes with auth middleware
    Route::middleware(['auth:web'])->group(function () {
        // Employee Routes - require manage_employees permission
        Route::middleware(['permission:manage_employees'])->group(function () {
            Route::get('/employees', [EmployeeController::class, 'index']);
            Route::get('/employees/next-id/get', [EmployeeController::class, 'getNextId']);
            Route::get('/employees/available-users/list', [EmployeeController::class, 'getAvailableUsers']);
            Route::get('/employees/sync-preview', [EmployeeController::class, 'syncPreview']);
            Route::post('/employees/sync-from-users', [EmployeeController::class, 'syncFromUsers']);
            Route::post('/employees', [EmployeeController::class, 'store']);
            Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
            Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
            Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy']);
        });

        // Agenda Routes - require manage_agendas permission
        Route::middleware(['permission:manage_agendas'])->group(function () {
            Route::get('/agendas', [AgendaController::class, 'index']);
            Route::get('/agendas/{agenda}', [AgendaController::class, 'show']);
        });

        // Agenda management (superadmin only)
        Route::middleware(['role:superadmin'])->group(function () {
            Route::post('/agendas', [AgendaController::class, 'store']);
            Route::put('/agendas/{agenda}', [AgendaController::class, 'update']);
            Route::delete('/agendas/{agenda}', [AgendaController::class, 'destroy']);
        });

        // Attendance export - accessible by all authenticated users
        Route::get('/attendances/export-excel', [AttendanceController::class, 'exportExcel']);
        Route::get('/attendances/export-monthly', [AttendanceController::class, 'exportMonthly']);

        // Attendance Routes - require manage_attendances or view_own_attendance permission
        Route::middleware(['permission:manage_attendances,view_own_attendance'])->group(function () {
            Route::get('/attendances', [AttendanceController::class, 'index']);
            Route::get('/attendances/{attendance}', [AttendanceController::class, 'show']);
            Route::get('/attendances/fetch-x601/users', [AttendanceController::class, 'fetchUsersFromX601']);
            Route::get('/attendances/fetch-x601/preview', [AttendanceController::class, 'fetchFromX601']);
            Route::get('/attendances/connect-x601', [AttendanceController::class, 'connectX601']);
            Route::get('/x601-dashboard', [AttendanceController::class, 'x601Dashboard']);
            Route::get('/attendances/monthly-summary', [AttendanceController::class, 'monthlySummary']);
        });

        // Attendance write/management Routes - require manage_attendances only
        Route::middleware(['permission:manage_attendances'])->group(function () {
            Route::post('/attendances', [AttendanceController::class, 'store']);
            Route::put('/attendances/{attendance}', [AttendanceController::class, 'update']);
            Route::delete('/attendances/{attendance}', [AttendanceController::class, 'destroy']);
            Route::post('/attendances/sync-x601/manual', [AttendanceController::class, 'syncFromX601']);
            Route::post('/attendances/sync-x601/comprehensive', [AttendanceController::class, 'comprehensiveSyncFromX601']);
            Route::post('/attendances/sync-x601/checkout', [AttendanceController::class, 'syncCheckoutFromX601']);
            Route::post('/attendances/sync-x601/users', [AttendanceController::class, 'syncUsersFromX601']);
            Route::post('/attendances/mark-absent', [AttendanceController::class, 'markAbsent']);
            Route::get('/attendances/debug-x601/raw', [AttendanceController::class, 'debugRawX601']);
        });

        // Leave Routes - allow manage_leaves, view_own_leave, submit_leave_request permissions
        Route::middleware(['permission:manage_leaves,view_own_leave,submit_leave_request'])->group(function () {
            Route::get('/leaves', [LeaveController::class, 'index']);
            Route::get('/leaves/{leave}', [LeaveController::class, 'show']);
            Route::post('/leaves', [LeaveController::class, 'store']); // Submit leave request
        });

        // Leave management actions - only for manage_leaves permission
        Route::middleware(['permission:manage_leaves'])->group(function () {
            Route::put('/leaves/{leave}', [LeaveController::class, 'update']);
            Route::delete('/leaves/{leave}', [LeaveController::class, 'destroy']);
            Route::post('/leaves/{leave}/approve', [LeaveController::class, 'approve']);
            Route::post('/leaves/{leave}/reject', [LeaveController::class, 'reject']);
        });

        // Payroll Routes - allow both manage_payrolls and view_own_payroll permissions
        Route::middleware(['permission:manage_payrolls,view_own_payroll'])->group(function () {
            Route::get('/payrolls', [PayrollController::class, 'index']);
            Route::get('/payrolls/{payroll}', [PayrollController::class, 'show']);
        });

        // Payroll management actions - only for manage_payrolls permission
        Route::middleware(['permission:manage_payrolls'])->group(function () {
            Route::post('/payrolls', [PayrollController::class, 'store']);
            Route::put('/payrolls/{payroll}', [PayrollController::class, 'update']);
            Route::delete('/payrolls/{payroll}', [PayrollController::class, 'destroy']);
            Route::post('/payrolls/process', [PayrollController::class, 'process']);
            Route::post('/payrolls/process-all', [PayrollController::class, 'processAll']);
            Route::post('/payrolls/{payroll}/mark-as-paid', [PayrollController::class, 'markAsPaid']);
        });

        // Incoming Mail Routes - require manage_incoming_mails permission
        Route::middleware(['permission:manage_incoming_mails'])->group(function () {
            Route::get('/incoming-mails', [IncomingMailController::class, 'index']);
            Route::post('/incoming-mails', [IncomingMailController::class, 'store']);
            Route::get('/incoming-mails/{incomingMail}', [IncomingMailController::class, 'show']);
            Route::put('/incoming-mails/{incomingMail}', [IncomingMailController::class, 'update']);
            Route::delete('/incoming-mails/{incomingMail}', [IncomingMailController::class, 'destroy']);
            Route::get('/incoming-mails/{incomingMail}/download', [IncomingMailController::class, 'download']);
        });

        // Outgoing Mail Routes - require manage_outgoing_mails permission
        Route::middleware(['permission:manage_outgoing_mails'])->group(function () {
            Route::get('/outgoing-mails', [OutgoingMailController::class, 'index']);
            Route::post('/outgoing-mails', [OutgoingMailController::class, 'store']);
            Route::get('/outgoing-mails/{outgoingMail}', [OutgoingMailController::class, 'show']);
            Route::put('/outgoing-mails/{outgoingMail}', [OutgoingMailController::class, 'update']);
            Route::delete('/outgoing-mails/{outgoingMail}', [OutgoingMailController::class, 'destroy']);
            Route::get('/outgoing-mails/{outgoingMail}/download', [OutgoingMailController::class, 'download']);
        });

        // Dokumen Pengadaan Langsung Routes
        Route::middleware(['permission:manage_dokumen_pengadaan'])->prefix('dokumen-pengadaan-langsung')->group(function () {
            Route::get('/', [DokumenPengadaanLangsungController::class, 'index']);
            Route::get('/pengadaan', [DokumenPengadaanLangsungController::class, 'getPengadaan']);
            Route::post('/', [DokumenPengadaanLangsungController::class, 'store']);
            Route::get('/{dokumenPengadaanLangsung}', [DokumenPengadaanLangsungController::class, 'show']);
            Route::post('/{dokumenPengadaanLangsung}', [DokumenPengadaanLangsungController::class, 'update']);
            Route::delete('/{dokumenPengadaanLangsung}', [DokumenPengadaanLangsungController::class, 'destroy']);
        });

        // Pengadaan Routes
        Route::middleware(['permission:manage_pengadaan'])->prefix('pengadaan')->group(function () {
            Route::get('/', [PengadaanController::class, 'index']);
            Route::get('/users', [PengadaanController::class, 'getUsers']);
            Route::post('/', [PengadaanController::class, 'store']);
            Route::get('/{pengadaan}', [PengadaanController::class, 'show']);
            Route::put('/{pengadaan}', [PengadaanController::class, 'update']);
            Route::delete('/{pengadaan}', [PengadaanController::class, 'destroy']);
        });

        // Dokumen Checklist Items Routes
        Route::prefix('dokumen-checklist-items')->group(function () {
            Route::get('/pengadaan/{pengadaanId}', [DokumenChecklistItemController::class, 'index']);
            Route::post('/', [DokumenChecklistItemController::class, 'store']);
            Route::post('/bulk', [DokumenChecklistItemController::class, 'bulkStore']);
            Route::post('/{id}/upload', [DokumenChecklistItemController::class, 'uploadFile']);
            Route::put('/{id}', [DokumenChecklistItemController::class, 'update']);
            Route::delete('/{id}', [DokumenChecklistItemController::class, 'destroy']);
        });

        // Angkutan Umum Routes (API)
        Route::prefix('angkutan-umum')->group(function () {
            Route::get('/', [AngkutanUmumController::class, 'index']);
            Route::get('/export', [AngkutanUmumController::class, 'export']);
            Route::post('/', [AngkutanUmumController::class, 'store']);
            Route::get('/{angkutanUmum}', [AngkutanUmumController::class, 'show']);
            Route::post('/{angkutanUmum}', [AngkutanUmumController::class, 'update']); // Using POST for file upload
            Route::delete('/{angkutanUmum}', [AngkutanUmumController::class, 'destroy']);
        });

        // Download Permission Routes (Super Admin only)
        Route::prefix('download-permissions')->group(function () {
            Route::get('/', [DownloadPermissionController::class, 'index']);
            Route::post('/update', [DownloadPermissionController::class, 'updatePermission']);
            Route::get('/check', [DownloadPermissionController::class, 'checkPermission']);
        });
    });
});

// Include authentication routes
require __DIR__ . '/auth.php';

// SPA Route - must be last
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

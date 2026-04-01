<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Test route
Route::get('/test', function () {
    return response()->json(['test' => 'ok']);
});

// Public API routes for attendance (used by frontend) - NO AUTH REQUIRED
Route::get('/attendance-summary/monthly', [AttendanceController::class, 'monthlySummary']);
Route::get('/attendances/export-monthly', [AttendanceController::class, 'exportMonthly']);

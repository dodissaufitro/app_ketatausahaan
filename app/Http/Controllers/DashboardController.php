<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\IncomingMail;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Total employees (active only)
        $totalEmployees = Employee::where('status', 'active')->count();

        // Present today
        $presentToday = Attendance::whereDate('date', $today)
            ->whereIn('status', ['present', 'late'])
            ->count();

        // On leave today
        $onLeave = Leave::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        // Pending leave requests
        $pendingLeaveRequests = Leave::where('status', 'pending')->count();

        // New hires this month
        $newHiresThisMonth = Employee::whereDate('join_date', '>=', $startOfMonth)->count();

        // Upcoming birthdays (within 7 days)
        $upcomingBirthdays = 0; // Not implemented in employees table

        // Attendance data for the week
        $attendanceData = [];
        $daysIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $dayData = Attendance::whereDate('date', $date)
                ->selectRaw("
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absen
                ")
                ->first();

            $attendanceData[] = [
                'name' => $daysIndo[$date->dayOfWeek],
                'hadir' => $dayData->hadir ?? 0,
                'terlambat' => $dayData->terlambat ?? 0,
                'cuti' => Leave::where('status', 'approved')
                    ->whereDate('start_date', '<=', $date)
                    ->whereDate('end_date', '>=', $date)
                    ->count(),
            ];
        }

        // Department distribution
        $departmentData = Employee::where('status', 'active')
            ->selectRaw('department, COUNT(*) as count')
            ->groupBy('department')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->department,
                    'count' => $item->count,
                ];
            });

        // Pending leave requests with details
        $pendingLeaves = Leave::where('status', 'pending')
            ->with('employee')
            ->orderBy('applied_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($leave) {
                return [
                    'id' => (string) $leave->id,
                    'employeeId' => (string) $leave->employee_id,
                    'employeeName' => $leave->employee->name,
                    'type' => $leave->type,
                    'startDate' => $leave->start_date,
                    'endDate' => $leave->end_date,
                    'days' => $leave->days,
                    'reason' => $leave->reason,
                    'status' => $leave->status,
                    'appliedDate' => $leave->applied_date,
                ];
            });

        // Recent attendance (today)
        $recentAttendance = Attendance::with('employee')
            ->whereDate('date', $today)
            ->orderBy('check_in', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => (string) $attendance->id,
                    'employeeId' => (string) $attendance->employee_id,
                    'employeeName' => $attendance->employee->name,
                    'date' => $attendance->date,
                    'checkIn' => $attendance->check_in ? Carbon::parse($attendance->check_in)->format('H:i') : '-',
                    'checkOut' => $attendance->check_out ? Carbon::parse($attendance->check_out)->format('H:i') : '-',
                    'status' => $attendance->status,
                    'workHours' => $attendance->work_hours ?? 0,
                ];
            });

        // Unread incoming mails
        $unreadMails = IncomingMail::where('status', 'unread')->count();

        // Pending payrolls
        $pendingPayrolls = Payroll::where('status', 'pending')->count();

        return response()->json([
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'presentToday' => $presentToday,
                'onLeave' => $onLeave,
                'pendingLeaveRequests' => $pendingLeaveRequests,
                'newHiresThisMonth' => $newHiresThisMonth,
                'upcomingBirthdays' => $upcomingBirthdays,
                'unreadMails' => $unreadMails,
                'pendingPayrolls' => $pendingPayrolls,
            ],
            'attendanceData' => $attendanceData,
            'departmentData' => $departmentData,
            'pendingLeaves' => $pendingLeaves,
            'recentAttendance' => $recentAttendance,
        ]);
    }
}

@echo off
REM Laravel Task Scheduler for X601 Attendance Sync
REM This script runs the Laravel scheduler every minute

cd /d "C:\laragon\www\app_ketatausahaan"

REM Run the Laravel scheduler
php artisan schedule:run

REM Optional: Log the execution
echo [%DATE% %TIME%] Scheduler run completed >> "C:\laragon\www\app_ketatausahaan\storage\logs\scheduler.log"
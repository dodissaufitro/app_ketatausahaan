# PowerShell script to set up Windows Task Scheduler for Laravel
# Run this script as Administrator to create the scheduled task

$taskName = "LaravelScheduler_X601"
$scriptPath = "C:\laragon\www\app_ketatausahaan\scheduler.bat"
$logPath = "C:\laragon\www\app_ketatausahaan\storage\logs\scheduler.log"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task '$taskName' already exists. Removing it first..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create new scheduled task
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType InteractiveToken

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Laravel Task Scheduler for X601 Attendance Synchronization"

Write-Host "Scheduled task '$taskName' has been created successfully!"
Write-Host "The task will run every minute to check for scheduled Laravel commands."
Write-Host ""
Write-Host "To verify the task:"
Write-Host "1. Open Task Scheduler (taskschd.msc)"
Write-Host "2. Look for '$taskName' under Task Scheduler Library"
Write-Host ""
Write-Host "To run manually:"
Write-Host "schtasks /run /tn `"$taskName`""
Write-Host ""
Write-Host "To delete the task:"
Write-Host "schtasks /delete /tn `"$taskName`""
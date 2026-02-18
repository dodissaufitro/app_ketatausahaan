<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::with('userRole')->find(6);

echo "User: {$user->name}\n";
echo "Role: {$user->role}\n";
echo "User Role ID: {$user->user_role_id}\n";
echo "User Role Name: {$user->userRole->display_name}\n";
echo "\nUser Role Permissions:\n";
echo json_encode($user->userRole->permissions, JSON_PRETTY_PRINT) . "\n";

echo "\nChecking hasPermission():\n";
echo "manage_incoming_mails: " . ($user->hasPermission('manage_incoming_mails') ? 'YES' : 'NO') . "\n";
echo "manage_outgoing_mails: " . ($user->hasPermission('manage_outgoing_mails') ? 'YES' : 'NO') . "\n";
echo "manage_employees: " . ($user->hasPermission('manage_employees') ? 'YES' : 'NO') . "\n";

echo "\ngetPermissions():\n";
echo json_encode($user->getPermissions(), JSON_PRETTY_PRINT) . "\n";

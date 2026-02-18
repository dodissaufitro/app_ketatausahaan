# Sistem Hak Akses (Permissions)

## Available Permissions

### User Management

- `manage_users` - Kelola users (CRUD users)
- `manage_roles` - Kelola user roles (CRUD roles & permissions)

### Employee Management

- `manage_employees` - Kelola data karyawan (CRUD)

### Operations

- `manage_agendas` - Kelola agenda/jadwal
- `manage_attendances` - Kelola kehadiran karyawan
- `manage_leaves` - Kelola cuti karyawan (approve/reject)
- `manage_payrolls` - Kelola penggajian (process payroll)
- `manage_incoming_mails` - Kelola surat masuk
- `manage_outgoing_mails` - Kelola surat keluar

### Reporting

- `view_dashboard` - Akses dashboard
- `view_reports` - Lihat laporan
- `export_data` - Export data ke Excel/PDF

### User-specific

- `view_own_attendance` - Lihat kehadiran sendiri
- `view_own_leave` - Lihat cuti sendiri
- `view_own_payroll` - Lihat slip gaji sendiri
- `submit_leave_request` - Ajukan permohonan cuti

## Default Roles

### Super Admin

- Full access ke semua permissions
- Dapat mengelola users dan roles
- **Permissions**: All permissions

### Admin

- Kelola employees, attendance, leaves, payrolls
- **Permissions**:
    - manage_employees
    - manage_agendas
    - manage_attendances
    - manage_leaves
    - manage_payrolls
    - manage_incoming_mails
    - manage_outgoing_mails
    - view_dashboard
    - view_reports
    - export_data

### User

- View-only access untuk data pribadi
- **Permissions**:
    - view_dashboard
    - view_own_attendance
    - view_own_leave
    - view_own_payroll
    - submit_leave_request

## Usage

### Frontend - Hook usePermission

```typescript
import { usePermission } from "@/hooks/usePermission";

function MyComponent() {
    const { hasPermission, hasRole } = usePermission();

    if (hasPermission("manage_users")) {
        // Show admin features
    }

    if (hasRole("superadmin")) {
        // Show superadmin features
    }
}
```

### Frontend - PermissionGuard Component

```typescript
<PermissionGuard permission="manage_employees">
  <EmployeesPage />
</PermissionGuard>

<PermissionGuard role="superadmin">
  <AdminPanel />
</PermissionGuard>

<PermissionGuard permission={['manage_users', 'manage_roles']} requireAll>
  <RoleManagement />
</PermissionGuard>
```

### Backend - Route Protection

```php
// Single permission
Route::middleware(['permission:manage_users'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});

// Multiple roles
Route::middleware(['role:superadmin,admin'])->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});
```

## Testing Accounts

1. **Super Admin**
    - Email: admin@admin.com
    - Password: password
    - Access: Full system access

2. **Admin**
    - Email: admin@example.com
    - Password: password
    - Access: Employee & operational management

3. **User**
    - Email: user@example.com
    - Password: password
    - Access: View own data only

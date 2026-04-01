# 🗄️ DATABASE STRUCTURE DESIGN
## Sistem Aplikasi Ketatausahaan

---

## 📊 **DATABASE OVERVIEW**

**Database Engine:** MySQL 8.0+ / PostgreSQL 13+  
**Character Set:** UTF8MB4  
**Collation:** utf8mb4_unicode_ci  
**Storage Engine:** InnoDB  

---

## 🏗️ **TABLE STRUCTURE**

### 1. 👤 **AUTHENTICATION & USER MANAGEMENT**

#### `users` - Master User Table
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_uuid (uuid),
    INDEX idx_active (is_active),
    INDEX idx_deleted (deleted_at)
);
```

#### `roles` - Role Management
```sql
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    level INT DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_level (level),
    INDEX idx_active (is_active)
);
```

#### `permissions` - Permission Management
```sql
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_module (module)
);
```

#### `user_roles` - User Role Assignment
```sql
CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role_id)
);
```

#### `role_permissions` - Role Permission Assignment
```sql
CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id)
);
```

---

### 2. 👥 **EMPLOYEE MANAGEMENT**

#### `employees` - Employee Master Data
```sql
CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED UNIQUE NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    email VARCHAR(150) UNIQUE NULL,
    phone VARCHAR(20) NULL,
    birth_date DATE NULL,
    birth_place VARCHAR(100) NULL,
    gender ENUM('M', 'F') NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed') NULL,
    religion VARCHAR(50) NULL,
    nationality VARCHAR(50) DEFAULT 'Indonesian',
    identity_number VARCHAR(20) UNIQUE NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    province VARCHAR(100) NULL,
    postal_code VARCHAR(10) NULL,
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    emergency_contact_relation VARCHAR(50) NULL,
    profile_photo VARCHAR(255) NULL,
    employee_status ENUM('active', 'inactive', 'terminated', 'resigned') DEFAULT 'active',
    hire_date DATE NULL,
    termination_date DATE NULL,
    termination_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_id (employee_id),
    INDEX idx_user_id (user_id),
    INDEX idx_full_name (full_name),
    INDEX idx_email (email),
    INDEX idx_status (employee_status),
    INDEX idx_hire_date (hire_date),
    INDEX idx_deleted (deleted_at),
    FULLTEXT idx_search (first_name, last_name, employee_id, email)
);
```

#### `departments` - Department Structure
```sql
CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    parent_id BIGINT UNSIGNED NULL,
    head_id BIGINT UNSIGNED NULL,
    level INT DEFAULT 1,
    path VARCHAR(500) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_parent (parent_id),
    INDEX idx_head (head_id),
    INDEX idx_level (level),
    INDEX idx_active (is_active)
);
```

#### `positions` - Job Positions
```sql
CREATE TABLE positions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    level INT DEFAULT 1,
    min_salary DECIMAL(15,2) NULL,
    max_salary DECIMAL(15,2) NULL,
    requirements TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_title (title),
    INDEX idx_department (department_id),
    INDEX idx_level (level),
    INDEX idx_active (is_active)
);
```

#### `employee_positions` - Employee Position Assignment
```sql
CREATE TABLE employee_positions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    position_id BIGINT UNSIGNED NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    salary DECIMAL(15,2) NULL,
    is_current TINYINT(1) DEFAULT 1,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_position (position_id),
    INDEX idx_department (department_id),
    INDEX idx_current (is_current),
    INDEX idx_dates (start_date, end_date)
);
```

---

### 3. ⏰ **ATTENDANCE MANAGEMENT**

#### `attendance_devices` - X601 Device Management
```sql
CREATE TABLE attendance_devices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    port INT DEFAULT 4370,
    location VARCHAR(150) NULL,
    device_type VARCHAR(50) DEFAULT 'X601',
    firmware_version VARCHAR(20) NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_sync_at TIMESTAMP NULL,
    sync_status ENUM('connected', 'disconnected', 'error') DEFAULT 'disconnected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_id (device_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_active (is_active),
    INDEX idx_sync_status (sync_status)
);
```

#### `attendance_records` - Raw Attendance Data
```sql
CREATE TABLE attendance_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    device_id BIGINT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    check_time DATETIME NOT NULL,
    check_type ENUM('in', 'out', 'break_out', 'break_in') NOT NULL,
    verification_method ENUM('fingerprint', 'face', 'card', 'password') DEFAULT 'fingerprint',
    device_record_id VARCHAR(50) NULL,
    raw_data JSON NULL,
    is_processed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES attendance_devices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_record (device_id, device_record_id),
    INDEX idx_employee_date (employee_id, attendance_date),
    INDEX idx_check_time (check_time),
    INDEX idx_check_type (check_type),
    INDEX idx_processed (is_processed),
    INDEX idx_date_range (attendance_date)
);
```

#### `daily_attendance` - Processed Daily Attendance
```sql
CREATE TABLE daily_attendance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    break_out_time TIME NULL,
    break_in_time TIME NULL,
    total_work_hours DECIMAL(4,2) DEFAULT 0,
    break_duration DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    late_minutes INT DEFAULT 0,
    early_leave_minutes INT DEFAULT 0,
    status ENUM('present', 'late', 'absent', 'half_day', 'leave', 'holiday') DEFAULT 'absent',
    notes TEXT NULL,
    auto_generated TINYINT(1) DEFAULT 0,
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    UNIQUE KEY unique_employee_date (employee_id, attendance_date),
    INDEX idx_employee (employee_id),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_month (attendance_date),
    INDEX idx_approved (approved_by)
);
```

#### `work_schedules` - Employee Work Schedules
```sql
CREATE TABLE work_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME NULL,
    break_end_time TIME NULL,
    work_days JSON NOT NULL, -- [1,2,3,4,5] for Mon-Fri
    total_work_hours DECIMAL(4,2) NOT NULL,
    grace_period_minutes INT DEFAULT 15,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);
```

#### `employee_schedules` - Employee Schedule Assignment
```sql
CREATE TABLE employee_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    schedule_id BIGINT UNSIGNED NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES work_schedules(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_schedule (schedule_id),
    INDEX idx_effective (effective_from, effective_to),
    INDEX idx_active (is_active)
);
```

---

### 4. 💰 **PAYROLL MANAGEMENT**

#### `payroll_periods` - Payroll Processing Periods
```sql
CREATE TABLE payroll_periods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('draft', 'processing', 'approved', 'paid', 'closed') DEFAULT 'draft',
    total_employees INT DEFAULT 0,
    total_gross_salary DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net_salary DECIMAL(15,2) DEFAULT 0,
    processed_by BIGINT UNSIGNED NULL,
    processed_at TIMESTAMP NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (processed_by) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    UNIQUE KEY unique_period (start_date, end_date),
    INDEX idx_period_name (period_name),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
);
```

#### `salary_components` - Salary Component Master
```sql
CREATE TABLE salary_components (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    type ENUM('basic', 'allowance', 'deduction', 'overtime') NOT NULL,
    calculation_type ENUM('fixed', 'percentage', 'formula') NOT NULL,
    base_amount DECIMAL(15,2) DEFAULT 0,
    percentage_rate DECIMAL(5,2) DEFAULT 0,
    formula TEXT NULL,
    is_taxable TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_type (type),
    INDEX idx_calculation_type (calculation_type),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);
```

#### `employee_salaries` - Employee Salary Configuration
```sql
CREATE TABLE employee_salaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    component_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_component (component_id),
    INDEX idx_effective (effective_from, effective_to),
    INDEX idx_active (is_active)
);
```

#### `payroll_details` - Detailed Payroll Calculations
```sql
CREATE TABLE payroll_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_period_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    component_id BIGINT UNSIGNED NOT NULL,
    component_type ENUM('basic', 'allowance', 'deduction', 'overtime') NOT NULL,
    base_amount DECIMAL(15,2) DEFAULT 0,
    calculated_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) NOT NULL,
    calculation_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payroll_component (payroll_period_id, employee_id, component_id),
    INDEX idx_payroll_period (payroll_period_id),
    INDEX idx_employee (employee_id),
    INDEX idx_component (component_id),
    INDEX idx_type (component_type)
);
```

#### `payroll_summaries` - Payroll Summary per Employee
```sql
CREATE TABLE payroll_summaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_period_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    total_allowances DECIMAL(15,2) DEFAULT 0,
    total_overtime DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    tax_deduction DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    work_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status ENUM('draft', 'calculated', 'approved', 'paid') DEFAULT 'draft',
    paid_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payroll_employee (payroll_period_id, employee_id),
    INDEX idx_payroll_period (payroll_period_id),
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_net_salary (net_salary)
);
```

---

### 5. 🏖️ **LEAVE MANAGEMENT**

#### `leave_types` - Leave Type Master
```sql
CREATE TABLE leave_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    max_days_per_year INT DEFAULT 12,
    can_be_carried_over TINYINT(1) DEFAULT 0,
    max_carry_over_days INT DEFAULT 0,
    requires_approval TINYINT(1) DEFAULT 1,
    approval_levels INT DEFAULT 1,
    advance_notice_days INT DEFAULT 3,
    is_paid TINYINT(1) DEFAULT 1,
    affects_attendance TINYINT(1) DEFAULT 1,
    color VARCHAR(7) DEFAULT '#007bff',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);
```

#### `employee_leave_balances` - Employee Leave Balance
```sql
CREATE TABLE employee_leave_balances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    leave_type_id BIGINT UNSIGNED NOT NULL,
    year YEAR NOT NULL,
    entitled_days DECIMAL(4,1) DEFAULT 0,
    used_days DECIMAL(4,1) DEFAULT 0,
    remaining_days DECIMAL(4,1) GENERATED ALWAYS AS (entitled_days - used_days) STORED,
    carried_over_days DECIMAL(4,1) DEFAULT 0,
    adjusted_days DECIMAL(4,1) DEFAULT 0, -- Manual adjustments
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type_id, year),
    INDEX idx_employee (employee_id),
    INDEX idx_leave_type (leave_type_id),
    INDEX idx_year (year),
    INDEX idx_remaining (remaining_days)
);
```

#### `leave_requests` - Leave Request Applications
```sql
CREATE TABLE leave_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    leave_type_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact VARCHAR(200) NULL,
    substitute_employee_id BIGINT UNSIGNED NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    current_approval_level INT DEFAULT 1,
    final_approval_level INT DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    FOREIGN KEY (substitute_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_request_number (request_number),
    INDEX idx_employee (employee_id),
    INDEX idx_leave_type (leave_type_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_submitted (submitted_at)
);
```

#### `leave_approvals` - Leave Approval Workflow
```sql
CREATE TABLE leave_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    leave_request_id BIGINT UNSIGNED NOT NULL,
    approval_level INT NOT NULL,
    approver_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    decision_date TIMESTAMP NULL,
    comments TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request_level (leave_request_id, approval_level),
    INDEX idx_leave_request (leave_request_id),
    INDEX idx_approver (approver_id),
    INDEX idx_status (status),
    INDEX idx_level (approval_level)
);
```

---

### 6. 📄 **DOCUMENT MANAGEMENT**

#### `document_categories` - Document Category Master
```sql
CREATE TABLE document_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    parent_id BIGINT UNSIGNED NULL,
    path VARCHAR(500) NULL,
    max_file_size INT DEFAULT 10485760, -- 10MB in bytes
    allowed_extensions JSON DEFAULT '["pdf","doc","docx","jpg","png"]',
    retention_period_months INT DEFAULT 60, -- 5 years
    is_confidential TINYINT(1) DEFAULT 0,
    requires_approval TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
);
```

#### `documents` - Document Master
```sql
CREATE TABLE documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('employee', 'department', 'company', 'project', 'policy') NOT NULL,
    related_employee_id BIGINT UNSIGNED NULL,
    related_department_id BIGINT UNSIGNED NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    version DECIMAL(3,1) DEFAULT 1.0,
    is_latest_version TINYINT(1) DEFAULT 1,
    parent_document_id BIGINT UNSIGNED NULL, -- For versioning
    confidentiality_level ENUM('public', 'internal', 'confidential', 'restricted') DEFAULT 'internal',
    status ENUM('draft', 'active', 'archived', 'deleted') DEFAULT 'active',
    expiry_date DATE NULL,
    tags JSON NULL,
    metadata JSON NULL,
    uploaded_by BIGINT UNSIGNED NOT NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (related_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (related_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_document_number (document_number),
    INDEX idx_title (title),
    INDEX idx_category (category_id),
    INDEX idx_type (document_type),
    INDEX idx_employee (related_employee_id),
    INDEX idx_department (related_department_id),
    INDEX idx_status (status),
    INDEX idx_confidentiality (confidentiality_level),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created (created_at),
    INDEX idx_expiry (expiry_date),
    FULLTEXT idx_search (title, description)
);
```

#### `document_access` - Document Access Control
```sql
CREATE TABLE document_access (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    access_type ENUM('view', 'download', 'edit', 'delete') NOT NULL,
    granted_by BIGINT UNSIGNED NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_document_user_access (document_id, user_id, access_type),
    INDEX idx_document (document_id),
    INDEX idx_user (user_id),
    INDEX idx_access_type (access_type),
    INDEX idx_active (is_active)
);
```

#### `document_downloads` - Document Download Log
```sql
CREATE TABLE document_downloads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    download_ip VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    download_size INT NOT NULL,
    download_duration_ms INT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_document (document_id),
    INDEX idx_user (user_id),
    INDEX idx_downloaded (downloaded_at)
);
```

---

### 7. 🚗 **TRANSPORTATION MANAGEMENT**

#### `transport_types` - Transportation Type Master
```sql
CREATE TABLE transport_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    rate_per_km DECIMAL(10,2) DEFAULT 0,
    fixed_rate DECIMAL(10,2) DEFAULT 0,
    requires_photo TINYINT(1) DEFAULT 1,
    is_reimbursable TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);
```

#### `transport_records` - Transportation Records
```sql
CREATE TABLE transport_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    transport_type_id BIGINT UNSIGNED NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    departure_location VARCHAR(255) NOT NULL,
    departure_photo VARCHAR(255) NULL,
    departure_coordinates VARCHAR(50) NULL, -- lat,lng
    return_date DATE NULL,
    return_time TIME NULL,
    return_location VARCHAR(255) NULL,
    return_photo VARCHAR(255) NULL,
    return_coordinates VARCHAR(50) NULL,
    total_duration_minutes INT NULL,
    distance_km DECIMAL(8,2) DEFAULT 0,
    purpose TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    passengers JSON NULL, -- Array of passenger names
    vehicle_info VARCHAR(200) NULL, -- License plate, etc.
    calculated_amount DECIMAL(10,2) DEFAULT 0,
    actual_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing',
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    approval_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (transport_type_id) REFERENCES transport_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_record_number (record_number),
    INDEX idx_employee (employee_id),
    INDEX idx_transport_type (transport_type_id),
    INDEX idx_departure_date (departure_date),
    INDEX idx_status (status),
    INDEX idx_approved_by (approved_by)
);
```

---

### 8. 🛒 **PROCUREMENT MANAGEMENT**

#### `procurement_types` - Procurement Type Master
```sql
CREATE TABLE procurement_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    max_budget_amount DECIMAL(15,2) NULL,
    approval_workflow JSON NOT NULL, -- Array of approval levels
    required_documents JSON NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);
```

#### `budget_allocations` - Budget Allocation Master
```sql
CREATE TABLE budget_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    budget_name VARCHAR(200) NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    fiscal_year YEAR NOT NULL,
    total_budget DECIMAL(15,2) NOT NULL,
    allocated_budget DECIMAL(15,2) DEFAULT 0,
    remaining_budget DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - allocated_budget) STORED,
    budget_manager_id BIGINT UNSIGNED NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_manager_id) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_budget_code (budget_code),
    INDEX idx_department (department_id),
    INDEX idx_fiscal_year (fiscal_year),
    INDEX idx_manager (budget_manager_id),
    INDEX idx_active (is_active)
);
```

#### `procurement_requests` - Procurement Requests
```sql
CREATE TABLE procurement_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    procurement_type_id BIGINT UNSIGNED NOT NULL,
    budget_allocation_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    urgency_level ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    required_date DATE NOT NULL,
    delivery_location VARCHAR(255) NULL,
    
    -- Role assignments
    pptk_user_id BIGINT UNSIGNED NOT NULL,
    asn_user_id BIGINT UNSIGNED NOT NULL,
    non_asn_user_id BIGINT UNSIGNED NOT NULL,
    
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'in_procurement', 'completed', 'cancelled') DEFAULT 'draft',
    current_approval_level INT DEFAULT 1,
    final_approval_level INT DEFAULT 1,
    approval_deadline DATE NULL,
    
    submitted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (procurement_type_id) REFERENCES procurement_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (budget_allocation_id) REFERENCES budget_allocations(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (pptk_user_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (asn_user_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (non_asn_user_id) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_request_number (request_number),
    INDEX idx_procurement_type (procurement_type_id),
    INDEX idx_budget (budget_allocation_id),
    INDEX idx_requested_by (requested_by),
    INDEX idx_status (status),
    INDEX idx_urgency (urgency_level),
    INDEX idx_required_date (required_date),
    INDEX idx_pptk (pptk_user_id)
);
```

#### `procurement_items` - Procurement Request Items
```sql
CREATE TABLE procurement_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    procurement_request_id BIGINT UNSIGNED NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT NULL,
    specification TEXT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    brand_preference VARCHAR(100) NULL,
    quality_standard VARCHAR(200) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (procurement_request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    INDEX idx_procurement_request (procurement_request_id),
    INDEX idx_item_name (item_name)
);
```

#### `procurement_approvals` - Procurement Approval Workflow
```sql
CREATE TABLE procurement_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    procurement_request_id BIGINT UNSIGNED NOT NULL,
    approval_level INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL, -- 'pptk', 'manager', 'director', etc.
    approver_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'delegated') DEFAULT 'pending',
    decision_date TIMESTAMP NULL,
    comments TEXT NULL,
    conditions TEXT NULL, -- Special conditions for approval
    delegated_to BIGINT UNSIGNED NULL,
    notified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (procurement_request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (delegated_to) REFERENCES employees(id) ON DELETE SET NULL,
    UNIQUE KEY unique_request_level (procurement_request_id, approval_level),
    INDEX idx_procurement_request (procurement_request_id),
    INDEX idx_approver (approver_id),
    INDEX idx_status (status),
    INDEX idx_level (approval_level),
    INDEX idx_role (approver_role)
);
```

#### `procurement_tracking` - Real-time Procurement Tracking
```sql
CREATE TABLE procurement_tracking (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    procurement_request_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(100) NOT NULL,
    stage_description TEXT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_completion DATE NULL,
    actual_completion DATE NULL,
    responsible_person VARCHAR(200) NULL,
    notes TEXT NULL,
    attachments JSON NULL,
    is_current_stage TINYINT(1) DEFAULT 0,
    updated_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (procurement_request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_procurement_request (procurement_request_id),
    INDEX idx_stage (stage),
    INDEX idx_current (is_current_stage),
    INDEX idx_updated_by (updated_by)
);
```

---

### 9. 🔔 **NOTIFICATION & COMMUNICATION**

#### `notifications` - System Notifications
```sql
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    action_url VARCHAR(300) NULL,
    action_label VARCHAR(50) NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_read TINYINT(1) DEFAULT 0,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at),
    INDEX idx_expires (expires_at)
);
```

#### `email_queue` - Email Queue for Processing
```sql
CREATE TABLE email_queue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL,
    to_email VARCHAR(150) NOT NULL,
    to_name VARCHAR(200) NULL,
    cc_emails JSON NULL,
    bcc_emails JSON NULL,
    subject VARCHAR(300) NOT NULL,
    body_html LONGTEXT NOT NULL,
    body_text TEXT NULL,
    priority INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    attempts INT DEFAULT 0,
    status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_to_email (to_email),
    INDEX idx_status (status),
    INDEX idx_priority (priority DESC),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_created (created_at)
);
```

---

### 10. 📋 **AUDIT & LOGGING**

#### `audit_logs` - System Audit Trail
```sql
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id VARCHAR(100) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_created (created_at),
    INDEX idx_ip_address (ip_address)
);
```

#### `system_logs` - Application Error Logs
```sql
CREATE TABLE system_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL,
    level ENUM('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug') NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    request_url VARCHAR(500) NULL,
    request_method VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_level (level),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    INDEX idx_url (request_url)
);
```

---

## 🔗 **RELATIONSHIPS SUMMARY**

### **Core Entity Relationships:**

```
users ──→ employees (1:1)
employees ──→ employee_positions ──→ positions/departments (M:M)
employees ──→ daily_attendance ──→ attendance_records (1:M)
employees ──→ leave_requests ──→ leave_approvals (1:M)
employees ──→ payroll_summaries ──→ payroll_details (1:M)
employees ──→ transport_records (1:M)
employees ──→ procurement_requests (1:M)
employees ──→ documents (1:M)
```

### **Permission & Security:**

```
users ──→ user_roles ──→ roles ──→ role_permissions ──→ permissions
documents ──→ document_access ──→ users
```

### **Business Process Flows:**

```
attendance_devices ──→ attendance_records ──→ daily_attendance ──→ payroll_details
leave_requests ──→ leave_approvals ──→ daily_attendance
procurement_requests ──→ procurement_approvals ──→ procurement_tracking
```

---

## 📊 **PERFORMANCE INDEXES**

### **Critical Performance Indexes:**

```sql
-- Employee search optimization
CREATE INDEX idx_employee_search ON employees (employee_id, email, employee_status);
CREATE INDEX idx_employee_name_search ON employees (first_name, last_name);

-- Attendance performance
CREATE INDEX idx_attendance_employee_month ON daily_attendance (employee_id, attendance_date);
CREATE INDEX idx_attendance_date_range ON attendance_records (attendance_date, check_time);

-- Payroll optimization  
CREATE INDEX idx_payroll_period_employee ON payroll_details (payroll_period_id, employee_id);
CREATE INDEX idx_salary_employee_active ON employee_salaries (employee_id, is_active, effective_from);

-- Document search
CREATE FULLTEXT INDEX idx_document_fulltext ON documents (title, description);
CREATE INDEX idx_document_type_status ON documents (document_type, status, created_at);

-- Notification performance
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at);

-- Audit performance
CREATE INDEX idx_audit_logs_date ON audit_logs (created_at, event_type);
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, created_at);
```

---

## 🛡️ **SECURITY CONSTRAINTS**

### **Data Integrity Rules:**

```sql
-- Ensure employee has valid user account
ALTER TABLE employees ADD CONSTRAINT chk_employee_user 
CHECK (user_id IS NOT NULL OR employee_status = 'terminated');

-- Salary must be positive
ALTER TABLE employee_salaries ADD CONSTRAINT chk_positive_salary 
CHECK (amount >= 0);

-- Leave balance cannot be negative
ALTER TABLE employee_leave_balances ADD CONSTRAINT chk_positive_balance 
CHECK (remaining_days >= 0);

-- Attendance time validation
ALTER TABLE daily_attendance ADD CONSTRAINT chk_valid_work_time 
CHECK (check_out_time IS NULL OR check_out_time >= check_in_time);

-- Budget allocation limits
ALTER TABLE budget_allocations ADD CONSTRAINT chk_budget_positive 
CHECK (total_budget > 0 AND allocated_budget >= 0);

-- Document file size limits
ALTER TABLE documents ADD CONSTRAINT chk_file_size 
CHECK (file_size > 0 AND file_size <= 52428800); -- 50MB max
```

---

## 📈 **SAMPLE DATA INITIALIZATION**

### **Default System Data:**

```sql
-- Default Roles
INSERT INTO roles (name, display_name, description, level) VALUES
('super_admin', 'Super Administrator', 'Full system access', 10),
('hr_manager', 'HR Manager', 'Human Resources Management', 8),
('department_head', 'Department Head', 'Department Management', 6),
('employee', 'Employee', 'Basic Employee Access', 2),
('guest', 'Guest', 'Read-only Access', 1);

-- Default Leave Types
INSERT INTO leave_types (code, name, description, max_days_per_year, is_active) VALUES
('AL', 'Annual Leave', 'Yearly vacation leave', 12, 1),
('SL', 'Sick Leave', 'Medical leave', 30, 1),
('ML', 'Maternity Leave', 'Maternity leave for mothers', 90, 1),
('EL', 'Emergency Leave', 'Emergency situations', 5, 1);

-- Default Work Schedule
INSERT INTO work_schedules (name, description, start_time, end_time, work_days, total_work_hours) VALUES
('Standard Office Hours', 'Regular 8-hour workday', '08:00:00', '17:00:00', '[1,2,3,4,5]', 8.0);

-- Default Transport Types
INSERT INTO transport_types (code, name, rate_per_km, fixed_rate, is_active) VALUES
('MOTOR', 'Motorcycle', 1500.00, 0.00, 1),
('CAR', 'Car', 3000.00, 0.00, 1),
('PUBLIC', 'Public Transport', 0.00, 10000.00, 1);

-- Default Salary Components
INSERT INTO salary_components (code, name, type, calculation_type, is_active) VALUES
('BASIC', 'Basic Salary', 'basic', 'fixed', 1),
('ALW_TRANSPORT', 'Transport Allowance', 'allowance', 'fixed', 1),
('ALW_MEAL', 'Meal Allowance', 'allowance', 'fixed', 1),
('DED_TAX', 'Income Tax', 'deduction', 'percentage', 1),
('OT_REGULAR', 'Regular Overtime', 'overtime', 'formula', 1);
```

---

*📅 Database Design Created: March 4, 2026*  
*🎯 Total Tables: 35 Tables*  
*📊 Estimated Storage: 50-100GB for 1000 employees*  
*🔧 Optimized for MySQL 8.0+ / PostgreSQL 13+*
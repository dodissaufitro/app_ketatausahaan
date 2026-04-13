export interface Employee {
  id: string;
  employeeId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  salary: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'employee';
  userRoleId?: string;
  userRoleName?: string;
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  usersCount?: number;
  createdAt?: string;
}

export interface AuthUser extends User {
  // Additional auth-specific fields if needed
}

export interface Attendance {
  id: string | null;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'on-leave' | 'sick-leave' | 'personal-leave' | 'maternity-leave' | 'paternity-leave';
  leaveType?: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | null;
  workHours: number;
  source: 'manual' | 'x601' | 'system' | 'leave';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  lateDeductions: number;
  lateCount: number;
  lateHours: number;
  absentCount: number;
  absentDeductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaveRequests: number;
  newHiresThisMonth: number;
  upcomingBirthdays: number;
}

export interface IncomingMail {
  id: string;
  mailNumber: string;
  sender: string;
  subject: string;
  receivedDate: string;
  category: 'official' | 'invitation' | 'notification' | 'complaint' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'unread' | 'read' | 'processed' | 'archived';
  description?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface OutgoingMail {
  id: string;
  mailNumber: string;
  recipient: string;
  subject: string;
  sentDate: string;
  category: 'official' | 'invitation' | 'notification' | 'report' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'draft' | 'sent' | 'delivered' | 'archived';
  description?: string;
  attachmentUrl?: string;
}

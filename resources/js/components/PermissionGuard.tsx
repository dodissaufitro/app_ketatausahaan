import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string | string[];
  role?: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  role,
  requireAll = false,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, hasRole, hasAllPermissions } = usePermission();
  const { isRefreshing, isLoading } = useAuth();

  // While permissions are being loaded/refreshed, show spinner instead of Access Denied
  if (isLoading || isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check role first
  if (role) {
    const hasRequiredRole = Array.isArray(role) ? hasRole(role) : hasRole(role);
    if (!hasRequiredRole) {
      return fallback || <AccessDenied />;
    }
  }

  // Check permission
  if (permission) {
    let hasAccess = false;

    if (Array.isArray(permission)) {
      hasAccess = requireAll
        ? hasAllPermissions(permission)
        : hasPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }

    if (!hasAccess) {
      return fallback || <AccessDenied />;
    }
  }

  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Alert variant="destructive" className="max-w-md">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    </div>
  );
}

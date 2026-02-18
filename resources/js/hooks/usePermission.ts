import { useAuth } from '@/contexts/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;

    // Superadmin has all permissions
    if (user.role === 'superadmin') return true;

    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions?.includes(p));
    }

    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return permissions.some(p => user.permissions?.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return permissions.every(p => user.permissions?.includes(p));
  };

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions || [],
    role: user?.role,
  };
}

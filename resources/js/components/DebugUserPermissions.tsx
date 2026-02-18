import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function DebugUserPermissions() {
  const { user, refreshUser } = useAuth();

  const handleRefresh = async () => {
    console.log('[Debug] Refreshing user permissions...');
    await refreshUser();
    console.log('[Debug] User refreshed:', user);
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

 
}

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [], onNavigate, user: suppliedUser }) {
  const { isAuthenticated, isLoading, user: authenticatedUser } = useAuth();
  const user = suppliedUser || authenticatedUser;
  const role = String(user?.role || user?.user_metadata?.role || '').toLowerCase();
  const hasAllowedRole = allowedRoles.length === 0 || allowedRoles.map((value) => String(value).toLowerCase()).includes(role);

  useEffect(() => {
    if (isLoading || typeof onNavigate !== 'function') {
      return;
    } 

    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }

    if (!hasAllowedRole) {
      onNavigate('dashboard');
    }
  }, [hasAllowedRole, isAuthenticated, isLoading, onNavigate]);

  if (isLoading || !isAuthenticated || !hasAllowedRole) {
    return null;
  }

  return children;
}

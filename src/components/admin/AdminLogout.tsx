/**
 * Admin Logout Button Component
 *
 * Logout button for the admin panel
 * Calls logout and redirects to login page
 */

import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../Icon';

export function AdminLogout() {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        window.location.pathname = '/admin/login';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Logout"
    >
      <Icon name="x" className="h-4 w-4" />
      <span>Logout</span>
    </button>
  );
}

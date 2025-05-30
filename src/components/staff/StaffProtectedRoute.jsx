import React from 'react';
    import { Navigate, useLocation } from 'react-router-dom';
    import { useAuth } from '@/contexts/authHooks';

    const StaffProtectedRoute = ({ children, requiredRole, requiredRolePrefix }) => {
      const { user, role, loading } = useAuth();
      const location = useLocation();

      if (loading) {
        return (
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="text-white text-2xl font-semibold">Verifying Staff Access...</div>
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/staff/login" state={{ from: location }} replace />;
      }

      const isAuthorized = () => {
        if (!role) return false;
        if (requiredRole) return role === requiredRole;
        if (requiredRolePrefix) return role.startsWith(requiredRolePrefix);
        // If it's a staff protected route, they must have some staff role
        // This check might be redundant if all staff routes specify a prefix/role
        // but acts as a safeguard.
        return role.startsWith('staff'); 
      };

      if (!isAuthorized()) {
        // If not authorized, redirect to staff dashboard (if they are some kind of staff but not the right kind) 
        // or staff login if they are not staff at all.
        const fallbackPath = role?.startsWith('staff') ? '/staff/dashboard' : '/staff/login';
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
      }

      return children;
    };

    export default StaffProtectedRoute;
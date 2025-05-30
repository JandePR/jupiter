import React from 'react';
    import { Navigate, useLocation } from 'react-router-dom';
    import { useAuth } from '@/contexts/authHooks';

    const ProtectedRoute = ({ children, requiredRole }) => {
      const { user, role, loading } = useAuth();
      const location = useLocation();

      if (loading) {
        return (
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="text-white text-2xl font-semibold">Authenticating...</div>
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      if (requiredRole && role !== requiredRole) {
        const fallbackPath = role === 'client' ? '/dashboard' : (role?.startsWith('staff') ? '/staff/dashboard' : '/login');
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
      }

      return children;
    };

    export default ProtectedRoute;
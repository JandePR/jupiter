import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/authHooks';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import RegisterPage from '@/pages/RegisterPage';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

import StaffLoginPage from '@/pages/staff/StaffLoginPage';
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage';
import StaffLayout from '@/components/staff/StaffLayout';
import StaffProtectedRoute from '@/components/staff/StaffProtectedRoute';

const StaffCreateProjectPage = React.lazy(() => import('@/pages/staff/StaffCreateProjectPage'));
const StaffManageUsersPage = React.lazy(() => import('@/pages/staff/StaffManageUsersPage'));
const StaffSettingsPage = React.lazy(() => import('@/pages/staff/StaffSettingsPage'));
const ProjectDetailsPage = React.lazy(() => import('@/pages/staff/ProjectDetailsPage'));

// Custom wrapper for routes that require either staff_admin or staff_manager
function StaffManagerRoute({ children }) {
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

    if (role !== 'staff_admin' && role !== 'staff_manager') {
        return <Navigate to="/staff/dashboard" state={{ from: location }} replace />;
    }

    return children;
}

function LoadingFallback({ message = "Loading Page..." }) {
    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="text-white text-2xl font-semibold">{message}</div>
        </div>
    );
}

function AppContent() {
    const { user, loading, role } = useAuth();

    if (loading) {
        return <LoadingFallback message="Loading Jupiter Portal..." />;
    }

    return (
        <Routes>
            {/* Client Routes */}
            <Route path="/login" element={!user ? <LoginPage /> : (role === 'client' ? <Navigate to="/dashboard" /> : <Navigate to="/staff/dashboard" />)} />
            <Route path="/register" element={!user ? <RegisterPage /> : (role === 'client' ? <Navigate to="/dashboard" /> : <Navigate to="/staff/dashboard" />)} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="client">
                        <Layout>
                            <DashboardPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Staff Routes */}
            <Route path="/staff/login" element={!user ? <StaffLoginPage /> : (role === 'client' ? <Navigate to="/dashboard" /> : <Navigate to="/staff/dashboard" />)} />

            <Route
                path="/staff/dashboard"
                element={
                    <StaffProtectedRoute requiredRolePrefix="staff">
                        <StaffLayout>
                            <StaffDashboardPage />
                        </StaffLayout>
                    </StaffProtectedRoute>
                }
            />

            <Route
                path="/staff/create-project"
                element={
                    <StaffManagerRoute>
                        <StaffLayout>
                            <Suspense fallback={<LoadingFallback message="Loading Create Project Form..." />}>
                                <StaffCreateProjectPage />
                            </Suspense>
                        </StaffLayout>
                    </StaffManagerRoute>
                }
            />

            <Route
                path="/staff/manage-users"
                element={
                    <StaffManagerRoute>
                        <StaffLayout>
                            <Suspense fallback={<LoadingFallback message="Loading User Management..." />}>
                                <StaffManageUsersPage />
                            </Suspense>
                        </StaffLayout>
                    </StaffManagerRoute>
                }
            />

            <Route
                path="/staff/settings"
                element={
                    <StaffProtectedRoute requiredRolePrefix="staff">
                        <StaffLayout>
                            <Suspense fallback={<LoadingFallback message="Loading Settings..." />}>
                                <StaffSettingsPage />
                            </Suspense>
                        </StaffLayout>
                    </StaffProtectedRoute>
                }
            />

            <Route
                path="/staff/projects/:projectId"
                element={
                    <StaffProtectedRoute requiredRolePrefix="staff">
                        <StaffLayout>
                            <Suspense fallback={<LoadingFallback message="Loading project details..." />}>
                                <ProjectDetailsPage />
                            </Suspense>
                        </StaffLayout>
                    </StaffProtectedRoute>
                }
            />

            {/* Fallback Route */}
            <Route
                path="*"
                element={
                    <Navigate to={user ? (role === 'client' ? "/dashboard" : "/staff/dashboard") : "/login"} />
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
            <Toaster />
        </AuthProvider>
    );
}

export default App;
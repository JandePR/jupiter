import React, { useState } from 'react';
    import { Link, NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
    import { useAuth } from '@/contexts/authHooks';
    import { Button } from '@/components/ui/button';
    import { LogOut, UserCircle, LayoutDashboard, FolderPlus, Menu, X, Settings, Users, Zap } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';

    const StaffLayout = ({ children }) => {
      const { user, logout, role } = useAuth();
      const navigate = useNavigate();
      const location = useLocation();
      const [sidebarOpen, setSidebarOpen] = useState(false);

      const handleLogout = async () => {
        await logout();
        navigate('/staff/login');
      };

      const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/staff/dashboard')) return 'Staff Dashboard';
        if (path.includes('/staff/create-project')) return 'Create New Project';
        if (path.includes('/staff/manage-users')) return 'Manage Users';
        if (path.includes('/staff/settings')) return 'User Settings';
        return 'Staff Portal';
      };
      
      const getPageSubtitle = () => {
        const path = location.pathname;
        if (path.includes('/staff/dashboard')) return 'Manage and track all client projects.';
        if (path.includes('/staff/create-project')) return 'Enter the details for the new client project.';
        if (path.includes('/staff/manage-users')) return 'Oversee and manage staff and client accounts.';
        if (path.includes('/staff/settings')) return 'Update your personal information and password.';
        return '';
      };


      const navLinkClasses = ({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-sm font-medium
         ${isActive 
            ? 'bg-purple-600 text-white shadow-lg' 
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`;
      
      const mobileNavLinkClasses = navLinkClasses; 

      const sidebarVariants = {
        open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } }
      };
      
      const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900">
          <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
            <Zap className="h-8 w-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          </div>

          <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto">
            <NavLink to="/staff/dashboard" className={sidebarOpen ? mobileNavLinkClasses : navLinkClasses} onClick={() => sidebarOpen && setSidebarOpen(false)}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
            {(role === 'staff_admin' || role === 'staff_manager') && (
              <NavLink to="/staff/create-project" className={sidebarOpen ? mobileNavLinkClasses : navLinkClasses} onClick={() => sidebarOpen && setSidebarOpen(false)}>
                <FolderPlus className="h-5 w-5" />
                <span>Create Project</span>
              </NavLink>
            )}
            {(role === 'staff_admin' || role === 'staff_manager') && (
              <NavLink to="/staff/manage-users" className={sidebarOpen ? mobileNavLinkClasses : navLinkClasses} onClick={() => sidebarOpen && setSidebarOpen(false)}>
                <Users className="h-5 w-5" />
                <span>Manage Users</span>
              </NavLink>
            )}
            <NavLink to="/staff/settings" className={sidebarOpen ? mobileNavLinkClasses : navLinkClasses} onClick={() => sidebarOpen && setSidebarOpen(false)}>
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t border-slate-700 mt-auto">
            <div className="flex items-center space-x-3 mb-3 p-3 bg-slate-800 rounded-lg">
              <UserCircle className="h-10 w-10 text-purple-400" />
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[150px]">{user?.user_metadata?.name || user?.email}</p>
                <p className="text-xs text-slate-400 capitalize">{role?.replace(/staff_|_/g, ' ') || 'Staff'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center justify-start space-x-3 text-slate-300 hover:bg-red-700 hover:text-white transition-colors duration-150 py-3"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      );


      return (
        <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 shadow-2xl fixed h-full z-30">
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside 
                key="mobile-sidebar"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 shadow-2xl md:hidden transform"
              >
                <SidebarContent />
              </motion.aside>
            )}
          </AnimatePresence>
          {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)}></div>}


          <div className="flex-1 flex flex-col md:ml-64"> {/* Adjust margin for fixed desktop sidebar */}
            <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 md:hidden">
                      {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                    <div className="hidden md:block">
                      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{getPageTitle()}</h1>
                      {getPageSubtitle() && <p className="text-sm text-slate-500 dark:text-slate-400">{getPageSubtitle()}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Any header items like notifications can go here */}
                  </div>
                </div>
              </div>
               {/* Mobile Page Title - visible below hamburger */}
               <div className="md:hidden px-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{getPageTitle()}</h1>
                  {getPageSubtitle() && <p className="text-xs text-slate-500 dark:text-slate-400">{getPageSubtitle()}</p>}
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {children || <Outlet />}
            </main>
            
            <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
              © {new Date().getFullYear()} Jupiter Staff Portal. All rights reserved.
            </footer>
          </div>
        </div>
      );
    };

    export default StaffLayout;
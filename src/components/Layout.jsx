import React from 'react';
    import { useAuth } from '@/contexts/authHooks'; // Corrected import path
    import { Button } from '@/components/ui/button';
    import { LogOut, UserCircle, Zap } from 'lucide-react';
    import { motion } from 'framer-motion';

    const Layout = ({ children }) => {
      const { user, logout } = useAuth();

      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-950">
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white dark:bg-slate-800 shadow-lg py-4 px-6 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700"
          >
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Jupiter <span className="text-purple-600 dark:text-purple-400">Automation</span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                    <UserCircle className="h-5 w-5" />
                    <span>{user?.user_metadata?.name || user?.email}</span>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.header>
          
          <main className="flex-grow container mx-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {children}
            </motion.div>
          </main>

          <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
            <p>&copy; {new Date().getFullYear()} Jupiter Drawing Automation System. All rights reserved.</p>
            <p>Powered by Hostinger Horizons</p>
          </footer>
        </div>
      );
    };

    export default Layout;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authHooks';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectFormModule from './create-project-components/ProjectFormModule';

const StaffCreateProjectPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // Check permissions
  if (role !== 'staff_admin' && role !== 'staff_manager') {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center p-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You do not have permission to create new projects.
          </p>
        </div>
    );
  }

  const handleProjectCreated = (newProject) => {
    // Navigate to the project details or dashboard
    navigate('/staff/dashboard', {
      state: {
        newProjectId: newProject.id,
        message: `Project ${newProject.project_number} created successfully!`
      }
    });
  };

  const handleCancel = () => {
    navigate('/staff/dashboard');
  };

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-6"
      >
        <ProjectFormModule
            onSuccess={handleProjectCreated}
            onCancel={handleCancel}
        />
      </motion.div>
  );
};

export default StaffCreateProjectPage;
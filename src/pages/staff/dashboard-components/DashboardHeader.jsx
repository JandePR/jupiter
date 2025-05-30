import React from 'react';
    import { Button } from '@/components/ui/button';
    import { FolderPlus } from 'lucide-react';
    import { Link } from 'react-router-dom';

    const DashboardHeader = ({ userRole }) => {
      // The main title and subtitle are now handled by StaffLayout
      // This component will just render the "Create New Project" button if applicable.
      if (userRole !== 'staff_admin' && userRole !== 'staff_manager') {
        return null;
      }

      return (
        <div className="flex justify-end mb-6">
            <Link to="/staff/create-project">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md py-2 px-4">
                <FolderPlus className="mr-2 h-5 w-5" /> Create New Project
              </Button>
            </Link>
        </div>
      );
    };

    export default DashboardHeader;
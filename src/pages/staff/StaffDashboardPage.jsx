import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { useAuth } from '@/contexts/authHooks';
    import { supabase } from '@/lib/supabaseClient';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { motion } from 'framer-motion';
    import { Zap } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';

    import DashboardHeader from './dashboard-components/DashboardHeader';
    import ProjectFilters from './dashboard-components/ProjectFilters';
    import ProjectTable from './dashboard-components/ProjectTable';

    const StaffDashboardPage = () => {
      const { user, role } = useAuth();
      const { toast } = useToast();
      
      const [projects, setProjects] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('all');
      const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
      const [expandedProjectId, setExpandedProjectId] = useState(null);

      const fetchProjects = useCallback(async () => {
        if (!user || !role) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        
        let query = supabase.from('projects').select(`
          id, 
          project_name, 
          status, 
          type,
          address,
          notes,
          created_at, 
          updated_at,
          client_id,
          client_email,
          assigned_staff_id,
          phases,
          current_phase_index,
          start_date,
          deadline,
          client_profile:client_id (full_name, email), 
          assigned_staff_profile:assigned_staff_id (full_name, email)
        `);

        if (role === 'staff_drafter') {
          query = query.eq('assigned_staff_id', user.id);
        }
        
        const { data, error } = await query.order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });

        if (error) {
          console.error('Error fetching projects:', error);
          toast({ variant: "destructive", title: "Error Fetching Projects", description: "Could not fetch project data. " + error.message });
          setProjects([]);
        } else {
          setProjects(data || []);
        }
        setIsLoading(false);
      }, [user, role, toast, sortConfig.key, sortConfig.direction]);

      useEffect(() => {
        fetchProjects();
      }, [fetchProjects]);

      const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
      };

      const filteredProjects = useMemo(() => {
        return projects.filter(project => {
          const lowerSearchTerm = searchTerm.toLowerCase();
          const clientFullName = project.client_profile?.full_name || '';
          const clientProfileEmail = project.client_profile?.email || '';
          const projectClientEmail = project.client_email || '';
          const assignedStaffFullName = project.assigned_staff_profile?.full_name || '';

          const matchesSearchTerm = 
            project.project_name?.toLowerCase().includes(lowerSearchTerm) ||
            clientFullName.toLowerCase().includes(lowerSearchTerm) ||
            clientProfileEmail.toLowerCase().includes(lowerSearchTerm) ||
            projectClientEmail.toLowerCase().includes(lowerSearchTerm) ||
            assignedStaffFullName.toLowerCase().includes(lowerSearchTerm) ||
            project.address?.toLowerCase().includes(lowerSearchTerm);
            
          const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
          return matchesSearchTerm && matchesStatus;
        });
      }, [projects, searchTerm, filterStatus]);

      const toggleExpandProject = (projectId) => {
        setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
      };
      
      const handleDeleteProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
          return;
        }
        try {
          const { error } = await supabase.from('projects').delete().eq('id', projectId);
          if (error) throw error;
          toast({ title: "Success", description: "Project deleted successfully." });
          fetchProjects(); 
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not delete project: " + error.message });
        }
      };

      const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
      };
    
      const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      };

      if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]"> {/* Adjusted height for footer */}
            <Zap className="h-16 w-16 text-purple-500 animate-pulse mb-4" />
            <p className="text-xl text-slate-600 dark:text-slate-300">Loading projects...</p>
          </div>
        );
      }

      return (
        <motion.div 
          className="space-y-6"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <DashboardHeader userRole={role} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Project Overview</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Filter and search projects.</CardDescription>
                <ProjectFilters 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                />
              </CardHeader>
              <CardContent>
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-10">
                    <Zap className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No projects found matching your criteria.</p>
                  </div>
                ) : (
                  <ProjectTable 
                    projects={filteredProjects}
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                    expandedProjectId={expandedProjectId}
                    toggleExpandProject={toggleExpandProject}
                    handleDeleteProject={handleDeleteProject}
                    userRole={role}
                    userId={user?.id}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    };

    export default StaffDashboardPage;
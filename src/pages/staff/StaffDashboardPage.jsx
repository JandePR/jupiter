import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import DashboardHeader from './dashboard-components/DashboardHeader';
import ProjectFilters from './dashboard-components/ProjectFilters';
import ProjectTable from './dashboard-components/ProjectTable';
import { PROJECT_STATUSES } from './create-project-components/utils';

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

  // Calculate statistics
  const projectStats = useMemo(() => {
    const stats = {
      total: filteredProjects.length,
      byStatus: {},
      overdue: 0,
      dueSoon: 0
    };

    const today = new Date();

    filteredProjects.forEach(project => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;

      // Check deadlines
      if (project.deadline) {
        const deadline = new Date(project.deadline);
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0 && project.status !== PROJECT_STATUSES.COMPLETED) {
          stats.overdue++;
        } else if (daysUntil >= 0 && daysUntil <= 7 && project.status !== PROJECT_STATUSES.COMPLETED) {
          stats.dueSoon++;
        }
      }
    });

    return stats;
  }, [filteredProjects]);

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
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
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

        {/* Statistics Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {role === 'staff_drafter' ? 'Assigned to you' : 'All projects'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.byStatus[PROJECT_STATUSES.IN_PROGRESS] || 0}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.byStatus[PROJECT_STATUSES.COMPLETED] || 0}</div>
              <p className="text-xs text-muted-foreground">Finished projects</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.overdue + projectStats.dueSoon}</div>
              <p className="text-xs text-muted-foreground">
                {projectStats.overdue > 0 && `${projectStats.overdue} overdue`}
                {projectStats.overdue > 0 && projectStats.dueSoon > 0 && ', '}
                {projectStats.dueSoon > 0 && `${projectStats.dueSoon} due soon`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Project Overview</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Filter and manage your projects.</CardDescription>
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
                      onProjectUpdate={fetchProjects}
                  />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
  );
};

export default StaffDashboardPage;
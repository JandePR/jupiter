import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const AssignedProjectsWidget = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAssignedProjects();
    }
  }, [user]);

  const fetchAssignedProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, deadline, status, phases, current_phase_index')
        .or(`assigned_staff_id.eq.${user.id},lead_drafter_id.eq.${user.id},project_manager_id.eq.${user.id}`)
        .not('status', 'eq', 'Completed')
        .order('deadline', { ascending: true })
        .limit(5);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectProgress = (project) => {
    if (!project.phases || project.phases.length === 0) return 0;

    const totalPhases = project.phases.length;
    const weightedProgress = project.phases.reduce((sum, phase) => {
      if (phase.status === 'completed') return sum + 100;
      if (phase.status === 'in_progress') return sum + (phase.completion || 0);
      return sum;
    }, 0);

    return Math.round(weightedProgress / totalPhases);
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { label: 'No deadline', color: 'bg-slate-100 text-slate-700' };

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)} days overdue`, color: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' };
    } else if (diffDays === 0) {
      return { label: 'Due today', color: 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300' };
    } else if (diffDays <= 3) {
      return { label: `${diffDays} days left`, color: 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300' };
    } else if (diffDays <= 7) {
      return { label: `${diffDays} days left`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' };
    } else {
      return { label: `${diffDays} days left`, color: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' };
    }
  };

  const getCurrentPhase = (project) => {
    if (!project.phases || !project.current_phase_index) {
      return 'Not started';
    }

    const currentPhase = project.phases[project.current_phase_index];
    return currentPhase ? currentPhase.name : 'Unknown';
  };

  const handleNavigateToProject = (projectId) => {
    navigate(`/staff/projects/${projectId}`);
  };

  const getStatusIcon = (deadline) => {
    if (!deadline) return <Clock className="h-4 w-4 text-slate-400" />;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (diffDays <= 3) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-md">
          <Briefcase className="mr-2 h-5 w-5 text-purple-500" />
          My Assigned Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No projects assigned to you</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div 
                key={project.id} 
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => handleNavigateToProject(project.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{project.project_name}</div>
                  <Badge className={getDeadlineStatus(project.deadline).color}>
                    <Calendar className="mr-1 h-3 w-3" />
                    {getDeadlineStatus(project.deadline).label}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Current phase: {getCurrentPhase(project)}</span>
                  </div>
                  <span>{calculateProjectProgress(project)}% complete</span>
                </div>

                <Progress value={calculateProjectProgress(project)} className="h-1" />
              </div>
            ))}

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-2"
              onClick={() => navigate('/staff/dashboard')}
            >
              View all projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignedProjectsWidget;

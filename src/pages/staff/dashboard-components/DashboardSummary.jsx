import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock3,
  Users,
  Hourglass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import RecentActivityFeed from './RecentActivityFeed';
import AssignedProjectsWidget from './AssignedProjectsWidget';

const DashboardSummary = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    overdueProjects: 0,
    completedThisMonth: 0,
    activePhases: [],
    upcomingDeadlines: [],
    timeTracking: {
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0
    },
    phasesDistribution: {}
  });

  const fetchDashboardMetrics = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get projects query base
      let projectsQuery = supabase.from('projects').select('*');

      // If user is not admin or manager, only get their projects
      if (role !== 'staff_admin' && role !== 'staff_manager') {
        projectsQuery = projectsQuery
            .or(`assigned_staff_id.eq.${user.id},lead_drafter_id.eq.${user.id},project_manager_id.eq.${user.id}`);
      }

      const { data: projects, error: projectsError } = await projectsQuery;

      if (projectsError) throw projectsError;

      // Get time tracking data for the user
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: timeEntries, error: timeError } = await supabase
          .from('phase_time_tracking')
          .select('date, hours')
          .eq('staff_id', user.id)
          .gte('date', startOfLastWeek.toISOString().split('T')[0]);

      if (timeError) throw timeError;

      // Calculate metrics
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Active');
      const overdueProjects = projects.filter(p => {
        if (p.status === 'Completed') return false;
        if (!p.deadline) return false;
        return new Date(p.deadline) < now;
      });

      const completedThisMonth = projects.filter(p => {
        if (p.status !== 'Completed') return false;
        const updatedAt = new Date(p.updated_at);
        return updatedAt >= startOfThisMonth;
      });

      // Get active phases across all projects
      const activePhases = [];
      projects.forEach(project => {
        if (!project.phases || project.status === 'Completed') return;

        project.phases.forEach((phase, index) => {
          if (phase.status === 'in_progress' || phase.status === 'In Progress') {
            activePhases.push({
              projectName: project.project_name,
              projectId: project.id,
              phaseName: phase.name,
              phaseIndex: index,
              completion: phase.completion || 0
            });
          }
        });
      });

      // Get upcoming deadlines
      const upcomingDeadlines = projects
          .filter(p => p.status !== 'Completed' && p.deadline)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 5)
          .map(p => ({
            projectName: p.project_name,
            projectId: p.id,
            deadline: p.deadline,
            daysRemaining: Math.ceil((new Date(p.deadline) - now) / (1000 * 60 * 60 * 24))
          }));

      // Calculate time tracking metrics
      const thisWeekHours = timeEntries
          .filter(entry => new Date(entry.date) >= startOfWeek)
          .reduce((sum, entry) => sum + (entry.hours || 0), 0);

      const lastWeekHours = timeEntries
          .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startOfLastWeek && entryDate < startOfWeek;
          })
          .reduce((sum, entry) => sum + (entry.hours || 0), 0);

      const thisMonthHours = timeEntries
          .filter(entry => new Date(entry.date) >= startOfMonth)
          .reduce((sum, entry) => sum + (entry.hours || 0), 0);

      // Calculate phase distribution
      const phasesDistribution = {};
      projects.forEach(project => {
        if (!project.phases) return;

        project.phases.forEach(phase => {
          const status = phase.status || 'pending';
          if (!phasesDistribution[status]) {
            phasesDistribution[status] = 0;
          }
          phasesDistribution[status]++;
        });
      });

      setMetrics({
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        overdueProjects: overdueProjects.length,
        completedThisMonth: completedThisMonth.length,
        activePhases,
        upcomingDeadlines,
        timeTracking: {
          thisWeek: thisWeekHours,
          lastWeek: lastWeekHours,
          thisMonth: thisMonthHours
        },
        phasesDistribution
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'pending':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
    }
  };

  const formatHours = (hours) => {
    return parseFloat(hours || 0).toFixed(1);
  };

  const calculateWeeklyChange = () => {
    if (metrics.timeTracking.lastWeek === 0) {
      return metrics.timeTracking.thisWeek > 0 ? 100 : 0;
    }
    return Math.round(((metrics.timeTracking.thisWeek - metrics.timeTracking.lastWeek) / metrics.timeTracking.lastWeek) * 100);
  };

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Key Metrics Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>Active Projects</span>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeProjects > 0
                    ? `${Math.round((metrics.activeProjects / Math.max(metrics.totalProjects, 1)) * 100)}% of total projects`
                    : 'No active projects'}
              </p>
              <Progress
                  value={metrics.totalProjects ? (metrics.activeProjects / metrics.totalProjects) * 100 : 0}
                  className="h-1 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>Overdue</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.overdueProjects}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.overdueProjects > 0
                    ? `${Math.round((metrics.overdueProjects / Math.max(metrics.totalProjects, 1)) * 100)}% of total projects`
                    : 'No overdue projects'}
              </p>
              <Progress
                  value={metrics.totalProjects ? (metrics.overdueProjects / metrics.totalProjects) * 100 : 0}
                  className="h-1 mt-2 bg-red-100 dark:bg-red-950"
                  indicatorColor="bg-red-500"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>Completed This Month</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.completedThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.completedThisMonth > 0 ? `${metrics.completedThisMonth} project(s) completed` : 'No completions yet'}
              </p>
              <Progress
                  value={metrics.completedThisMonth > 0 ? 100 : 0}
                  className="h-1 mt-2 bg-green-100 dark:bg-green-950"
                  indicatorColor="bg-green-500"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>Hours This Week</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatHours(metrics.timeTracking.thisWeek)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {calculateWeeklyChange() === 0 ? (
                    'Same as last week'
                ) : (
                    <>
                  <span className={calculateWeeklyChange() > 0 ? 'text-green-500' : 'text-red-500'}>
                    {calculateWeeklyChange() > 0 ? '+' : ''}{calculateWeeklyChange()}%
                  </span>
                      <span className="ml-1">vs last week ({formatHours(metrics.timeTracking.lastWeek)}h)</span>
                    </>
                )}
              </p>
              <Progress
                  value={metrics.timeTracking.thisWeek > 40 ? 100 : (metrics.timeTracking.thisWeek / 40) * 100}
                  className="h-1 mt-2 bg-blue-100 dark:bg-blue-950"
                  indicatorColor="bg-blue-500"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Phases */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Active Phases</span>
                <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.activePhases.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    <Clock3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No active phases</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                    {metrics.activePhases
                        .slice(0, expanded ? metrics.activePhases.length : 4)
                        .map((phase, index) => (
                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <div className="font-medium text-sm">{phase.phaseName}</div>
                                  <div className="text-xs text-slate-500">{phase.projectName}</div>
                                </div>
                                <Badge className={getStatusColor('in_progress')}>
                                  In Progress
                                </Badge>
                              </div>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>Progress</span>
                                  <span>{phase.completion}%</span>
                                </div>
                                <Progress value={phase.completion} className="h-1" />
                              </div>
                            </div>
                        ))
                    }
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No upcoming deadlines</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                    {metrics.upcomingDeadlines.map((deadline, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${deadline.daysRemaining < 0
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : deadline.daysRemaining <= 7
                                    ? 'bg-amber-50 dark:bg-amber-900/20'
                                    : 'bg-slate-50 dark:bg-slate-800/50'}`}
                        >
                          <div className="font-medium text-sm">{deadline.projectName}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs">
                              {new Date(deadline.deadline).toLocaleDateString()}
                            </div>
                            <Badge
                                className={deadline.daysRemaining < 0
                                    ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'
                                    : deadline.daysRemaining <= 7
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300'
                                        : 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300'}
                            >
                              {deadline.daysRemaining < 0
                                  ? `${Math.abs(deadline.daysRemaining)} days overdue`
                                  : deadline.daysRemaining === 0
                                      ? 'Due today'
                                      : `${deadline.daysRemaining} days left`}
                            </Badge>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Tracking Stats */}
          {!loading && metrics.timeTracking.thisMonth > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Hourglass className="h-5 w-5 mr-2 text-purple-500" />
                    Time Tracking Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">This Week</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatHours(metrics.timeTracking.thisWeek)}h
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Last Week</p>
                      <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                        {formatHours(metrics.timeTracking.lastWeek)}h
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">This Month</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatHours(metrics.timeTracking.thisMonth)}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Assigned Projects Widget */}
          <AssignedProjectsWidget />
        </div>

        {/* Recent Activity Feed */}
        <RecentActivityFeed />
      </motion.div>
  );
};

export default DashboardSummary;
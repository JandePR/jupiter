import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import { Activity, Clock, CheckCircle, Edit, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const RecentActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_activity_log')
        .select(`
          *,
          performer:performed_by(full_name),
          project:project_id(project_name, project_number)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'project_created':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'project_updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'phase_updated':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'time_logged':
        return <Clock className="h-4 w-4 text-slate-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatActivityText = (activity) => {
    const projectName = activity.project?.project_name || 'Unknown Project';
    const personName = activity.performer?.full_name || 'Someone';

    switch (activity.action) {
      case 'project_created':
        return `${personName} created project ${projectName}`;
      case 'project_updated':
        return `${personName} updated project ${projectName}`;
      case 'phase_updated':
        return `${personName} updated phase ${activity.details?.phase_name || ''} on ${projectName}`;
      case 'comment_added':
        return `${personName} commented on ${projectName}`;
      case 'time_logged':
        return `${personName} logged ${activity.details?.hours || ''} hours on ${projectName}`;
      default:
        return `${personName} performed action on ${projectName}`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRecentActivity} 
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors"
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{formatActivityText(activity)}</p>
                  <p className="text-xs text-slate-500">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;

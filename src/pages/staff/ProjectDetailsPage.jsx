import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Zap, FileText, Layers, Info, ArrowLeft, Calendar, MapPin, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/authHooks';
import { useToast } from '@/components/ui/use-toast';
import ProjectPhaseManager from './ProjectPhaseManager';
import ProjectFilesTab from './ProjectFilesTab';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const { user, role } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    client_profile:client_id(full_name, email, phone),
                    project_manager_profile:project_manager_id(full_name, email),
                    lead_drafter_profile:lead_drafter_id(full_name, email),
                    assigned_staff_profile:assigned_staff_id(full_name, email)
                `)
                .eq('id', projectId)
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            if (!data) {
                throw new Error('Project not found');
            }
            
            setProject(data);
        } catch (error) {
            console.error('Error loading project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to load project details'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
            case 'in_progress':
            case 'in progress':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
            case 'in_review':
            case 'in review':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
            case 'approved':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300';
            case 'draft':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
            case 'on_hold':
            case 'on hold':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
            case 'cancelled':
                return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDaysUntilDeadline = (deadline) => {
        if (!deadline) return null;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Zap className="h-16 w-16 text-purple-500 animate-pulse mb-4" />
                <p className="text-xl text-slate-600 dark:text-slate-300">Loading project details...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
            >
                <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Project Not Found
                    </h2>
                    <p className="text-slate-500 mb-6">
                        The project you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Button onClick={() => navigate('/staff/dashboard')} className="inline-flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </motion.div>
        );
    }

    const daysUntilDeadline = getDaysUntilDeadline(project.deadline);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/staff/dashboard')}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>

            {/* Project Header */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {project.project_name}
                            </CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center">
                                    <User className="mr-1 h-4 w-4" />
                                    {project.client_profile?.full_name || project.client_email || 'Unknown Client'}
                                </span>
                                {project.address && (
                                    <span className="flex items-center">
                                        <MapPin className="mr-1 h-4 w-4" />
                                        {project.address}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                            <Badge className={getStatusBadgeClass(project.status)} variant="secondary">
                                {project.status?.replace('_', ' ') || 'Unknown Status'}
                            </Badge>
                            {project.deadline && (
                                <div className="text-right">
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Calendar className="mr-1 h-4 w-4" />
                                        Deadline
                                    </div>
                                    <div className={`text-sm font-medium ${
                                        daysUntilDeadline !== null && daysUntilDeadline < 0 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : daysUntilDeadline !== null && daysUntilDeadline <= 7 
                                                ? 'text-orange-600 dark:text-orange-400'
                                                : 'text-slate-700 dark:text-slate-300'
                                    }`}>
                                        {formatDate(project.deadline)}
                                        {daysUntilDeadline !== null && (
                                            <div className="text-xs">
                                                {daysUntilDeadline < 0
                                                    ? `${Math.abs(daysUntilDeadline)} days overdue`
                                                    : `${daysUntilDeadline} days left`
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Project Type</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                {project.type || 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Start Date</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                {formatDate(project.start_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Project Manager</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                {project.project_manager_profile?.full_name || 'Not assigned'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Lead Drafter</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                {project.lead_drafter_profile?.full_name || 'Not assigned'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="phases" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="phases" className="flex items-center">
                        <Layers className="mr-2 h-4 w-4" />
                        Phases
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center">
                        <Info className="mr-2 h-4 w-4" />
                        Details
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="phases" className="mt-6">
                    <ProjectPhaseManager project={project} onUpdate={loadProject} />
                </TabsContent>

                <TabsContent value="files" className="mt-6">
                    <ProjectFilesTab project={project} onUpdate={loadProject} />
                </TabsContent>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
                                            Project Information
                                        </h3>
                                        <dl className="space-y-4">
                                            <div>
                                                <dt className="text-slate-500 text-sm font-medium">Full Address</dt>
                                                <dd className="text-slate-800 dark:text-slate-200 mt-1">
                                                    {project.address || 'Not provided'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500 text-sm font-medium">Client Email</dt>
                                                <dd className="text-slate-800 dark:text-slate-200 mt-1">
                                                    {project.client_profile?.email || project.client_email || 'Not provided'}
                                                </dd>
                                            </div>
                                            {project.client_profile?.phone && (
                                                <div>
                                                    <dt className="text-slate-500 text-sm font-medium">Client Phone</dt>
                                                    <dd className="text-slate-800 dark:text-slate-200 mt-1">
                                                        {project.client_profile.phone}
                                                    </dd>
                                                </div>
                                            )}
                                            <div>
                                                <dt className="text-slate-500 text-sm font-medium">Created</dt>
                                                <dd className="text-slate-800 dark:text-slate-200 mt-1">
                                                    {formatDate(project.created_at)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500 text-sm font-medium">Last Updated</dt>
                                                <dd className="text-slate-800 dark:text-slate-200 mt-1">
                                                    {formatDate(project.updated_at)}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
                                            Project Notes
                                        </h3>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                                {project.notes || 'No notes available for this project.'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {project.assigned_staff_profile && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
                                                Assigned Staff
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                                <p className="text-slate-800 dark:text-slate-200 font-medium">
                                                    {project.assigned_staff_profile.full_name}
                                                </p>
                                                <p className="text-slate-500 text-sm">
                                                    {project.assigned_staff_profile.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default ProjectDetailsPage;
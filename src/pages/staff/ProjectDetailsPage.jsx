import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, FileText, Layers, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/authHooks';
import { useToast } from '@/components/ui/use-toast';
import ProjectPhaseManager from './ProjectPhaseManager';
import ProjectFilesTab from './ProjectFilesTab';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          client_profile:client_id(full_name, email),
          project_manager_profile:project_manager_id(full_name),
          lead_drafter_profile:lead_drafter_id(full_name)
        `)
                .eq('id', projectId)
                .single();

            if (error) throw error;
            setProject(data);
        } catch (error) {
            console.error('Error loading project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load project details'
            });
        } finally {
            setLoading(false);
        }
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
            <div className="text-center py-10">
                <p className="text-xl text-slate-600 dark:text-slate-300">Project not found</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Project Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{project.project_name}</CardTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                            <p className="text-slate-500">Client</p>
                            <p className="font-medium">{project.client_profile?.full_name}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Project Type</p>
                            <p className="font-medium">{project.type}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Status</p>
                            <p className="font-medium">{project.status}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Deadline</p>
                            <p className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="phases" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
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
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Project Information</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div>
                                            <dt className="text-slate-500">Address</dt>
                                            <dd>{project.address}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Start Date</dt>
                                            <dd>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Project Manager</dt>
                                            <dd>{project.project_manager_profile?.full_name || 'Not assigned'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Lead Drafter</dt>
                                            <dd>{project.lead_drafter_profile?.full_name || 'Not assigned'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Notes</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {project.notes || 'No notes available'}
                                    </p>
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
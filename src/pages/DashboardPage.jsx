import React, { useState, useEffect } from 'react';
    import { useAuth } from '@/contexts/authHooks'; // Corrected import path
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { motion } from 'framer-motion';
    import { Briefcase, MessageSquarePlus, CheckCircle, AlertCircle, Clock, FileText, Zap } from 'lucide-react';
    import ProjectPhaseCard from '@/components/ProjectPhaseCard';
    import { supabase } from '@/lib/supabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const JUPITER_PHASES_DETAILS = [
      { name: "Client Intake & Qualification", staff_role: "Emily (Sales)"},
      { name: "Site Data Collection", staff_role: "Site Team"},
      { name: "Pricing & Approval", staff_role: "Emily (Sales)"},
      { name: "Production – Drafting", staff_role: "Drafting Team"},
      { name: "Review & Stamping", staff_role: "QA Team"},
      { name: "Delivery & Permit Support", staff_role: "Support Team"},
      { name: "Closing & Follow-up", staff_role: "Account Manager"}
    ];

    const DashboardPage = () => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [projectData, setProjectData] = useState(null);
      const [isLoadingProject, setIsLoadingProject] = useState(true);

      useEffect(() => {
        const fetchProjectData = async () => {
          if (!user?.id) {
            setIsLoadingProject(false);
            return;
          }
          setIsLoadingProject(true);
          
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', user.id) 
            .single(); 

          if (error && error.code !== 'PGRST116') { 
            console.error('Error fetching project data:', error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch project data." });
            setProjectData(null);
          } else if (data) {
             const phasesWithDetails = JUPITER_PHASES_DETAILS.map((phaseDetail, index) => {
              const dbPhase = data.phases ? data.phases[index] : {};
              return {
                name: phaseDetail.name,
                status: dbPhase?.status || (index === data.current_phase_index ? 'In Progress' : (index < data.current_phase_index ? 'Completed' : 'Pending')),
                notes: dbPhase?.notes || '',
                assigned_staff: dbPhase?.assigned_staff || phaseDetail.staff_role,
                documents: dbPhase?.documents || [],
              };
            });

            setProjectData({ ...data, phases: phasesWithDetails });
          } else {
            setProjectData(null); 
          }
          setIsLoadingProject(false);
        };

        fetchProjectData();
      }, [user, toast]);
      
      const overallProgress = projectData && projectData.phases
      ? ((projectData.current_phase_index + (projectData.phases[projectData.current_phase_index]?.status === 'Completed' ? 1 : (projectData.phases[projectData.current_phase_index]?.status === 'In Progress' ? 0.5 : 0))) / JUPITER_PHASES_DETAILS.length) * 100
      : 0;
      
      const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
      };

      const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      };

      if (isLoadingProject) {
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <Zap className="h-16 w-16 text-purple-500 animate-pulse mb-4" />
            <p className="text-xl text-slate-600 dark:text-slate-300">Loading your project details...</p>
          </div>
        );
      }

      if (!projectData) {
        return (
          <motion.div 
            className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No Project Assigned Yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
              It looks like there isn't a project linked to your account at the moment. 
              If you've recently signed up, please allow some time for our team to assign your project.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              If you believe this is an error or need assistance, please contact support.
            </p>
          </motion.div>
        );
      }
      
      const currentUserName = user?.user_metadata?.name || user?.email;

      return (
        <motion.div 
          className="space-y-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Welcome, {currentUserName}!</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Here's the latest on your Jupiter Automation project.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            <Card className="col-span-3 md:col-span-1 bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 border-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">Project Name</CardTitle>
                <Briefcase className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{projectData.project_name}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 border-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">Overall Status</CardTitle>
                {projectData.status === 'Completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-yellow-500" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{projectData.status}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 border-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">Overall Progress</CardTitle>
                 <Zap className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{Math.round(overallProgress)}%</div>
                <Progress value={overallProgress} className="w-full mt-1 h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-indigo-600" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-2xl text-slate-800 dark:text-slate-100"><Zap className="mr-2 h-7 w-7 text-purple-600 dark:text-purple-400" /> Project Phases</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">Track the progress of your project through each phase.</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md">
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Request Update
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {projectData.phases.map((phase, index) => (
                  <ProjectPhaseCard 
                    key={index} 
                    phase={phase} 
                    phaseIndex={index} 
                    currentPhaseIndex={projectData.current_phase_index} 
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-slate-800 dark:text-slate-100"><FileText className="mr-2 h-7 w-7 text-purple-600 dark:text-purple-400" /> Project Timeline (Gantt)</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Visual overview of your project's schedule. (Placeholder)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                  <p className="text-slate-500 dark:text-slate-400">Gantt Chart / Timeline Visualization Coming Soon</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      );
    };

    export default DashboardPage;
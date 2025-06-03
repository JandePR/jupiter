import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authHooks';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderPlus, Zap, AlertTriangle } from 'lucide-react';

import ProjectInformationFormSection from './create-project-components/ProjectInformationFormSection';
import ClientInformationFormSection from './create-project-components/ClientInformationFormSection';
import StaffAssignmentFormSection from './create-project-components/StaffAssignmentFormSection';
import {
  JUPITER_PHASES_TEMPLATE,
  PROJECT_STATUSES,
  fetchInitialData,
  handleClientLogic,
  createProjectInSupabase
} from './create-project-components/utils';

const StaffCreateProjectPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  const [clientSelectionMode, setClientSelectionMode] = useState('new');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [existingClientId, setExistingClientId] = useState('');

  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [notes, setNotes] = useState('');

  const [existingClients, setExistingClients] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setFormError(null);
      try {
        const data = await fetchInitialData(toast);
        setExistingClients(data.existingClients);
        setStaffMembers(data.staffMembers);
      } catch (err) {
        console.error('Initial data load failed:', err);
        toast({ variant: "destructive", title: 'Error Loading Data', description: err.message || "Could not load necessary data for the form." });
        setFormError("Failed to load initial data. Please try refreshing the page.");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || (role !== 'staff_admin' && role !== 'staff_manager')) {
      toast({ variant: "destructive", title: "Unauthorized", description: "You are not authorized to create projects." });
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    // Basic validation
    if (!projectName || !projectType || !projectAddress) {
      toast({ variant: "destructive", title: "Validation Error", description: "Project Name, Type, and Address are required."});
      setFormError("Project Name, Type, and Address are required.");
      setIsSubmitting(false);
      return;
    }
    if (startDate && deadline && new Date(startDate) > new Date(deadline)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Start Date cannot be after Deadline."});
      setFormError("Start Date cannot be after Deadline.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { finalClientId, finalClientEmail } = await handleClientLogic({
        clientSelectionMode, clientName, clientEmail, existingClientId, existingClients, toast
      });

      // Determine initial status based on whether staff is assigned
      const initialStatus = assignedStaffId ? PROJECT_STATUSES.PENDING : PROJECT_STATUSES.DRAFT;

      const projectData = {
        project_name: projectName,
        type: projectType,
        client_id: finalClientId || null,
        client_email: finalClientEmail,
        address: projectAddress,
        start_date: startDate || null,
        deadline: deadline || null,
        assigned_staff_id: assignedStaffId || null,
        notes,
        status: initialStatus,
        current_phase_index: 0,
        phases: JUPITER_PHASES_TEMPLATE.map(phase => ({
          ...phase,
          assigned_staff: assignedStaffId || ""
        })),
        created_by: user.id,
      };

      const newProject = await createProjectInSupabase(projectData);

      toast({
        title: "Success!",
        description: `Project "${newProject.project_name}" has been created successfully.`
      });

      navigate('/staff/dashboard');
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error.message || "An unexpected error occurred during project creation.";
      if (error.message !== "Validation Error" && error.message !== "Email Check Error" && error.message !== "Email Conflict Error" && error.message !== "Client Data Error") {
        toast({ variant: "destructive", title: "Project Creation Failed", description: errorMessage });
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
          <Zap className="h-16 w-16 text-purple-500 animate-pulse mb-4" />
          <p className="text-xl text-slate-600 dark:text-slate-300">Loading form data...</p>
        </div>
    );
  }

  if (role !== 'staff_admin' && role !== 'staff_manager') {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center p-4">
          <Zap className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You do not have permission to create new projects.</p>
        </div>
    );
  }

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
      >
        <Card className="bg-white dark:bg-slate-800 shadow-2xl">
          <CardContent className="pt-6">
            {formError && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{formError}</span>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
              <ProjectInformationFormSection
                  projectName={projectName} setProjectName={setProjectName}
                  projectType={projectType} setProjectType={setProjectType}
                  projectAddress={projectAddress} setProjectAddress={setProjectAddress}
                  startDate={startDate} setStartDate={setStartDate}
                  deadline={deadline} setDeadline={setDeadline}
              />
              <ClientInformationFormSection
                  clientSelectionMode={clientSelectionMode} setClientSelectionMode={setClientSelectionMode}
                  clientName={clientName} setClientName={setClientName}
                  clientEmail={clientEmail} setClientEmail={setClientEmail}
                  existingClients={existingClients}
                  existingClientId={existingClientId} setExistingClientId={setExistingClientId}
              />
              <StaffAssignmentFormSection
                  staffMembers={staffMembers}
                  assignedStaffId={assignedStaffId} setAssignedStaffId={setAssignedStaffId}
                  notes={notes} setNotes={setNotes}
              />
              <CardFooter className="flex justify-end pt-8">
                <Button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg" disabled={isSubmitting || isLoadingData}>
                  {isSubmitting ? 'Creating Project...' : <><FolderPlus className="mr-2 h-5 w-5" /> Create Project</>}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </motion.div>
  );
};

export default StaffCreateProjectPage;
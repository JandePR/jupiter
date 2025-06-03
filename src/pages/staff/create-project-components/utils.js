import { supabase } from '@/lib/supabaseClient';

export const JUPITER_PHASES_TEMPLATE = [
    { name: "Client Intake & Qualification", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Site Data Collection", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Pricing & Approval", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Production – Drafting", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Review & Stamping", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Delivery & Permit Support", status: "Pending", notes: "", assigned_staff: "", documents: [] },
    { name: "Closing & Follow-up", status: "Pending", notes: "", assigned_staff: "", documents: [] }
];

export const PROJECT_STATUSES = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    CANCELLED: 'Cancelled'
};

export const fetchInitialData = async (toast) => {
    try {
        const [clientsRes, staffRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name, email').eq('role', 'client'),
            supabase.from('profiles').select('id, full_name, email').like('role', 'staff%')
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (staffRes.error) throw staffRes.error;

        return {
            existingClients: clientsRes.data || [],
            staffMembers: staffRes.data || [],
        };
    } catch (error) {
        console.error("Failed to load initial data in utils:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load initial data for form: " + error.message });
        return { existingClients: [], staffMembers: [] };
    }
};

export const handleClientLogic = async ({ clientSelectionMode, clientName, clientEmail, existingClientId, existingClients, toast }) => {
    let finalClientId = existingClientId;
    let finalClientEmail = clientEmail;

    if (clientSelectionMode === 'new') {
        if (!clientName.trim() || !clientEmail.trim()) {
            toast({ variant: "destructive", title: "Validation Error", description: "New client name and email are required." });
            throw new Error("Validation Error");
        }

        const { data: existingUserByEmail, error: emailCheckError } = await supabase
            .from('profiles')
            .select('id, role, email')
            .eq('email', clientEmail.trim())
            .single();

        if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            toast({ variant: "destructive", title: "Error", description: "Failed to check client email: " + emailCheckError.message });
            throw new Error("Email Check Error");
        }

        if (existingUserByEmail) {
            if (existingUserByEmail.role === 'client') {
                finalClientId = existingUserByEmail.id;
                finalClientEmail = existingUserByEmail.email;
                toast({ title: "Info", description: `Using existing client account for ${finalClientEmail}.`});
            } else {
                toast({ variant: "destructive", title: "Error", description: `Email ${clientEmail} is already associated with a non-client account.` });
                throw new Error("Email Conflict Error");
            }
        }
        finalClientEmail = clientEmail.trim();
    } else {
        if (!existingClientId) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please select an existing client." });
            throw new Error("Validation Error");
        }
        const selectedClient = existingClients.find(c => c.id === existingClientId);
        finalClientEmail = selectedClient?.email;
        if (!finalClientEmail) {
            toast({ variant: "destructive", title: "Error", description: "Could not find email for selected existing client." });
            throw new Error("Client Data Error");
        }
    }
    return { finalClientId, finalClientEmail };
};

export const createProjectInSupabase = async (projectData) => {
    const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateProjectStatus = async (projectId, newStatus, userId, notes = null) => {
    try {
        // Update project status
        const { data: project, error: updateError } = await supabase
            .from('projects')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log status change
        const { error: logError } = await supabase
            .from('project_status_log')
            .insert({
                project_id: projectId,
                status: newStatus,
                changed_by: userId,
                notes: notes
            });

        if (logError) {
            console.error('Failed to log status change:', logError);
            // Don't throw - logging failure shouldn't stop the status update
        }

        return project;
    } catch (error) {
        throw error;
    }
};

export const updateProjectPhase = async (projectId, phaseIndex, phaseData) => {
    try {
        // First get current project phases
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('phases')
            .eq('id', projectId)
            .single();

        if (fetchError) throw fetchError;

        // Update the specific phase
        const updatedPhases = [...project.phases];
        updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], ...phaseData };

        // Save back to database
        const { data, error } = await supabase
            .from('projects')
            .update({
                phases: updatedPhases,
                current_phase_index: phaseIndex,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

export const deleteProject = async (projectId) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
        return true;
    } catch (error) {
        throw error;
    }
};
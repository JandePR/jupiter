
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
              finalClientEmail = existingUserByEmail.email; // ensure using the exact email from DB
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

    export const syncProjectWithMonday = async ({newProject, clientName, clientEmail, toast}) => {
        const mondayPayload = {
            project_name: newProject.project_name,
            client_name: clientName,
            client_email: clientEmail,
            project_type: newProject.type,
            status: newProject.status,
            project_id_supabase: newProject.id,
            address: newProject.address,
        };

        const { data: functionData, error: functionError } = await supabase.functions.invoke('create-monday-item', {
            body: mondayPayload,
        });

        if (functionError) {
            console.error('Error invoking Supabase function:', functionError);
            toast({ variant: "destructive", title: "Warning", description: "Project created in Supabase, but failed to sync with Monday.com: " + functionError.message });
        } else if (functionData && functionData.itemId) {
            await supabase.from('projects').update({ monday_item_id: functionData.itemId.toString() }).eq('id', newProject.id);
            toast({ title: "Success!", description: `Project "${newProject.project_name}" created and synced with Monday.com (Item ID: ${functionData.itemId}).` });
        } else if (functionData && functionData.error) {
             console.error('Monday API Error from function:', functionData.error);
             toast({ variant: "destructive", title: "Warning", description: `Project created, but Monday.com sync failed: ${functionData.error}`});
        }
         else {
            toast({ variant: "destructive", title: "Warning", description: "Project created in Supabase, but received unexpected response from Monday.com sync." });
        }
    };
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import {
    Building,
    Calendar,
    Clock,
    FileText,
    FolderPlus,
    Hash,
    Layers,
    MapPin,
    Percent,
    Save,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Architectural project types
const PROJECT_TYPES = [
    { value: 'residential_single', label: 'Residential - Single Family' },
    { value: 'residential_multi', label: 'Residential - Multi-Family' },
    { value: 'commercial_retail', label: 'Commercial - Retail' },
    { value: 'commercial_office', label: 'Commercial - Office' },
    { value: 'commercial_mixed', label: 'Commercial - Mixed Use' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'renovation', label: 'Renovation/Addition' },
];

// Phase templates for architectural projects
const PHASE_TEMPLATES = {
    standard: [
        { name: 'Preliminary Design', code: 'PD', estimatedHours: 40, description: 'Initial concept and feasibility studies' },
        { name: 'Design Development', code: 'DD', estimatedHours: 80, description: 'Refine design and material selection' },
        { name: 'Construction Documents', code: 'CD', estimatedHours: 120, description: 'Detailed drawings and specifications' },
        { name: 'Permit & Approvals', code: 'PA', estimatedHours: 20, description: 'Submit for building permits' },
        { name: 'Bidding & Negotiation', code: 'BN', estimatedHours: 15, description: 'Contractor selection process' },
        { name: 'Construction Administration', code: 'CA', estimatedHours: 60, description: 'Site visits and RFI responses' },
        { name: 'Project Closeout', code: 'PC', estimatedHours: 10, description: 'Final documentation and handover' },
    ],
    fast_track: [
        { name: 'Schematic Design', code: 'SD', estimatedHours: 60, description: 'Combined preliminary and design development' },
        { name: 'Construction Documents', code: 'CD', estimatedHours: 100, description: 'Expedited drawing production' },
        { name: 'Permit & Construction', code: 'PC', estimatedHours: 40, description: 'Parallel permit and construction start' },
        { name: 'Construction Administration', code: 'CA', estimatedHours: 50, description: 'Active site supervision' },
    ],
    renovation: [
        { name: 'Existing Conditions', code: 'EC', estimatedHours: 30, description: 'Survey and document existing building' },
        { name: 'Design Development', code: 'DD', estimatedHours: 60, description: 'Renovation design and planning' },
        { name: 'Construction Documents', code: 'CD', estimatedHours: 80, description: 'Detailed renovation drawings' },
        { name: 'Permit & Approvals', code: 'PA', estimatedHours: 25, description: 'Building and historic approvals' },
        { name: 'Construction Phase', code: 'CP', estimatedHours: 70, description: 'Phased construction oversight' },
    ],
};

const ProjectFormModule = ({ onSuccess, onCancel }) => {
    const { user, role } = useAuth();
    const { toast } = useToast();

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectNumber, setProjectNumber] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    const [customPhases, setCustomPhases] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [clients, setClients] = useState([]);
    const [currentTab, setCurrentTab] = useState('details');

    // Project details
    const [projectData, setProjectData] = useState({
        projectName: '',
        projectType: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        clientId: '',
        projectManagerId: '',
        leadDrafterId: '',
        startDate: '',
        deadline: '',
        estimatedBudget: '',
        squareFootage: '',
        description: '',
        internalNotes: '',
    });

    // Validation state
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadInitialData();
        generateProjectNumber();
    }, []);

    useEffect(() => {
        // Update custom phases when template changes
        const template = PHASE_TEMPLATES[selectedTemplate] || PHASE_TEMPLATES.standard;
        setCustomPhases(template.map((phase, index) => ({
            ...phase,
            id: `phase_${index}`,
            order: index,
            status: 'pending',
            completion: 0,
            assignedStaffId: '',
            startDate: '',
            endDate: '',
            actualHours: 0,
            comments: [],
        })));
    }, [selectedTemplate]);

    const loadInitialData = async () => {
        try {
            // Load staff members
            const { data: staffData } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .like('role', 'staff%')
                .order('full_name');

            setStaffMembers(staffData || []);

            // Load clients
            const { data: clientData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'client')
                .order('full_name');

            setClients(clientData || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load initial data'
            });
        }
    };

    const generateProjectNumber = async () => {
        const year = new Date().getFullYear();

        try {
            // Get the count of projects for this year
            const { count } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .like('project_number', `PRJ-${year}-%`);

            const nextNumber = String((count || 0) + 1).padStart(3, '0');
            setProjectNumber(`PRJ-${year}-${nextNumber}`);
        } catch (error) {
            // Fallback project number
            const timestamp = Date.now().toString().slice(-6);
            setProjectNumber(`PRJ-${year}-${timestamp}`);
        }
    };

    const validateTab = (tabName) => {
        const newErrors = {};

        switch (tabName) {
            case 'details':
                if (!projectData.projectName.trim()) {
                    newErrors.projectName = 'Project name is required';
                }
                if (!projectData.projectType) {
                    newErrors.projectType = 'Project type is required';
                }
                if (!projectData.address.trim()) {
                    newErrors.address = 'Address is required';
                }
                break;

            case 'phases':
                if (!projectData.startDate) {
                    newErrors.startDate = 'Start date is required';
                }
                if (!projectData.deadline) {
                    newErrors.deadline = 'Deadline is required';
                }
                if (projectData.startDate && projectData.deadline) {
                    if (new Date(projectData.startDate) > new Date(projectData.deadline)) {
                        newErrors.deadline = 'Deadline must be after start date';
                    }
                }
                // Check if all phases have assigned staff
                const unassignedPhases = customPhases.filter(phase => !phase.assignedStaffId);
                if (unassignedPhases.length > 0) {
                    newErrors.phases = `${unassignedPhases.length} phase(s) need staff assignment`;
                }
                break;

            case 'team':
                if (!projectData.clientId) {
                    newErrors.clientId = 'Client selection is required';
                }
                break;
        }

        return newErrors;
    };

    const canProceedToNextTab = () => {
        const tabErrors = validateTab(currentTab);
        return Object.keys(tabErrors).length === 0;
    };

    const handleTabChange = (newTab) => {
        const tabErrors = validateTab(currentTab);
        if (Object.keys(tabErrors).length > 0) {
            setErrors(tabErrors);
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix the errors before proceeding'
            });
            return;
        }
        setErrors({});
        setCurrentTab(newTab);
    };

    const validateForm = () => {
        const allErrors = {
            ...validateTab('details'),
            ...validateTab('phases'),
            ...validateTab('team')
        };

        setErrors(allErrors);
        return Object.keys(allErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Find the first tab with errors and switch to it
            if (validateTab('details').length > 0) setCurrentTab('details');
            else if (validateTab('phases').length > 0) setCurrentTab('phases');
            else if (validateTab('team').length > 0) setCurrentTab('team');

            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix all errors in the form'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Calculate total estimated hours
            const totalEstimatedHours = customPhases.reduce((sum, phase) => sum + phase.estimatedHours, 0);

            // Get client email
            const selectedClient = clients.find(c => c.id === projectData.clientId);
            if (!selectedClient) {
                throw new Error('Selected client not found');
            }

            // Prepare project data
            const projectPayload = {
                project_number: projectNumber,
                project_name: projectData.projectName,
                type: projectData.projectType,
                address: `${projectData.address}, ${projectData.city}, ${projectData.state} ${projectData.zipCode}`.trim(),
                client_id: projectData.clientId,
                client_email: selectedClient.email,
                project_manager_id: projectData.projectManagerId || null,
                lead_drafter_id: projectData.leadDrafterId || null,
                start_date: projectData.startDate,
                deadline: projectData.deadline,
                estimated_budget: projectData.estimatedBudget ? parseFloat(projectData.estimatedBudget) : null,
                square_footage: projectData.squareFootage ? parseInt(projectData.squareFootage) : null,
                description: projectData.description,
                internal_notes: projectData.internalNotes,
                status: 'Active',
                current_phase_index: 0,
                total_estimated_hours: totalEstimatedHours,
                template_used: selectedTemplate,
                created_by: user.id,
                phases: customPhases.map(phase => ({
                    name: phase.name,
                    code: phase.code,
                    description: phase.description,
                    status: 'pending',
                    completion: 0,
                    estimated_hours: phase.estimatedHours,
                    actual_hours: 0,
                    assigned_staff_id: phase.assignedStaffId,
                    assigned_staff_email: staffMembers.find(s => s.id === phase.assignedStaffId)?.email,
                    start_date: phase.startDate || null,
                    end_date: phase.endDate || null,
                    comments: [],
                    documents: [],
                })),
            };

            // Create the project
            const { data: newProject, error } = await supabase
                .from('projects')
                .insert(projectPayload)
                .select()
                .single();

            if (error) throw error;

            // Log project creation
            await supabase.from('project_activity_log').insert({
                project_id: newProject.id,
                action: 'project_created',
                performed_by: user.id,
                details: {
                    project_number: projectNumber,
                    template_used: selectedTemplate,
                    phase_count: customPhases.length,
                }
            });

            toast({
                title: 'Success!',
                description: `Project ${projectNumber} created successfully`
            });

            if (onSuccess) {
                onSuccess(newProject);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to create project'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updatePhase = (phaseId, updates) => {
        setCustomPhases(prev => prev.map(phase =>
            phase.id === phaseId ? { ...phase, ...updates } : phase
        ));
    };

    const addCustomPhase = () => {
        const newPhase = {
            id: `phase_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            estimatedHours: 0,
            order: customPhases.length,
            status: 'pending',
            completion: 0,
            assignedStaffId: '',
            startDate: '',
            endDate: '',
            actualHours: 0,
            comments: [],
        };
        setCustomPhases([...customPhases, newPhase]);
    };

    const removePhase = (phaseId) => {
        setCustomPhases(prev => prev.filter(phase => phase.id !== phaseId));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
        >
            <Card className="bg-white dark:bg-slate-800 shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FolderPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            <div>
                                <CardTitle className="text-2xl">Create New Project</CardTitle>
                                <CardDescription>
                                    Project Number: <span className="font-mono font-semibold">{projectNumber}</span>
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">
                                    Project Details
                                    {Object.keys(validateTab('details')).length > 0 && (
                                        <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="phases">
                                    Phases & Timeline
                                    {Object.keys(validateTab('phases')).length > 0 && (
                                        <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="team">
                                    Team & Notes
                                    {Object.keys(validateTab('team')).length > 0 && (
                                        <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-6 mt-6">
                                {/* Project Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Building className="mr-2 h-5 w-5 text-purple-500" />
                                        Project Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="projectName">
                                                Project Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="projectName"
                                                value={projectData.projectName}
                                                onChange={(e) => setProjectData({ ...projectData, projectName: e.target.value })}
                                                placeholder="e.g., Smith Residence"
                                                className={errors.projectName ? 'border-red-500' : ''}
                                            />
                                            {errors.projectName && (
                                                <p className="text-sm text-red-500 mt-1">{errors.projectName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="projectType">
                                                Project Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={projectData.projectType}
                                                onValueChange={(value) => setProjectData({ ...projectData, projectType: value })}
                                            >
                                                <SelectTrigger className={errors.projectType ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select project type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PROJECT_TYPES.map(type => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.projectType && (
                                                <p className="text-sm text-red-500 mt-1">{errors.projectType}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                                        Location
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="address">
                                                Street Address <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="address"
                                                value={projectData.address}
                                                onChange={(e) => setProjectData({ ...projectData, address: e.target.value })}
                                                placeholder="123 Main Street"
                                                className={errors.address ? 'border-red-500' : ''}
                                            />
                                            {errors.address && (
                                                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={projectData.city}
                                                    onChange={(e) => setProjectData({ ...projectData, city: e.target.value })}
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={projectData.state}
                                                    onChange={(e) => setProjectData({ ...projectData, state: e.target.value })}
                                                    placeholder="State"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="zipCode">ZIP Code</Label>
                                                <Input
                                                    id="zipCode"
                                                    value={projectData.zipCode}
                                                    onChange={(e) => setProjectData({ ...projectData, zipCode: e.target.value })}
                                                    placeholder="12345"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Metrics */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <FileText className="mr-2 h-5 w-5 text-purple-500" />
                                        Project Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="squareFootage">Square Footage</Label>
                                            <Input
                                                id="squareFootage"
                                                type="number"
                                                value={projectData.squareFootage}
                                                onChange={(e) => setProjectData({ ...projectData, squareFootage: e.target.value })}
                                                placeholder="e.g., 2500"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                                            <Input
                                                id="estimatedBudget"
                                                type="number"
                                                value={projectData.estimatedBudget}
                                                onChange={(e) => setProjectData({ ...projectData, estimatedBudget: e.target.value })}
                                                placeholder="e.g., 500000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Project Description</Label>
                                        <Textarea
                                            id="description"
                                            value={projectData.description}
                                            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                                            placeholder="Brief description of the project scope and objectives..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="phases" className="space-y-6 mt-6">
                                {/* Phase Template Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Layers className="mr-2 h-5 w-5 text-purple-500" />
                                        Phase Template
                                    </h3>

                                    <Select
                                        value={selectedTemplate}
                                        onValueChange={setSelectedTemplate}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard (7 phases)</SelectItem>
                                            <SelectItem value="fast_track">Fast Track (4 phases)</SelectItem>
                                            <SelectItem value="renovation">Renovation (5 phases)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Calendar className="mr-2 h-5 w-5 text-purple-500" />
                                        Project Timeline
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="startDate">
                                                Start Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={projectData.startDate}
                                                onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
                                                className={errors.startDate ? 'border-red-500' : ''}
                                            />
                                            {errors.startDate && (
                                                <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="deadline">
                                                Deadline <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="deadline"
                                                type="date"
                                                value={projectData.deadline}
                                                onChange={(e) => setProjectData({ ...projectData, deadline: e.target.value })}
                                                className={errors.deadline ? 'border-red-500' : ''}
                                                min={projectData.startDate}
                                            />
                                            {errors.deadline && (
                                                <p className="text-sm text-red-500 mt-1">{errors.deadline}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Phase Configuration */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Phase Configuration</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addCustomPhase}
                                        >
                                            Add Phase
                                        </Button>
                                    </div>

                                    {errors.phases && (
                                        <div className="flex items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-300">
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                            {errors.phases}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {customPhases.map((phase, index) => (
                                            <Card key={phase.id} className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                                                                {index + 1}
                                                            </span>
                                                            <div className="flex-1">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    <Input
                                                                        placeholder="Phase name *"
                                                                        value={phase.name}
                                                                        onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                                                                        className={!phase.name ? 'border-orange-500' : ''}
                                                                    />
                                                                    <Input
                                                                        placeholder="Code (e.g., PD) *"
                                                                        value={phase.code}
                                                                        onChange={(e) => updatePhase(phase.id, { code: e.target.value.toUpperCase() })}
                                                                        className={`w-full md:w-24 ${!phase.code ? 'border-orange-500' : ''}`}
                                                                        maxLength={3}
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Est. hours *"
                                                                        value={phase.estimatedHours}
                                                                        onChange={(e) => updatePhase(phase.id, { estimatedHours: parseInt(e.target.value) || 0 })}
                                                                        min="0"
                                                                        className={phase.estimatedHours === 0 ? 'border-orange-500' : ''}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removePhase(phase.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            disabled={customPhases.length <= 1}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <Select
                                                            value={phase.assignedStaffId}
                                                            onValueChange={(value) => updatePhase(phase.id, { assignedStaffId: value })}
                                                        >
                                                            <SelectTrigger className={!phase.assignedStaffId ? 'border-orange-500' : ''}>
                                                                <SelectValue placeholder="Assign staff *" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {staffMembers.map(staff => (
                                                                    <SelectItem key={staff.id} value={staff.id}>
                                                                        {staff.full_name} ({staff.role.replace('staff_', '')})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Input
                                                            type="date"
                                                            placeholder="Start date"
                                                            value={phase.startDate}
                                                            onChange={(e) => updatePhase(phase.id, { startDate: e.target.value })}
                                                            min={projectData.startDate}
                                                            max={projectData.deadline}
                                                        />

                                                        <Input
                                                            type="date"
                                                            placeholder="End date"
                                                            value={phase.endDate}
                                                            onChange={(e) => updatePhase(phase.id, { endDate: e.target.value })}
                                                            min={phase.startDate || projectData.startDate}
                                                            max={projectData.deadline}
                                                        />
                                                    </div>

                                                    <Textarea
                                                        placeholder="Phase description..."
                                                        value={phase.description}
                                                        onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                                                        rows={2}
                                                    />
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="team" className="space-y-6 mt-6">
                                {/* Team Assignment */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Users className="mr-2 h-5 w-5 text-purple-500" />
                                        Team Assignment
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="clientId">
                                                Client <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={projectData.clientId}
                                                onValueChange={(value) => setProjectData({ ...projectData, clientId: value })}
                                            >
                                                <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map(client => (
                                                        <SelectItem key={client.id} value={client.id}>
                                                            {client.full_name} ({client.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.clientId && (
                                                <p className="text-sm text-red-500 mt-1">{errors.clientId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="projectManagerId">Project Manager</Label>
                                            <Select
                                                value={projectData.projectManagerId}
                                                onValueChange={(value) => setProjectData({ ...projectData, projectManagerId: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select project manager" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {staffMembers
                                                        .filter(s => s.role === 'staff_manager' || s.role === 'staff_admin')
                                                        .map(staff => (
                                                            <SelectItem key={staff.id} value={staff.id}>
                                                                {staff.full_name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="leadDrafterId">Lead Drafter</Label>
                                            <Select
                                                value={projectData.leadDrafterId}
                                                onValueChange={(value) => setProjectData({ ...projectData, leadDrafterId: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select lead drafter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {staffMembers
                                                        .filter(s => s.role === 'staff_drafter' || s.role === 'staff_manager')
                                                        .map(staff => (
                                                            <SelectItem key={staff.id} value={staff.id}>
                                                                {staff.full_name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Internal Notes</h3>
                                    <Textarea
                                        value={projectData.internalNotes}
                                        onChange={(e) => setProjectData({ ...projectData, internalNotes: e.target.value })}
                                        placeholder="Any internal notes or special instructions for the team..."
                                        rows={6}
                                    />
                                </div>

                                {/* Summary */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Hash className="mr-2 h-5 w-5 text-purple-500" />
                                        Project Summary
                                    </h3>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-600 dark:text-slate-400">Total Phases:</span>
                                                <span className="ml-2 font-semibold">{customPhases.length}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-600 dark:text-slate-400">Total Estimated Hours:</span>
                                                <span className="ml-2 font-semibold">
                                                    {customPhases.reduce((sum, phase) => sum + phase.estimatedHours, 0)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                                                <span className="ml-2 font-semibold">
                                                    {projectData.startDate && projectData.deadline
                                                        ? `${Math.ceil((new Date(projectData.deadline) - new Date(projectData.startDate)) / (1000 * 60 * 60 * 24))} days`
                                                        : 'Not set'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-600 dark:text-slate-400">Team Size:</span>
                                                <span className="ml-2 font-semibold">
                                                    {new Set(customPhases.map(p => p.assignedStaffId).filter(Boolean)).size} members
                                                </span>
                                            </div>
                                        </div>

                                        {/* Phase assignment status */}
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center space-x-2">
                                                {customPhases.every(phase => phase.assignedStaffId) ? (
                                                    <>
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                        <span className="text-sm text-green-600 dark:text-green-400">
                                                            All phases have assigned staff
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                                            {customPhases.filter(p => !p.assignedStaffId).length} phases need staff assignment
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Project...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Project
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ProjectFormModule;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar,
    CheckCircle,
    Clock,
    MessageSquare,
    Percent,
    Timer,
    User,
    AlertCircle,
    Edit3,
    Save,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectPhaseManager = ({ project, onUpdate }) => {
    const { user, role } = useAuth();
    const { toast } = useToast();

    const [phases, setPhases] = useState(project.phases || []);
    const [expandedPhase, setExpandedPhase] = useState(null);
    const [editingPhase, setEditingPhase] = useState(null);
    const [phaseComments, setPhaseComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [timeEntries, setTimeEntries] = useState({});
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states for editing
    const [editForm, setEditForm] = useState({
        completion: 0,
        actualHours: 0,
        notes: '',
        status: 'pending'
    });

    // Time tracking form
    const [timeForm, setTimeForm] = useState({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: ''
    });

    // Comment form
    const [commentForm, setCommentForm] = useState('');

    // Load staff members on component mount
    useEffect(() => {
        const loadStaffMembers = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .like('role', 'staff%');

                if (error) throw error;
                setStaffMembers(data || []);
            } catch (error) {
                console.error('Error loading staff members:', error);
            }
        };

        loadStaffMembers();
    }, []);

    // Memoized functions to prevent unnecessary re-renders
    const loadPhaseComments = useCallback(async (phaseIndex) => {
        setLoadingComments(prev => ({ ...prev, [phaseIndex]: true }));

        try {
            const { data, error } = await supabase
                .from('phase_comments')
                .select(`
                    *,
                    creator:created_by(full_name, email)
                `)
                .eq('project_id', project.id)
                .eq('phase_index', phaseIndex)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPhaseComments(prev => ({ ...prev, [phaseIndex]: data || [] }));
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load comments'
            });
        } finally {
            setLoadingComments(prev => ({ ...prev, [phaseIndex]: false }));
        }
    }, [project.id, toast]);

    const loadTimeEntries = useCallback(async (phaseIndex) => {
        try {
            const { data, error } = await supabase
                .from('phase_time_tracking')
                .select(`
                    *,
                    staff:staff_id(full_name)
                `)
                .eq('project_id', project.id)
                .eq('phase_index', phaseIndex)
                .order('date', { ascending: false });

            if (error) throw error;

            setTimeEntries(prev => ({ ...prev, [phaseIndex]: data || [] }));
        } catch (error) {
            console.error('Error loading time entries:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load time entries'
            });
        }
    }, [project.id, toast]);

    useEffect(() => {
        if (expandedPhase !== null) {
            loadPhaseComments(expandedPhase);
            loadTimeEntries(expandedPhase);
        }
    }, [expandedPhase, loadPhaseComments, loadTimeEntries]);

    const canEditPhase = (phase, phaseIndex) => {
        // Admin and manager can edit any phase
        if (role === 'staff_admin' || role === 'staff_manager') return true;

        // Project manager can edit any phase
        if (project.project_manager_id === user.id) return true;

        // Assigned staff can only edit their own phase
        if (phase.assigned_staff_id === user.id) return true;

        // Lead drafter can edit drafting phases
        if (project.lead_drafter_id === user.id) return true;

        return false;
    };

    const validateTimeInput = (hours) => {
        const numHours = parseFloat(hours);
        return !isNaN(numHours) && numHours > 0 && numHours <= 24;
    };

    const validateCompletionInput = (completion) => {
        const numCompletion = parseInt(completion);
        return !isNaN(numCompletion) && numCompletion >= 0 && numCompletion <= 100;
    };

    const handleEditPhase = (phase, index) => {
        setEditingPhase(index);
        setEditForm({
            completion: phase.completion || 0,
            actualHours: phase.actual_hours || 0,
            notes: phase.notes || '',
            status: phase.status || 'pending'
        });
    };

    const handleSavePhase = async () => {
        if (!validateCompletionInput(editForm.completion)) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Completion must be between 0 and 100'
            });
            return;
        }

        setLoading(true);
        const originalPhases = [...phases];

        try {
            // Optimistic update
            const updatedPhases = [...phases];
            updatedPhases[editingPhase] = {
                ...updatedPhases[editingPhase],
                ...editForm,
                actual_hours: parseFloat(editForm.actualHours) || 0,
                updated_at: new Date().toISOString()
            };

            setPhases(updatedPhases);

            // Update database
            const { error } = await supabase
                .from('projects')
                .update({
                    phases: updatedPhases,
                    current_phase_index: editForm.status === 'in_progress' ? editingPhase : project.current_phase_index
                })
                .eq('id', project.id);

            if (error) throw error;

            // Log the update
            await supabase.from('project_activity_log').insert({
                project_id: project.id,
                action: 'phase_updated',
                performed_by: user.id,
                details: {
                    phase_index: editingPhase,
                    phase_name: updatedPhases[editingPhase].name,
                    changes: {
                        status: editForm.status,
                        completion: editForm.completion,
                        actual_hours: editForm.actualHours
                    }
                }
            });

            setEditingPhase(null);

            toast({
                title: 'Success',
                description: 'Phase updated successfully'
            });

            if (onUpdate) onUpdate();
        } catch (error) {
            // Rollback on error
            setPhases(originalPhases);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update phase'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (phaseIndex) => {
        if (!commentForm.trim()) return;

        try {
            const { data, error } = await supabase
                .from('phase_comments')
                .insert({
                    project_id: project.id,
                    phase_index: phaseIndex,
                    comment: commentForm,
                    created_by: user.id,
                    is_internal: true
                })
                .select(`
                    *,
                    creator:created_by(full_name, email)
                `)
                .single();

            if (error) throw error;

            setPhaseComments(prev => ({
                ...prev,
                [phaseIndex]: [data, ...(prev[phaseIndex] || [])]
            }));

            setCommentForm('');

            toast({
                title: 'Comment added',
                description: 'Your comment has been posted'
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add comment'
            });
        }
    };

    const handleAddTimeEntry = async (phaseIndex) => {
        if (!timeForm.hours || !timeForm.date) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Date and hours are required'
            });
            return;
        }

        if (!validateTimeInput(timeForm.hours)) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Hours must be a valid number between 0 and 24'
            });
            return;
        }

        const originalPhases = [...phases];

        try {
            const { data, error } = await supabase
                .from('phase_time_tracking')
                .insert({
                    project_id: project.id,
                    phase_index: phaseIndex,
                    staff_id: user.id,
                    date: timeForm.date,
                    hours: parseFloat(timeForm.hours),
                    description: timeForm.description
                })
                .select(`
                    *,
                    staff:staff_id(full_name)
                `)
                .single();

            if (error) throw error;

            setTimeEntries(prev => ({
                ...prev,
                [phaseIndex]: [data, ...(prev[phaseIndex] || [])]
            }));

            // Update actual hours in phase
            const updatedPhases = [...phases];
            const currentHours = updatedPhases[phaseIndex].actual_hours || 0;
            updatedPhases[phaseIndex].actual_hours = currentHours + parseFloat(timeForm.hours);

            await supabase
                .from('projects')
                .update({ phases: updatedPhases })
                .eq('id', project.id);

            setPhases(updatedPhases);

            // Reset form
            setTimeForm({
                date: new Date().toISOString().split('T')[0],
                hours: '',
                description: ''
            });

            toast({
                title: 'Time logged',
                description: `${timeForm.hours} hours added successfully`
            });
        } catch (error) {
            // Rollback phases on error
            setPhases(originalPhases);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to log time'
            });
        }
    };

    const getPhaseStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
            case 'pending':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
        }
    };

    const getPhaseIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'in_progress':
                return <Clock className="h-5 w-5 text-blue-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-slate-400" />;
        }
    };

    const calculateProjectProgress = () => {
        const totalPhases = phases.length;
        if (totalPhases === 0) return 0;

        const weightedProgress = phases.reduce((sum, phase) => {
            if (phase.status === 'completed') return sum + 100;
            if (phase.status === 'in_progress') return sum + (phase.completion || 0);
            return sum;
        }, 0);

        return Math.round(weightedProgress / totalPhases);
    };

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                        <span>Project Progress</span>
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {calculateProjectProgress()}%
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={calculateProjectProgress()} className="h-3" />
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400">Completed</p>
                            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                                {phases.filter(p => p.status === 'completed').length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400">In Progress</p>
                            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                                {phases.filter(p => p.status === 'in_progress').length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400">Pending</p>
                            <p className="text-xl font-semibold text-slate-600 dark:text-slate-400">
                                {phases.filter(p => p.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Phase List */}
            <div className="space-y-4">
                {phases.map((phase, index) => (
                    <Card key={index} className="overflow-hidden">
                        <CardHeader
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            onClick={() => setExpandedPhase(expandedPhase === index ? null : index)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getPhaseIcon(phase.status)}
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {phase.name} ({phase.code})
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Assigned to: {phase.assigned_staff_id ?
                                            staffMembers.find(s => s.id === phase.assigned_staff_id)?.full_name || 'Unknown'
                                            : 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge className={getPhaseStatusColor(phase.status)}>
                                        {phase.status.replace('_', ' ')}
                                    </Badge>
                                    {phase.completion > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <Percent className="h-4 w-4 text-slate-500" />
                                            <span className="font-semibold">{phase.completion}%</span>
                                        </div>
                                    )}
                                    {expandedPhase === index ? (
                                        <ChevronUp className="h-5 w-5 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-slate-500" />
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <AnimatePresence>
                            {expandedPhase === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <CardContent className="border-t border-slate-200 dark:border-slate-700">
                                        <div className="space-y-6">
                                            {/* Phase Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Estimated Hours</p>
                                                    <p className="text-lg font-semibold">{phase.estimated_hours || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Actual Hours</p>
                                                    <p className="text-lg font-semibold">{phase.actual_hours || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Variance</p>
                                                    <p className={`text-lg font-semibold ${
                                                        (phase.actual_hours || 0) > (phase.estimated_hours || 0)
                                                            ? 'text-red-600'
                                                            : 'text-green-600'
                                                    }`}>
                                                        {((phase.actual_hours || 0) - (phase.estimated_hours || 0)).toFixed(1)} hrs
                                                    </p>
                                                </div>
                                            </div>

                                            {phase.description && (
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Description</p>
                                                    <p className="text-slate-700 dark:text-slate-300">{phase.description}</p>
                                                </div>
                                            )}

                                            {/* Edit Phase Section */}
                                            {canEditPhase(phase, index) && (
                                                <div className="border-t pt-4">
                                                    {editingPhase === index ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <Label htmlFor={`status-${index}`}>Status</Label>
                                                                    <select
                                                                        id={`status-${index}`}
                                                                        value={editForm.status}
                                                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                                        className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-slate-700"
                                                                        disabled={loading}
                                                                    >
                                                                        <option value="pending">Pending</option>
                                                                        <option value="in_progress">In Progress</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`completion-${index}`}>Completion %</Label>
                                                                    <Input
                                                                        id={`completion-${index}`}
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={editForm.completion}
                                                                        onChange={(e) => setEditForm({ ...editForm, completion: parseInt(e.target.value) || 0 })}
                                                                        disabled={loading}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`hours-${index}`}>Actual Hours</Label>
                                                                    <Input
                                                                        id={`hours-${index}`}
                                                                        type="number"
                                                                        step="0.5"
                                                                        value={editForm.actualHours}
                                                                        onChange={(e) => setEditForm({ ...editForm, actualHours: e.target.value })}
                                                                        disabled={loading}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`notes-${index}`}>Notes</Label>
                                                                <Textarea
                                                                    id={`notes-${index}`}
                                                                    value={editForm.notes}
                                                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                                    placeholder="Add any notes about this phase..."
                                                                    rows={3}
                                                                    disabled={loading}
                                                                />
                                                            </div>
                                                            <div className="flex justify-end space-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setEditingPhase(null)}
                                                                    disabled={loading}
                                                                >
                                                                    <X className="h-4 w-4 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleSavePhase}
                                                                    disabled={loading}
                                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                >
                                                                    {loading ? (
                                                                        <>
                                                                            <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                                                                            Saving...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="h-4 w-4 mr-1" />
                                                                            Save Changes
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleEditPhase(phase, index)}
                                                            className="w-full"
                                                        >
                                                            <Edit3 className="h-4 w-4 mr-2" />
                                                            Edit Phase
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Time Tracking */}
                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-3 flex items-center">
                                                    <Timer className="h-5 w-5 mr-2 text-purple-500" />
                                                    Time Tracking
                                                </h4>

                                                {canEditPhase(phase, index) && (
                                                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <Input
                                                                type="date"
                                                                value={timeForm.date}
                                                                onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                                                            />
                                                            <Input
                                                                type="number"
                                                                step="0.5"
                                                                min="0"
                                                                max="24"
                                                                placeholder="Hours"
                                                                value={timeForm.hours}
                                                                onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                                                            />
                                                            <Input
                                                                placeholder="Description (optional)"
                                                                value={timeForm.description}
                                                                onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                                                                className="md:col-span-2"
                                                            />
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddTimeEntry(index)}
                                                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                                                            disabled={!timeForm.hours || !timeForm.date}
                                                        >
                                                            Log Time
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {timeEntries[index]?.map((entry, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
                                                            <div>
                                                                <span className="font-medium">{entry.staff?.full_name}</span>
                                                                <span className="mx-2 text-slate-400">•</span>
                                                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                                                <span className="mx-2 text-slate-400">•</span>
                                                                <span className="font-semibold">{entry.hours} hrs</span>
                                                            </div>
                                                            {entry.description && (
                                                                <span className="text-slate-600 dark:text-slate-400">{entry.description}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Comments */}
                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-3 flex items-center">
                                                    <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                                                    Comments
                                                </h4>

                                                {canEditPhase(phase, index) && (
                                                    <div className="mb-4">
                                                        <Textarea
                                                            placeholder="Add a comment..."
                                                            value={commentForm}
                                                            onChange={(e) => setCommentForm(e.target.value)}
                                                            rows={3}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddComment(index)}
                                                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                                                            disabled={!commentForm.trim()}
                                                        >
                                                            Post Comment
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                                    {loadingComments[index] ? (
                                                        <p className="text-sm text-slate-500">Loading comments...</p>
                                                    ) : (
                                                        phaseComments[index]?.map((comment, i) => (
                                                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-medium text-sm">{comment.creator?.full_name}</span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {new Date(comment.created_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300">{comment.comment}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ProjectPhaseManager;
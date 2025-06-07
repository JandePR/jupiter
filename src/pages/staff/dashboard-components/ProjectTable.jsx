import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit3, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProjectDetailsCard from './ProjectDetailsCard';
import { PROJECT_STATUSES, updateProjectStatus } from '../create-project-components/utils';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/authHooks';

const ProjectTable = ({
                          projects,
                          sortConfig,
                          handleSort,
                          expandedProjectId,
                          toggleExpandProject,
                          handleDeleteProject,
                          userRole,
                          userId,
                          onProjectUpdate
                      }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [tempStatus, setTempStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case PROJECT_STATUSES.COMPLETED:
                return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
            case PROJECT_STATUSES.IN_PROGRESS:
                return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
            case PROJECT_STATUSES.PENDING:
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
            case PROJECT_STATUSES.IN_REVIEW:
                return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
            case PROJECT_STATUSES.APPROVED:
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300';
            case PROJECT_STATUSES.DRAFT:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
            case PROJECT_STATUSES.ON_HOLD:
                return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
            case PROJECT_STATUSES.CANCELLED:
                return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
        }
    };

    const canEditStatus = (project) => {
        if (userRole === 'staff_admin') return true;
        if (userRole === 'staff_manager') return true;
        if (userRole === 'staff_drafter' && project.assigned_staff_id === userId) return true;
        return false;
    };

    const handleStatusEdit = (projectId, currentStatus) => {
        setEditingStatusId(projectId);
        setTempStatus(currentStatus);
    };

    const handleStatusCancel = () => {
        setEditingStatusId(null);
        setTempStatus('');
    };

    const handleStatusSave = async (project) => {
        if (tempStatus === project.status) {
            handleStatusCancel();
            return;
        }

        setIsUpdating(true);
        try {
            await updateProjectStatus(project.id, tempStatus, user.id);
            toast({
                title: "Status Updated",
                description: `Project status changed to ${tempStatus}`
            });
            handleStatusCancel();
            if (onProjectUpdate) {
                onProjectUpdate();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update project status: " + error.message
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleViewProject = (projectId) => {
        navigate(`/staff/projects/${projectId}`);
    };

    const handleEditProject = (projectId) => {
        // Por ahora, navega a la página de detalles
        // En el futuro, podrías tener una página de edición separada
        navigate(`/staff/projects/${projectId}`);
    };

    const tableHeaders = [
        { key: 'project_name', label: 'Project Name' },
        { key: 'client_profile', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'deadline', label: 'Deadline' },
        { key: 'created_at', label: 'Created' },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getDaysUntilDeadline = (deadline) => {
        if (!deadline) return null;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDeadlineClass = (deadline) => {
        const days = getDaysUntilDeadline(deadline);
        if (days === null) return '';
        if (days < 0) return 'text-red-600 dark:text-red-400 font-semibold';
        if (days <= 7) return 'text-orange-600 dark:text-orange-400 font-semibold';
        if (days <= 14) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-slate-600 dark:text-slate-300';
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <TableHead className="w-[50px]"></TableHead>
                        {tableHeaders.map((header) => (
                            <TableHead
                                key={header.key}
                                onClick={() => handleSort(header.key)}
                                className="cursor-pointer hover:text-purple-500 dark:hover:text-purple-400"
                            >
                                <div className="flex items-center">
                                    {header.label}
                                    {sortConfig.key === header.key && (
                                        sortConfig.direction === 'ascending' ?
                                            <ChevronUp className="ml-1 h-4 w-4" /> :
                                            <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <React.Fragment key={project.id}>
                            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-700">
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleExpandProject(project.id)}
                                        className="text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400"
                                    >
                                        {expandedProjectId === project.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </Button>
                                </TableCell>
                                <TableCell className="font-medium text-slate-800 dark:text-slate-100">{project.project_name}</TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{project.client_profile?.full_name || project.client_email || 'N/A'}</TableCell>
                                <TableCell>
                                    {editingStatusId === project.id ? (
                                        <div className="flex items-center space-x-1">
                                            <Select
                                                value={tempStatus}
                                                onValueChange={setTempStatus}
                                                disabled={isUpdating}
                                            >
                                                <SelectTrigger className="w-[140px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(PROJECT_STATUSES).map(status => (
                                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStatusSave(project)}
                                                disabled={isUpdating}
                                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                            >
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleStatusCancel}
                                                disabled={isUpdating}
                                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(project.status)} ${canEditStatus(project) ? 'cursor-pointer hover:opacity-80' : ''}`}
                                            onClick={() => canEditStatus(project) && handleStatusEdit(project.id, project.status)}
                                        >
                                            {project.status}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{project.type || 'N/A'}</TableCell>
                                <TableCell className={getDeadlineClass(project.deadline)}>
                                    {formatDate(project.deadline)}
                                    {project.deadline && getDaysUntilDeadline(project.deadline) !== null && (
                                        <div className="text-xs">
                                            {getDaysUntilDeadline(project.deadline) < 0
                                                ? `${Math.abs(getDaysUntilDeadline(project.deadline))} days overdue`
                                                : `${getDaysUntilDeadline(project.deadline)} days left`
                                            }
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(project.created_at)}</TableCell>
                                <TableCell>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleViewProject(project.id)}
                                            className="border-slate-300 hover:border-purple-500 hover:text-purple-500 dark:border-slate-600 dark:hover:border-purple-400 dark:hover:text-purple-400"
                                            title="View project details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {(userRole === 'staff_admin' || (userRole === 'staff_drafter' && project.assigned_staff_id === userId)) && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEditProject(project.id)}
                                                className="border-slate-300 hover:border-yellow-500 hover:text-yellow-500 dark:border-slate-600 dark:hover:border-yellow-400 dark:hover:text-yellow-400"
                                                title="Edit project"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {userRole === 'staff_admin' && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="border-slate-300 hover:border-red-500 hover:text-red-500 dark:border-slate-600 dark:hover:border-red-400 dark:hover:text-red-400"
                                                title="Delete project"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                            <AnimatePresence>
                                {expandedProjectId === project.id && (
                                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                        <TableCell colSpan={8}>
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="p-0"
                                            >
                                                <ProjectDetailsCard project={project} />
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ProjectTable;
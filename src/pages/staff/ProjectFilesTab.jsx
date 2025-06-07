import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import {
    FileText,
    Download,
    Eye,
    Trash2,
    Archive,
    MessageSquare,
    Clock,
    Upload,
    X,
    FileIcon,
    Image,
    Video,
    File,
    Loader2,
    Calendar,
    User,
    FolderOpen,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectFilesTab = ({ project, onUpdate }) => {
    const { user, role } = useAuth();
    const { toast } = useToast();

    // State management
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [fileComments, setFileComments] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [isDragging, setIsDragging] = useState(false);

    // Upload dialog state
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        phase: '',
        description: '',
        files: []
    });

    // Comment form
    const [commentForm, setCommentForm] = useState({});

    // File type configurations
    const ALLOWED_EXTENSIONS = {
        'application/pdf': { ext: '.pdf', icon: FileText, color: 'text-red-500' },
        'image/jpeg': { ext: '.jpg', icon: Image, color: 'text-green-500' },
        'image/jpg': { ext: '.jpg', icon: Image, color: 'text-green-500' },
        'image/png': { ext: '.png', icon: Image, color: 'text-green-500' },
        'video/mp4': { ext: '.mp4', icon: Video, color: 'text-blue-500' },
        'application/acad': { ext: '.dwg', icon: FileIcon, color: 'text-purple-500' },
        'application/x-dwg': { ext: '.dwg', icon: FileIcon, color: 'text-purple-500' },
        'image/vnd.dwg': { ext: '.dwg', icon: FileIcon, color: 'text-purple-500' }
    };

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    // Load files on component mount
    useEffect(() => {
        loadProjectFiles();
    }, [project.id]);

    // Apply filters whenever search or phase filter changes
    useEffect(() => {
        filterFiles();
    }, [files, searchTerm, selectedPhase]);

    const loadProjectFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_files')
                .select(`
                    *,
                    uploaded_by_profile:uploaded_by(full_name, email),
                    comments:file_comments(
                        id,
                        comment,
                        created_at,
                        user:created_by(full_name)
                    )
                `)
                .eq('project_id', project.id)
                .eq('is_archived', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setFiles(data || []);

            // Organize comments by file
            const commentsMap = {};
            data?.forEach(file => {
                if (file.comments && file.comments.length > 0) {
                    commentsMap[file.id] = file.comments;
                }
            });
            setFileComments(commentsMap);
        } catch (error) {
            console.error('Error loading files:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load project files'
            });
        } finally {
            setLoading(false);
        }
    };

    const filterFiles = () => {
        let filtered = [...files];

        // Filter by phase
        if (selectedPhase && selectedPhase !== 'all') {
            filtered = filtered.filter(file => file.phase === selectedPhase);
        }

        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(file =>
                file.file_name.toLowerCase().includes(search) ||
                file.description?.toLowerCase().includes(search) ||
                file.phase?.toLowerCase().includes(search)
            );
        }

        setFilteredFiles(filtered);
    };

    const canUploadFiles = () => {
        return role === 'staff_admin' ||
            role === 'staff_manager' ||
            (role === 'staff_drafter' && project.assigned_staff_id === user.id) ||
            project.project_manager_id === user.id ||
            project.lead_drafter_id === user.id;
    };

    const canDeleteFile = (file) => {
        return role === 'staff_admin' ||
            role === 'staff_manager' ||
            file.uploaded_by === user.id;
    };

    const validateFile = (file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: `File ${file.name} exceeds 100MB limit` };
        }

        // Check file type
        const isAllowed = Object.keys(ALLOWED_EXTENSIONS).some(mimeType => {
            return file.type === mimeType ||
                file.name.toLowerCase().endsWith(ALLOWED_EXTENSIONS[mimeType].ext);
        });

        if (!isAllowed) {
            return { valid: false, error: `File type not allowed: ${file.name}` };
        }

        return { valid: true };
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (canUploadFiles()) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!canUploadFiles()) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileSelection(droppedFiles);
    };

    const handleFileSelection = (selectedFiles) => {
        const validFiles = [];
        const errors = [];

        selectedFiles.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error);
            }
        });

        if (errors.length > 0) {
            toast({
                variant: 'destructive',
                title: 'File Validation Error',
                description: errors.join('\n')
            });
        }

        if (validFiles.length > 0) {
            setUploadForm(prev => ({ ...prev, files: validFiles }));
            setUploadDialogOpen(true);
        }
    };

    const handleFileUpload = async () => {
        if (!uploadForm.files.length || !uploadForm.phase) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please select files and a phase'
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadedFiles = [];
            const totalFiles = uploadForm.files.length;

            for (let i = 0; i < totalFiles; i++) {
                const file = uploadForm.files[i];
                const fileName = `${project.id}/${Date.now()}-${file.name}`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-files')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('project-files')
                    .getPublicUrl(fileName);

                // Create database record
                const { data: fileRecord, error: dbError } = await supabase
                    .from('project_files')
                    .insert({
                        project_id: project.id,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                        file_type: file.type,
                        phase: uploadForm.phase,
                        description: uploadForm.description,
                        uploaded_by: user.id,
                        storage_path: fileName
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                uploadedFiles.push(fileRecord);

                // Update progress
                setUploadProgress(((i + 1) / totalFiles) * 100);
            }

            // Log activity
            await supabase.from('project_activity_log').insert({
                project_id: project.id,
                action: 'files_uploaded',
                performed_by: user.id,
                details: {
                    count: uploadedFiles.length,
                    phase: uploadForm.phase,
                    file_names: uploadedFiles.map(f => f.file_name)
                }
            });

            toast({
                title: 'Success',
                description: `${uploadedFiles.length} file(s) uploaded successfully`
            });

            // Reset and refresh
            setUploadDialogOpen(false);
            setUploadForm({ phase: '', description: '', files: [] });
            loadProjectFiles();

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileDownload = async (file) => {
        try {
            // For public URLs, we can directly open them
            window.open(file.file_url, '_blank');

            // Log download activity
            await supabase.from('file_download_log').insert({
                file_id: file.id,
                project_id: project.id,
                downloaded_by: user.id
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Could not download file'
            });
        }
    };

    const handleFileDelete = async (file) => {
        if (!window.confirm(`Are you sure you want to delete ${file.file_name}?`)) {
            return;
        }

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('project-files')
                .remove([file.storage_path]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('project_files')
                .delete()
                .eq('id', file.id);

            if (dbError) throw dbError;

            toast({
                title: 'File Deleted',
                description: 'File has been permanently deleted'
            });

            loadProjectFiles();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: error.message
            });
        }
    };

    const handleFileArchive = async (file) => {
        try {
            const { error } = await supabase
                .from('project_files')
                .update({ is_archived: true })
                .eq('id', file.id);

            if (error) throw error;

            toast({
                title: 'File Archived',
                description: 'File has been moved to archive'
            });

            loadProjectFiles();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Archive Failed',
                description: error.message
            });
        }
    };

    const handleAddComment = async (fileId) => {
        const comment = commentForm[fileId];
        if (!comment?.trim()) return;

        try {
            const { data, error } = await supabase
                .from('file_comments')
                .insert({
                    file_id: fileId,
                    project_id: project.id,
                    comment: comment,
                    created_by: user.id
                })
                .select(`
                    *,
                    user:created_by(full_name)
                `)
                .single();

            if (error) throw error;

            // Update local state
            setFileComments(prev => ({
                ...prev,
                [fileId]: [...(prev[fileId] || []), data]
            }));

            setCommentForm(prev => ({ ...prev, [fileId]: '' }));

            toast({
                title: 'Comment Added',
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

    const getFileIcon = (fileType) => {
        const config = Object.entries(ALLOWED_EXTENSIONS).find(([mimeType]) =>
            fileType === mimeType
        );
        return config ? config[1] : { icon: File, color: 'text-slate-500' };
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const renderFilePreview = (file) => {
        const { icon: Icon, color } = getFileIcon(file.file_type);

        if (file.file_type?.startsWith('image/')) {
            return (
                <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="hidden w-full h-full items-center justify-center">
                        <Icon className={`h-16 w-16 ${color}`} />
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Icon className={`h-16 w-16 ${color}`} />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All phases" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Phases</SelectItem>
                            {project.phases?.map((phase, index) => (
                                <SelectItem key={index} value={phase.name}>
                                    {phase.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex border rounded-md">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-r-none"
                        >
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-l-none"
                        >
                            List
                        </Button>
                    </div>

                    {canUploadFiles() && (
                        <Button
                            onClick={() => setUploadDialogOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                        </Button>
                    )}
                </div>
            </div>

            {/* Drop zone overlay */}
            {isDragging && canUploadFiles() && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-8 m-4 max-w-md text-center">
                        <Upload className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                        <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Release to upload files to this project
                        </p>
                    </div>
                </div>
            )}

            {/* Files content */}
            <div
                className={`min-h-[400px] ${isDragging ? 'opacity-50' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <Card className="h-64 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-full">
                            <FolderOpen className="h-16 w-16 text-slate-400 mb-4" />
                            <p className="text-slate-500 text-center">
                                {searchTerm || selectedPhase !== 'all'
                                    ? 'No files match your filters'
                                    : 'No files uploaded yet'}
                            </p>
                            {canUploadFiles() && !searchTerm && selectedPhase === 'all' && (
                                <p className="text-sm text-slate-400 mt-2">
                                    Drag and drop files here or click Upload
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFiles.map((file) => (
                            <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="cursor-pointer" onClick={() => setSelectedFile(file)}>
                                    {renderFilePreview(file)}
                                </div>
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm truncate mb-1">{file.file_name}</h4>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                        <span>{formatFileSize(file.file_size)}</span>
                                        <span>{formatDate(file.created_at)}</span>
                                    </div>
                                    <Badge variant="outline" className="mb-2">
                                        {file.phase}
                                    </Badge>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleFileDownload(file)}
                                                className="h-8 w-8"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewFile(file)}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExpandedComments(prev => ({
                                                    ...prev,
                                                    [file.id]: !prev[file.id]
                                                }))}
                                                className="h-8 w-8"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                {fileComments[file.id]?.length > 0 && (
                                                    <span className="ml-1 text-xs">
                                                        {fileComments[file.id].length}
                                                    </span>
                                                )}
                                            </Button>
                                            {canDeleteFile(file) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleFileArchive(file)}
                                                    className="h-8 w-8"
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments section */}
                                    <AnimatePresence>
                                        {expandedComments[file.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mt-3 pt-3 border-t"
                                            >
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {fileComments[file.id]?.map((comment, idx) => (
                                                        <div key={idx} className="text-xs">
                                                            <p className="font-medium">{comment.user?.full_name}</p>
                                                            <p className="text-slate-600 dark:text-slate-400">
                                                                {comment.comment}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2">
                                                    <Input
                                                        placeholder="Add comment..."
                                                        value={commentForm[file.id] || ''}
                                                        onChange={(e) => setCommentForm(prev => ({
                                                            ...prev,
                                                            [file.id]: e.target.value
                                                        }))}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleAddComment(file.id);
                                                            }
                                                        }}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="text-left p-4">File Name</th>
                                    <th className="text-left p-4">Phase</th>
                                    <th className="text-left p-4">Size</th>
                                    <th className="text-left p-4">Uploaded</th>
                                    <th className="text-left p-4">By</th>
                                    <th className="text-right p-4">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredFiles.map((file) => {
                                    const { icon: Icon, color } = getFileIcon(file.file_type);
                                    return (
                                        <tr key={file.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <Icon className={`h-5 w-5 ${color}`} />
                                                    <span className="font-medium">{file.file_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline">{file.phase}</Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {formatFileSize(file.file_size)}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(file.created_at)}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {file.uploaded_by_profile?.full_name}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleFileDownload(file)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setPreviewFile(file)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {canDeleteFile(file) && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleFileArchive(file)}
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleFileDelete(file)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                            Add files to this project. Maximum file size: 100MB
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="phase">Phase *</Label>
                            <Select
                                value={uploadForm.phase}
                                onValueChange={(value) => setUploadForm(prev => ({ ...prev, phase: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select phase" />
                                </SelectTrigger>
                                <SelectContent>
                                    {project.phases?.map((phase, index) => (
                                        <SelectItem key={index} value={phase.name}>
                                            {phase.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Add notes about these files..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Files to upload</Label>
                            <div className="mt-2 space-y-2">
                                {uploadForm.files.length === 0 ? (
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png,.mp4,.dwg"
                                            onChange={(e) => handleFileSelection(Array.from(e.target.files))}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer"
                                        >
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Click to select files
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                PDF, JPG, PNG, MP4, DWG (max 100MB)
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <>
                                        {uploadForm.files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <FileIcon className="h-4 w-4 text-slate-500" />
                                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                                    <span className="text-xs text-slate-500">
                                                        ({formatFileSize(file.size)})
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newFiles = uploadForm.files.filter((_, i) => i !== index);
                                                        setUploadForm(prev => ({ ...prev, files: newFiles }));
                                                    }}
                                                    className="h-6 w-6"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('file-upload').click()}
                                            className="w-full"
                                        >
                                            Add more files
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUploadDialogOpen(false)}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFileUpload}
                            disabled={uploading || !uploadForm.phase || uploadForm.files.length === 0}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload {uploadForm.files.length} file(s)
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{previewFile?.file_name}</DialogTitle>
                        <DialogDescription>
                            {previewFile?.phase} • {previewFile && formatFileSize(previewFile.file_size)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {previewFile?.file_type === 'application/pdf' ? (
                            <iframe
                                src={previewFile.file_url}
                                className="w-full h-[60vh] border rounded"
                                title={previewFile.file_name}
                            />
                        ) : previewFile?.file_type?.startsWith('image/') ? (
                            <img
                                src={previewFile.file_url}
                                alt={previewFile.file_name}
                                className="max-w-full max-h-[60vh] mx-auto"
                            />
                        ) : previewFile?.file_type === 'video/mp4' ? (
                            <video
                                src={previewFile.file_url}
                                controls
                                className="w-full max-h-[60vh]"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <FileIcon className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    Preview not available for this file type
                                </p>
                                <Button
                                    onClick={() => handleFileDownload(previewFile)}
                                    className="mt-4"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download File
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => handleFileDownload(previewFile)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button onClick={() => setPreviewFile(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Details Dialog */}
            <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>File Details</DialogTitle>
                    </DialogHeader>

                    {selectedFile && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>File Name</Label>
                                    <p className="text-sm mt-1">{selectedFile.file_name}</p>
                                </div>
                                <div>
                                    <Label>Phase</Label>
                                    <p className="text-sm mt-1">{selectedFile.phase}</p>
                                </div>
                                <div>
                                    <Label>Size</Label>
                                    <p className="text-sm mt-1">{formatFileSize(selectedFile.file_size)}</p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <p className="text-sm mt-1">{selectedFile.file_type}</p>
                                </div>
                                <div>
                                    <Label>Uploaded By</Label>
                                    <p className="text-sm mt-1">
                                        {selectedFile.uploaded_by_profile?.full_name}
                                    </p>
                                </div>
                                <div>
                                    <Label>Upload Date</Label>
                                    <p className="text-sm mt-1">
                                        {new Date(selectedFile.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedFile.description && (
                                <div>
                                    <Label>Description</Label>
                                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                                        {selectedFile.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label>Comments</Label>
                                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                    {fileComments[selectedFile.id]?.map((comment, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-sm">
                                                    {comment.user?.full_name}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {comment.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={commentForm[selectedFile.id] || ''}
                                        onChange={(e) => setCommentForm(prev => ({
                                            ...prev,
                                            [selectedFile.id]: e.target.value
                                        }))}
                                        rows={3}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddComment(selectedFile.id)}
                                        className="mt-2"
                                        disabled={!commentForm[selectedFile.id]?.trim()}
                                    >
                                        Post Comment
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleFileDownload(selectedFile)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setPreviewFile(selectedFile);
                                            setSelectedFile(null);
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                                {canDeleteFile(selectedFile) && (
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                handleFileArchive(selectedFile);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archive
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                handleFileDelete(selectedFile);
                                                setSelectedFile(null);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectFilesTab;
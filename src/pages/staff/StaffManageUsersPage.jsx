import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Edit, Trash2, AlertCircle, Check, X, Search, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/authHooks';

const ROLE_OPTIONS = [
    { value: 'client', label: 'Client' },
    { value: 'staff_drafter', label: 'Staff - Drafter' },
    { value: 'staff_manager', label: 'Staff - Manager' },
    { value: 'staff_admin', label: 'Staff - Admin' }
];

const StaffManageUsersPage = () => {
    const { user: currentUser, role: currentUserRole } = useAuth();
    const { toast } = useToast();

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Create/Edit user states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'client'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Fetch profiles - REMOVED created_at from query
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;

            setUsers(profiles || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch users: ' + error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async () => {
        setIsSubmitting(true);
        try {
            // In a real implementation, this would call a Supabase Edge Function
            // that has admin privileges to create users

            // For demonstration, showing the structure:
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name
                    }
                }
            });

            if (error) throw error;

            // Update the profile with the role
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        role: formData.role,
                        full_name: formData.full_name
                    })
                    .eq('id', data.user.id);

                if (profileError) throw profileError;
            }

            toast({
                title: 'Success',
                description: `User ${formData.email} created successfully.`
            });

            setIsCreateDialogOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create user: ' + error.message + '. Note: In production, this would require admin privileges via Edge Functions.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    role: formData.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'User updated successfully.'
            });

            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update user: ' + error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        try {
            // In production, this would require an Edge Function with admin privileges
            // For now, we can only update the profile to mark as inactive
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_active: false
                })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'User deactivated successfully. Note: Full deletion requires admin privileges.'
            });

            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete user: ' + error.message
            });
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'client'
        });
    };

    const openEditDialog = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email || '',
            password: '',
            full_name: user.full_name || '',
            role: user.role || 'client'
        });
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === 'all' || user.role === filterRole;

        return matchesSearch && matchesRole;
    });

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'staff_admin':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
            case 'staff_manager':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
            case 'staff_drafter':
                return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
            case 'client':
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
                <Zap className="h-16 w-16 text-purple-500 animate-pulse mb-4" />
                <p className="text-xl text-slate-600 dark:text-slate-300">Loading users...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            <div>
                                <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">Manage Users</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400">
                                    Create, edit, and manage user accounts
                                </CardDescription>
                            </div>
                        </div>

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                                    onClick={() => {
                                        resetForm();
                                        setEditingUser(null);
                                    }}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" /> Create User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-slate-800">
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>
                                        Enter the details for the new user account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Minimum 6 characters"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateUser}
                                        disabled={isSubmitting || !formData.email || !formData.password || !formData.full_name}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create User'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {ROLE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Users Table */}
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            <p className="text-slate-500">No users found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.full_name || 'N/A'}
                                            </TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Client'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_active !== false ? (
                                                    <span className="flex items-center text-green-600 dark:text-green-400">
                                                        <Check className="h-4 w-4 mr-1" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600 dark:text-red-400">
                                                        <X className="h-4 w-4 mr-1" /> Inactive
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                                                {user.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => openEditDialog(user)}
                                                                disabled={user.id === currentUser?.id}
                                                                className="h-8 w-8"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-white dark:bg-slate-800">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit User</DialogTitle>
                                                                <DialogDescription>
                                                                    Update user information for {user.email}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit_email">Email</Label>
                                                                    <Input
                                                                        id="edit_email"
                                                                        type="email"
                                                                        value={formData.email}
                                                                        disabled
                                                                        className="bg-slate-100 dark:bg-slate-700"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit_full_name">Full Name</Label>
                                                                    <Input
                                                                        id="edit_full_name"
                                                                        value={formData.full_name}
                                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                                        placeholder="John Doe"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit_role">Role</Label>
                                                                    <Select
                                                                        value={formData.role}
                                                                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {ROLE_OPTIONS.map(option => (
                                                                                <SelectItem key={option.value} value={option.value}>
                                                                                    {option.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setEditingUser(null)}
                                                                    disabled={isSubmitting}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleUpdateUser}
                                                                    disabled={isSubmitting}
                                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                >
                                                                    {isSubmitting ? 'Updating...' : 'Update User'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                        disabled={user.id === currentUser?.id || currentUserRole !== 'staff_admin'}
                                                        className="h-8 w-8 hover:border-red-500 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-700/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                <p className="font-semibold">Note:</p>
                                <p>User creation and deletion require admin privileges through Supabase Edge Functions. This demo shows the UI structure, but in production, these operations would be handled securely server-side.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StaffManageUsersPage;
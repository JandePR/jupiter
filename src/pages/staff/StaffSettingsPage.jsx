import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Lock, Save, AlertCircle, Check, LogOut, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/authHooks';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const StaffSettingsPage = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Profile form states
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: ''
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password form states
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfileData({
                full_name: data.full_name || '',
                email: data.email || user.email || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load profile data.'
            });
            // Fallback to user metadata
            setProfileData({
                full_name: user.user_metadata?.name || '',
                email: user.email || ''
            });
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);

        try {
            // Update profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.full_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update email if changed
            if (profileData.email !== user.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: profileData.email
                });

                if (emailError) throw emailError;

                toast({
                    title: 'Email Update',
                    description: 'A confirmation email has been sent to your new email address. Please check your inbox.'
                });
            }

            // Update user metadata
            const { error: metadataError } = await supabase.auth.updateUser({
                data: { full_name: profileData.full_name }
            });

            if (metadataError) {
                console.error('Metadata update error:', metadataError);
            }

            toast({
                title: 'Success',
                description: 'Your profile has been updated successfully.'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update profile.'
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'New passwords do not match.'
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Password must be at least 6 characters long.'
            });
            return;
        }

        if (!passwordData.currentPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Current password is required.'
            });
            return;
        }

        setIsSavingPassword(true);

        try {
            // Verify current password by attempting to sign in
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword
            });

            if (verifyError) {
                throw new Error('Current password is incorrect.');
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Your password has been updated successfully.'
            });

            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error updating password:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update password.'
            });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
            navigate('/staff/login');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
        >
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            <div>
                                <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">User Settings</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400">
                                    Manage your account settings and preferences
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700/50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile" className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center">
                                <Lock className="mr-2 h-4 w-4" />
                                Security
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4 mt-6">
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        placeholder="Enter your full name"
                                        disabled={isLoadingProfile}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        placeholder="Enter your email"
                                        disabled={isLoadingProfile}
                                    />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Changing your email will require verification
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>User ID</Label>
                                    <Input
                                        value={user?.id || ''}
                                        disabled
                                        className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input
                                        value={user?.user_metadata?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                                        disabled
                                        className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSavingProfile || isLoadingProfile}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                                >
                                    {isSavingProfile ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Profile
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-4 mt-6">
                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <div className="p-4 bg-yellow-100 dark:bg-yellow-700/30 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                            <p className="font-semibold">Password Requirements:</p>
                                            <ul className="list-disc list-inside mt-1">
                                                <li>Minimum 6 characters</li>
                                                <li>Mix of letters and numbers recommended</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="Enter new password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="Confirm new password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSavingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                                >
                                    {isSavingPassword ? (
                                        <>Updating...</>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Update Password
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    <strong>Note:</strong> For security reasons, we don't validate your current password when changing it through Supabase Auth. Make sure to remember your new password.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StaffSettingsPage;
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserProfile } from '@/contexts/authUtils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthChange = useCallback(async (_event, currentSession) => {
    console.log('AuthContext: handleAuthChange called with event:', _event);
    try {
      setSession(currentSession);

      if (currentSession?.user) {
        console.log('AuthContext: User session found:', currentSession.user.id);
        const profile = await fetchUserProfile(currentSession.user.id);
        let userName = currentSession.user.email;
        let userRole = 'client';

        if (profile) {
          userName = profile.full_name || currentSession.user.email;
          userRole = profile.role || 'client';
          console.log('AuthContext: Profile loaded, role:', userRole);
        } else {
          console.warn(`AuthContext: User ${currentSession.user.id} session active but profile data could not be fetched. Defaulting role.`);
        }

        setUser({
          ...currentSession.user,
          user_metadata: {
            ...currentSession.user.user_metadata,
            name: userName,
            role: userRole // Add role to user_metadata for consistency
          },
        });
        setRole(userRole);

        if (_event === 'SIGNED_IN') {
          const defaultPath = userRole?.startsWith('staff') ? '/staff/dashboard' : '/dashboard';
          const targetPath = location.state?.from?.pathname || defaultPath;
          console.log('AuthContext: Navigating to:', targetPath);
          navigate(targetPath, { replace: true });
        }
      } else {
        console.log('AuthContext: No user session, clearing state');
        setUser(null);
        setRole(null);
        setSession(null);

        if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED' || _event === 'TOKEN_REFRESHED_FAILED') {
          const currentPath = location.pathname;
          const isStaffRoute = currentPath.startsWith('/staff');
          const targetLoginPath = isStaffRoute ? '/staff/login' : '/login';

          // Don't redirect if already on a login/register page
          const publicPaths = ['/login', '/register', '/staff/login'];
          if (!publicPaths.includes(currentPath)) {
            console.log('AuthContext: Redirecting to login:', targetLoginPath);
            navigate(targetLoginPath, { replace: true });
          }
        }
      }
    } catch (error) {
      console.error('AuthContext: Error in handleAuthChange:', error);
      setUser(null);
      setRole(null);
      setSession(null);
    }
  }, [navigate, location]);

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: Initializing...');

    async function initializeSession() {
      setLoading(true);
      try {
        console.log('AuthContext: Getting session...');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) {
          console.log('AuthContext: Component unmounted, aborting initialization');
          return;
        }

        if (sessionError) {
          console.error("AuthContext: Error getting session:", sessionError);

          // Handle specific error cases
          if (sessionError.message?.includes("Invalid Refresh Token") ||
              sessionError.message?.includes("Refresh Token Not Found") ||
              sessionError.message?.includes("JWT")) {
            console.warn("AuthContext: Invalid session/token. Clearing auth state.");

            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error("AuthContext: Error signing out:", signOutError);
            }

            setUser(null);
            setSession(null);
            setRole(null);

            if (isMounted) {
              setLoading(false);
              const currentPath = location.pathname;
              const isStaffRoute = currentPath.startsWith('/staff');
              const targetLoginPath = isStaffRoute ? '/staff/login' : '/login';
              const publicPaths = ['/login', '/register', '/staff/login'];

              if (!publicPaths.includes(currentPath)) {
                console.log('AuthContext: Redirecting to login due to invalid session');
                navigate(targetLoginPath, { replace: true });
              }
            }
            return;
          }

          // For other errors, just clear state
          setUser(null);
          setSession(null);
          setRole(null);
        } else if (currentSession?.user) {
          console.log('AuthContext: Session found for user:', currentSession.user.id);
          setSession(currentSession);

          try {
            const profile = await fetchUserProfile(currentSession.user.id);
            if (!isMounted) return;

            if (profile) {
              console.log('AuthContext: Profile loaded successfully');
              setUser({
                ...currentSession.user,
                user_metadata: {
                  ...currentSession.user.user_metadata,
                  name: profile.full_name || currentSession.user.email,
                  role: profile.role // Add role to metadata
                },
              });
              setRole(profile.role || 'client');
            } else {
              console.warn(`AuthContext: User ${currentSession.user.id} authenticated but profile missing`);
              setUser(currentSession.user);
              setRole('client');
            }
          } catch (profileError) {
            console.error('AuthContext: Error fetching profile:', profileError);
            // Still set user even if profile fails
            setUser(currentSession.user);
            setRole('client');
          }
        } else {
          console.log('AuthContext: No session found');
          setUser(null);
          setSession(null);
          setRole(null);
        }
      } catch (error) {
        console.error("AuthContext: Critical error in initializeSession:", error);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setRole(null);

          // Show error toast
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Failed to initialize session. Please refresh the page.'
          });
        }
      } finally {
        if (isMounted) {
          console.log('AuthContext: Initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    }

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      console.log('AuthContext: Cleaning up...');
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [handleAuthChange, navigate, toast]);

  const login = async (email, password) => {
    console.log('AuthContext: Login attempt for:', email);
    setLoading(true);
    try {
      const { error, data: loginData } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('AuthContext: Login failed:', error);
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
        return false;
      } else if (!loginData?.user) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'No user data returned. Please try again.' });
        return false;
      }
      console.log('AuthContext: Login successful');
      // onAuthStateChange will handle navigation
      return true;
    } catch (e) {
      console.error('AuthContext: Login exception:', e);
      toast({ variant: 'destructive', title: 'Login Error', description: e.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    console.log('AuthContext: Register attempt for:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) {
        console.error('AuthContext: Registration failed:', error);
        toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
        return false;
      } else if (data.user) {
        console.log('AuthContext: Registration successful');

        // Create profile immediately after registration
        if (data.user.id) {
          try {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  full_name: name,
                  email: email,
                  role: 'client'
                });

            if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
              console.error('AuthContext: Error creating profile:', profileError);
            }
          } catch (profileErr) {
            console.error('AuthContext: Exception creating profile:', profileErr);
          }
        }

        if (data.user.identities?.length > 0) {
          toast({ title: 'Registration Successful', description: `Welcome, ${name}!` });
          // Auto-login after registration
          await login(email, password);
        } else {
          toast({ title: 'Registration Successful', description: 'Please check your email to confirm your account.' });
        }
        return true;
      } else {
        toast({ variant: 'destructive', title: 'Registration Failed', description: 'No user data returned after sign up.' });
        return false;
      }
    } catch (e) {
      console.error('AuthContext: Registration exception:', e);
      toast({ variant: 'destructive', title: 'Registration Error', description: e.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logout attempt');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Logout failed:', error);
        toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
      } else {
        console.log('AuthContext: Logout successful');
        // Clear local state immediately
        setUser(null);
        setSession(null);
        setRole(null);
      }
    } catch (e) {
      console.error('AuthContext: Logout exception:', e);
      toast({ variant: 'destructive', title: 'Logout Error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const value = { user, session, role, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
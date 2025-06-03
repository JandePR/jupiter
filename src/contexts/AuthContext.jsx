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
        try {
          setLoading(true);
          setSession(currentSession);

          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user.id);
            let userName = currentSession.user.email;
            let userRole = 'client';

            if (profile) {
              userName = profile.full_name || currentSession.user.email;
              userRole = profile.role || 'client';
            } else {
              console.warn(`AuthContext (onAuthStateChange): User ${currentSession.user.id} session active but profile data could not be fetched. Defaulting role.`);
            }

            setUser({
              ...currentSession.user,
              user_metadata: {
                ...currentSession.user.user_metadata,
                name: userName,
              },
            });
            setRole(userRole);

            if (_event === 'SIGNED_IN') {
              const defaultPath = userRole?.startsWith('staff') ? '/staff/dashboard' : '/dashboard';
              const targetPath = location.state?.from?.pathname || defaultPath;
              navigate(targetPath, { replace: true });
            }
          } else {
            setUser(null);
            setRole(null);
            setSession(null);
            if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED' || _event === 'TOKEN_REFRESHED_FAILED') {
              const currentPath = window.location.pathname;
              const targetLoginPath = currentPath.startsWith('/staff') ? '/staff/login' : '/login';
              if (currentPath !== targetLoginPath) {
                navigate(targetLoginPath, { replace: true });
              }
            }
          }
        } catch (error) {
          console.error('AuthContext: Error in handleAuthChange:', error);
          setUser(null);
          setRole(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      }, [navigate, location.state]);

      useEffect(() => {
        let isMounted = true;

        async function initializeSession() {
          setLoading(true);
          try {
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

            if (!isMounted) return;

            if (sessionError) {
              console.error("AuthContext: Error getting session during initialization:", sessionError.message);
              if (sessionError.message.includes("Invalid Refresh Token") || sessionError.message.includes("Refresh Token Not Found")) {
                console.warn("AuthContext: Invalid refresh token. Forcing sign out.");
                await supabase.auth.signOut(); 
                setUser(null);
                setSession(null);
                setRole(null);
                if (isMounted) setLoading(false);
                const currentPath = window.location.pathname;
                const targetLoginPath = currentPath.startsWith('/staff') ? '/staff/login' : '/login';
                 if (currentPath !== targetLoginPath) {
                    navigate(targetLoginPath, { replace: true });
                }
                return; 
              }
              setUser(null);
              setSession(null);
              setRole(null);
            } else if (currentSession?.user) {
              setSession(currentSession);
              const profile = await fetchUserProfile(currentSession.user.id);
              if (!isMounted) return;

              if (profile) {
                setUser({
                  ...currentSession.user,
                  user_metadata: {
                    ...currentSession.user.user_metadata,
                    name: profile.full_name || currentSession.user.email,
                  },
                });
                setRole(profile.role || 'client');
              } else {
                console.warn(`AuthContext: User ${currentSession.user.id} authenticated but profile data is missing. Setting role to 'client'.`);
                setUser(currentSession.user);
                setRole('client');
              }
            } else {
              setUser(null);
              setSession(null);
              setRole(null);
            }
          } catch (error) {
            console.error("AuthContext: Critical error in initializeSession:", error.message);
            if (isMounted) {
              setUser(null);
              setSession(null);
              setRole(null);
            }
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        }

        initializeSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

        return () => {
          isMounted = false;
          if (authListener?.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      }, []);


      const login = async (email, password) => {
        setLoading(true);
        try {
          const { error, data: loginData } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
            return false;
          } else if (!loginData?.user) {
             toast({ variant: 'destructive', title: 'Login Failed', description: 'No user data returned. Please try again.' });
             return false;
          }
          // onAuthStateChange will handle navigation
          return true;
        } catch (e) {
          toast({ variant: 'destructive', title: 'Login Error', description: e.message });
          return false;
        } finally {
          setLoading(false);
        }
      };

      const register = async (email, password, name) => {
        setLoading(true);
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });

          if (error) {
            toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
          } else if (data.user) {
            if (data.user.identities?.length > 0 && data.user.identities.every(i => !i.identity_data?.email_verified) && !data.user.email_confirmed_at) {
              toast({ title: 'Registration Successful', description: 'Please check your email to confirm your account.' });
            } else {
              toast({ title: 'Registration Successful', description: `Welcome, ${name}!` });
            }
            // Do not navigate here, onAuthStateChange or login page will handle it.
            // Or, if explicit navigation is desired after registration success message:
            // setTimeout(() => navigate('/login', { replace: true }), 3000);
          } else {
            toast({ variant: 'destructive', title: 'Registration Failed', description: 'No user data returned after sign up.' });
          }
        } catch (e) {
          toast({ variant: 'destructive', title: 'Registration Error', description: e.message });
        } finally {
          setLoading(false);
        }
      };
      
      const logout = async () => {
        setLoading(true);
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
          } else {
            // onAuthStateChange will handle setting user/session/role to null and navigation
          }
        } catch (e) {
          toast({ variant: 'destructive', title: 'Logout Error', description: e.message });
        } finally {
          setLoading(false);
        }
      };
      
      const value = { user, session, role, loading, login, register, logout };

      return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    }
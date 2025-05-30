import { supabase } from '@/lib/supabaseClient';

    export async function fetchUserProfile(userId) {
      if (!userId) {
        console.warn('AuthUtils: fetchUserProfile called with no userId.');
        return null;
      }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('AuthUtils: Profile not found for user:', userId, 'This user may need to complete profile setup.');
          } else if (error.message && error.message.includes("infinite recursion detected")) {
            console.error('AuthUtils: CRITICAL - Infinite recursion detected in RLS policy for profiles table.', error);
          } else {
            console.error('AuthUtils: Error fetching profile:', error.message);
          }
          return null;
        }
        return profile;
      } catch (e) {
        console.error('AuthUtils: Exception fetching profile:', e.message);
        return null;
      }
    }
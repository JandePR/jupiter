import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("🚨 Missing Supabase credentials in .env. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
      // In a production app, you might want to throw an error or display a more user-friendly message.
      // For now, this console error will alert developers.
    }
    
    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
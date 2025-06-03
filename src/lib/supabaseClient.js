import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 Missing Supabase credentials in .env. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
    console.error("URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
    console.error("Key:", supabaseAnonKey ? "✓ Set" : "✗ Missing");

    // Throw error to prevent silent failures
    throw new Error("Missing Supabase credentials. Check your .env file.");
}

console.log("✅ Supabase client initialized with URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
import { createClient } from '@supabase/supabase-js';

// Accessing environment variables in Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check connection status
export const checkSupabaseConnection = async () => {
    try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log("✅ Supabase Connected Successfully");
        return true;
    } catch (err) {
        console.error("❌ Supabase Connection Failed:", err.message);
        return false;
    }
};
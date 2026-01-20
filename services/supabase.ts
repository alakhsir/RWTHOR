
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing!');
} else {
    if (!supabaseKey.startsWith('ey')) {
        console.warn('WARNING: VITE_SUPABASE_ANON_KEY does not look like a valid Supabase JWT (should start with "ey"). Check your .env file.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

// Access environment variables (Vite standard)
// If you are not using .env, REPLACE THE STRINGS BELOW with your actual keys.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://fmdxczzttnpnnzdftsnd.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zFGTvpd5fWHXA13FBAj7Bg_yh1GHbZv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
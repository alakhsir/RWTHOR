
import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE WITH YOUR SUPABASE PROJECT DETAILS FROM DASHBOARD -> SETTINGS -> API
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

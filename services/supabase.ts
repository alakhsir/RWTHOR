
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fmdxczzttnpnnzdftsnd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zFGTvpd5fWHXA13FBAj7Bg_yh1GHbZv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

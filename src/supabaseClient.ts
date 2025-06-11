import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vatrqwamwsjhmjwumrkp.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

if (!SUPABASE_ANON_KEY) {
  console.error("Supabase anon key is missing. Please ensure your .env file is configured correctly.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

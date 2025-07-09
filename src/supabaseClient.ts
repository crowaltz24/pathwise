import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

async function fetchConfig() {
  try {
    const response = await fetch('/config');
    const config = await response.json();
    SUPABASE_URL = config.SUPABASE_URL;
    SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase URL or anon key is missing. Please ensure your Flask server is configured correctly.");
    }
  } catch (error) {
    console.error("Failed to fetch configuration from Flask:", error);
  }
}

await (async () => {
  await fetchConfig();
})();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

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
      console.error("Supabase URL or anon key is missing.");
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') {
      console.warn("Localhost environment detected. Not using Flask config. Falling back to local environment variables.");
      SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
      SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
    } else {
      console.error("Failed to fetch configuration from Flask:", error);
    }
  }
}

await (async () => {
  await fetchConfig();
})();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

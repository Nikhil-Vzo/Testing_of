import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create the Supabase client
// Fixed storageKey so auth sessions persist even if the URL changes
// (e.g., switching between supabase.co and jiobase.com proxy)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-htepqqigtzmllailykas-auth-token',
  },
});
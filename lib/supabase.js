import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Reusable Supabase client. Initialized once per process.
 * Import createSupabaseClient() where you need to query Supabase (e.g. Server Components, API routes).
 */
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Singleton: one client instance per process
let client = null;

export function createSupabaseClient() {
  if (client === null) {
    client = getSupabaseClient();
  }
  return client;
}

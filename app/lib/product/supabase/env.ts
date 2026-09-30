// Public Supabase config for the Product section. Only the URL and anon key ever reach the browser;
// the service role key is read by the Supabase CLI / seed tooling only, never imported here.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The rest of the prototype runs without Supabase, so a missing config must not crash the build or
 * other routes — the Product pages show a setup notice instead.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

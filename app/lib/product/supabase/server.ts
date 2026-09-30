import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/product/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Server Supabase client for Server Components, Server Actions and Route Handlers.
 * Uses the anon key and the signed-in user's cookies, so every query still goes through RLS.
 * Returns null when Supabase isn't configured.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. proxy.ts refreshes the session.
        }
      },
    },
  });
}

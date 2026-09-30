"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/product/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

export type ProductSupabase = SupabaseClient<Database>;

let browserClient: ProductSupabase | null = null;

/** Browser Supabase client (anon key + the user's session cookie). One instance per tab. */
export function getSupabaseBrowserClient(): ProductSupabase {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  browserClient ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}

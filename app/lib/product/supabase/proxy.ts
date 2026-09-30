import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/product/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// Pages reachable without a session.
const PUBLIC_PATHS = ["/product/login", "/product/auth/"];

/**
 * Refreshes the Supabase auth session on every Product request so Server Components see a valid
 * token, and sends signed-out visitors to the sign-in page. Membership (`app_users`) is checked
 * in the (app) layout, and enforced for data by RLS.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Must run right after creating the client: it revalidates and, if needed, refreshes the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && !PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = "/product/login";
    login.search = path.startsWith("/product/") ? `?next=${encodeURIComponent(path + request.nextUrl.search)}` : "";
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

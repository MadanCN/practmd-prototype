import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/product/supabase/server";

/** Only allow redirects back into the Product section. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/product/") && !next.startsWith("//") ? next : "/product/priorities";
}

/**
 * Magic-link landing. Handles both the PKCE `?code=` redirect (default Supabase email template)
 * and `?token_hash=&type=` links (custom templates, and the e2e test's generated link).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const sb = await getSupabaseServerClient();
  if (sb) {
    const { error } = code
      ? await sb.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await sb.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("missing code") };
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/product/login?error=link", url.origin));
}

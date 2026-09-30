import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/product/supabase/proxy";

// Only the Product section uses Supabase auth; the rest of the prototype is untouched.
export function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/product/:path*"],
};

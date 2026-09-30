import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/product/supabase/server";

export async function POST(request: NextRequest) {
  const sb = await getSupabaseServerClient();
  await sb?.auth.signOut();
  // 303 so the browser follows with a GET.
  return NextResponse.redirect(new URL("/product/login", request.nextUrl.origin), { status: 303 });
}

import type { AppRole } from "@/lib/product/constants";
import { getSupabaseServerClient } from "@/lib/product/supabase/server";

export interface ProductUser {
  email: string;
  displayName: string | null;
  role: AppRole;
}

export type ProductSessionState =
  | { status: "unconfigured" }
  | { status: "signed_out" }
  | { status: "no_access"; email: string }
  | { status: "ok"; user: ProductUser; team: ProductUser[] };

/**
 * Resolves who is signed in and whether they are in `app_users`. RLS only lets members read
 * `app_users`, so a non-member simply gets no rows back.
 */
export async function getProductSession(): Promise<ProductSessionState> {
  const sb = await getSupabaseServerClient();
  if (!sb) return { status: "unconfigured" };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return { status: "signed_out" };

  const email = user.email.toLowerCase();
  const { data } = await sb.from("app_users").select("email, display_name, role").order("display_name");
  const team: ProductUser[] = (data ?? []).map((u) => ({
    email: u.email.toLowerCase(),
    displayName: u.display_name,
    role: (["viewer", "editor", "admin"].includes(u.role) ? u.role : "viewer") as AppRole,
  }));
  const me = team.find((u) => u.email === email);
  if (!me) return { status: "no_access", email };
  return { status: "ok", user: me, team };
}

// Shared helpers for the Product smoke tests (plain Playwright library, no test runner).
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_EMAIL (a member of app_users with
// the editor or admin role), and optionally E2E_BASE_URL (default http://localhost:3000).
import { createClient } from "@supabase/supabase-js";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}. See e2e/README.md.`);
  return v;
}

/** Service-role client: generates sign-in links and cleans up test rows. Never used in the app. */
export function adminClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Signs the browser in as `email` through the real callback route, using an admin-generated magic link. */
export async function signIn(page, email, next = "/product/priorities") {
  const { data, error } = await adminClient().auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const tokenHash = data.properties.hashed_token;
  await page.goto(`${BASE_URL}/product/auth/callback?token_hash=${tokenHash}&type=email&next=${encodeURIComponent(next)}`);
  await page.waitForURL((u) => u.pathname === next, { timeout: 30_000 });
}

export function assert(cond, message) {
  if (!cond) throw new Error(`Assertion failed: ${message}`);
  console.log(`  ✓ ${message}`);
}

/** Polls `fn` until it returns a truthy value, or returns its last (falsy) value after `timeout` ms. */
export async function eventually(fn, timeout = 5_000, interval = 100) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return v;
    await new Promise((r) => setTimeout(r, interval));
  }
}

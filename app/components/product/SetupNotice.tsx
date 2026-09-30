import { Database } from "lucide-react";

/** Shown instead of the Product tabs when the Supabase environment variables are missing. */
export default function SetupNotice() {
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <Database className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">Supabase isn&apos;t connected</p>
        <p>
          Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="font-mono">.env.local</code> (and to Vercel), then restart or redeploy. Steps are in the README under
          &ldquo;Product section — Supabase setup&rdquo;.
        </p>
      </div>
    </div>
  );
}

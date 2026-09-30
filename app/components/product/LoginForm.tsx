"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { Button, Field, inputClass } from "@/components/product/ui/primitives";

const ERRORS: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Request a new one.",
};

/** Only allow redirects back into the Product section. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/product/") && !next.startsWith("//") ? next : "/product/priorities";
}

export default function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(initialError ? (ERRORS[initialError] ?? initialError) : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setState("sending");
    const redirectTo = `${window.location.origin}/product/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
    const { error: err } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: redirectTo },
    });
    if (err) {
      setState("idle");
      setError(err.message);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-pm-border bg-pm-card p-6 text-center">
        <MailCheck className="mx-auto h-8 w-8 text-pm-accent" />
        <p className="mt-3 font-semibold">Check your email</p>
        <p className="mt-1 text-sm text-pm-muted">
          We sent a sign-in link to <span className="font-medium text-pm-text">{email.trim()}</span>. Open it on this device.
        </p>
        <button type="button" onClick={() => setState("idle")} className="mt-4 text-sm font-medium text-pm-link hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-pm-border bg-pm-card p-6" noValidate>
      <Field label="Work email" htmlFor="login-email" error={error ?? undefined}>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@accessionhealthtech.com"
        />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}

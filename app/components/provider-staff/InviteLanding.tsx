"use client";

// What the provider sees when they open an invitation link.
//   valid    → Welcome → set password → (MFA: deferred) → (terms: only if the clinic
//              turned them on) → activation
//   expired  → "This invitation has expired."   (also shown for unknown / superseded links)
//   used     → straight to sign-in
//   deactivated-before-accepting → can still set a password, then "account not active"
// Clinic-branded, never PractMD-branded; no error screens.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { CLINICS } from "@/data/clinics";
import { CLINIC_TERMS_REQUIRED } from "@/data/provider-record";
import { completeInvitation, inviteStateOf, selectRecord, useProviderStore, useProviderStoreReady } from "@/lib/provider-store";
import { setSessionProvider } from "@/lib/provider-session";
import { acceptInvitation, completeAccountStep } from "@/lib/provider-activation";
import { cn } from "@/lib/utils";

type Step = "welcome" | "password" | "terms" | "done";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 10 characters", test: (p) => p.length >= 10 },
  { label: "An uppercase and a lowercase letter", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

function Shell({ clinic, children }: { clinic?: { name: string; emoji: string; email?: string; phone?: string }; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-6">
          <span className="text-3xl">{clinic?.emoji ?? "🏥"}</span>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{clinic?.name ?? "Your clinic"}</span>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8">{children}</div>
        {clinic && (clinic.email || clinic.phone) && (
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Need help? Contact {clinic.name}{clinic.email && <> at {clinic.email}</>}{clinic.phone && <> · {clinic.phone}</>}
          </p>
        )}
      </div>
    </div>
  );
}

export default function InviteLanding({ token }: { token: string }) {
  const router = useRouter();
  const store = useProviderStore();
  const ready = useProviderStoreReady();
  const [step, setStep] = useState<Step>("welcome");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);

  const inv = store.invitations.find((i) => i.token === token);
  const state = inv ? inviteStateOf(inv) : "unknown";
  const provider = inv ? selectRecord(store, inv.providerId) : undefined;
  const clinicRec = CLINICS.find((c) => c.id === provider?.clinicAccess[0]);
  const clinic = clinicRec ? { name: clinicRec.name, emoji: clinicRec.logoEmoji, email: clinicRec.email, phone: clinicRec.phone } : undefined;

  // A link that has already been used just goes to sign-in.
  // The one we finish ourselves (step === "done") must not bounce.
  useEffect(() => {
    if (ready && state === "used" && step !== "done") router.replace("/");
  }, [ready, state, step, router]);

  if (!ready) return <Shell><p className="text-sm text-center text-slate-400">One moment…</p></Shell>;

  if (state === "used" && step !== "done") return <Shell clinic={clinic}><p className="text-sm text-center text-slate-500">Taking you to sign in…</p></Shell>;

  if (state !== "live" && step !== "done") {
    return (
      <Shell clinic={clinic}>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"><Mail className="w-6 h-6 text-slate-400" /></div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">This invitation has expired.</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ask your clinic administrator to send you a new one{clinic ? ` from ${clinic.name}` : ""}. If a newer invitation is already in your inbox, use that link instead.
          </p>
        </div>
      </Shell>
    );
  }

  if (!inv || !provider) return null;

  const rulesOk = RULES.every((r) => r.test(pw));
  const match = pw.length > 0 && pw === pw2;
  const providerId = inv.providerId;

  function finishPassword() {
    if (CLINIC_TERMS_REQUIRED) setStep("terms");
    else finish();
  }
  function finish() {
    completeInvitation(token);
    // Hand off to the provider portal's session/activation state (built separately
    // for the Provider Portal PRD) so /provider/activate resumes as *this* real,
    // just-invited provider instead of whichever provider it last remembered.
    setSessionProvider(providerId);
    acceptInvitation();
    completeAccountStep("welcome");
    completeAccountStep("verify-identity"); // clicking the emailed link is the verification
    completeAccountStep("set-password");
    completeAccountStep("enrol-mfa"); // MFA enrolment is deferred in this prototype
    completeAccountStep("accept-terms"); // either just accepted, or the clinic doesn't require it
    setStep("done");
  }

  return (
    <Shell clinic={clinic}>
      {step === "welcome" && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Welcome, {provider.firstName}.</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {inv.sentBy} has invited you to join {clinic?.name ?? "the clinic"} as a provider. Setting up takes about a minute.
          </p>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-400" /> {inv.email}
          </div>
          <button onClick={() => setStep("password")} className="mt-6 w-full py-2.5 rounded-lg bg-[#1a5c9e] hover:opacity-90 text-white text-sm font-semibold">Get started</button>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={(e) => { e.preventDefault(); if (rulesOk && match) finishPassword(); }}>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Set your password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You&apos;ll use it with {inv.email} to sign in.</p>
          <div className="mt-5 space-y-3">
            <div className="relative">
              <input type={show ? "text" : "password"} autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" aria-label="New password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password" aria-label="Confirm password"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <ul className="space-y-1 pt-1">
              {RULES.map((r) => (
                <li key={r.label} className={cn("flex items-center gap-2 text-xs", r.test(pw) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>
                  <Check className="w-3.5 h-3.5" /> {r.label}
                </li>
              ))}
              <li className={cn("flex items-center gap-2 text-xs", match ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}><Check className="w-3.5 h-3.5" /> Both entries match</li>
            </ul>
          </div>
          <button type="submit" disabled={!rulesOk || !match} className="mt-6 w-full py-2.5 rounded-lg bg-[#1a5c9e] hover:opacity-90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Continue</button>
        </form>
      )}

      {step === "terms" && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Terms of use</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{clinic?.name} asks providers to accept its terms before continuing.</p>
          <button onClick={finish} className="mt-6 w-full py-2.5 rounded-lg bg-[#1a5c9e] hover:opacity-90 text-white text-sm font-semibold">I accept</button>
        </div>
      )}

      {step === "done" && (
        provider.isActive ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">You&apos;re all set</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your account is ready. Next, a quick look at your profile before you start.</p>
            <button onClick={() => router.push("/provider/activate")} className="mt-6 w-full py-2.5 rounded-lg bg-[#1a5c9e] hover:opacity-90 text-white text-sm font-semibold">Continue</button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"><Lock className="w-6 h-6 text-slate-400" /></div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your account is not active</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your password has been saved, but you can&apos;t sign in yet. Please contact your clinic administrator.</p>
          </div>
        )
      )}
    </Shell>
  );
}

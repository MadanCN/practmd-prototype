"use client";

// What the provider sees when they open an invitation link. Matches the
// "Provider Invitation — Email & Link States" design (account setup is one
// combined welcome+password screen, then clinic policies if the clinic
// requires them, then an "account ready" hand-off into the activation wizard).
//   valid    → Account setup → (Policies, if the clinic turned them on) → Account ready
//   expired  → "This invitation has expired." with the admin's contact card
//   replaced → "A newer invitation was sent." (a resend / email edit killed this link)
//   used     → a normal sign-in screen (nothing left to set up)
//   deactivated-before-accepting → password still saves, then "account not active"
// Clinic-branded email; PractMD-branded product chrome from here on. No error screens.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Check, CheckCircle2, Clock, Eye, EyeOff, FileText, KeySquare, Mail, MessageSquare,
  Phone, QrCode, ShieldCheck, Smartphone, UserX, Users, ClipboardList,
} from "lucide-react";
import { PractMdLockup } from "@/components/brand/PractMdLogo";
import { CLINICS } from "@/data/clinics";
import { CLINIC_TERMS_REQUIRED } from "@/data/provider-record";
import { completeInvitation, inviteStateOf, selectRecord, useProviderStore, useProviderStoreReady } from "@/lib/provider-store";
import { setSessionProvider } from "@/lib/provider-session";
import { acceptInvitation, completeAccountStep } from "@/lib/provider-activation";
import { InviteStateSwitcher } from "./InviteStateSwitcher";
import { cn } from "@/lib/utils";

type Step = "account" | "mfa" | "terms" | "ready" | "not-active";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PILLS = [
  { icon: Calendar, label: "Schedule" },
  { icon: Users, label: "Patients" },
  { icon: ClipboardList, label: "Encounters" },
  { icon: MessageSquare, label: "Messages" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0] ?? ""}•••@${domain}`;
}

const input = "w-full px-3.5 h-11 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-sm text-navy-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

/* ── Shared chrome ─────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="h-16 shrink-0 flex items-center justify-center bg-white dark:bg-navy-950 border-b border-slate-200 dark:border-navy-900">
      <PractMdLockup variant="symbol" className="h-6" boxClassName="p-0 bg-transparent" />
    </header>
  );
}

/** Single centered card on a soft navy field — used by every "resolution" screen. */
function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-navy-50 dark:bg-navy-950">
      <TopBar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[448px] bg-white dark:bg-navy-900 rounded-[20px] border border-slate-100 dark:border-navy-800 practmd-card-pop p-8">
          {children}
        </div>
      </main>
      <InviteStateSwitcher />
    </div>
  );
}

/** Left form card / right brand-gradient marketing panel, for account setup & sign-in. */
function SplitScreen({ headline, sub, children }: { headline: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-navy-950">
      <div className="w-full lg:w-[588px] shrink-0 bg-navy-50 dark:bg-navy-950 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[452px] bg-white dark:bg-navy-900 rounded-[20px] practmd-card-pop p-8">{children}</div>
      </div>
      <div className="hidden lg:flex flex-1 relative overflow-hidden practmd-gradient-vivid text-white flex-col p-10">
        <div aria-hidden className="absolute -top-24 right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-brand-300/25 blur-3xl" />
        <PractMdLockup className="h-6 relative self-start shadow-lg" />
        <div className="relative flex-1 flex flex-col justify-center max-w-[440px]">
          <h2 className="text-[33px] leading-[1.13] font-bold tracking-tight">{headline}</h2>
          <p className="mt-3.5 text-[15px] leading-relaxed text-white/90">{sub}</p>
          <div className="mt-5 flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-7 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {PILLS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/15 text-xs font-medium">
                <p.icon className="w-3.5 h-3.5" /> {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <InviteStateSwitcher />
    </div>
  );
}

/** Admin avatar/name/role + mailto/tel — used on the expired/replaced/not-active screens. */
function AdminContactCard({ clinicName, admin }: { clinicName: string; admin?: { name: string; email: string; phone: string; role: string } }) {
  if (!admin) return null;
  const initials = admin.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-200 text-sm font-bold flex items-center justify-center shrink-0">{initials}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{admin.name}</p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">{admin.role} · {clinicName}</p>
        </div>
      </div>
      <a href={`mailto:${admin.email}`} className="flex items-center gap-2 min-h-10 text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"><Mail className="w-4 h-4" />{admin.email}</a>
      <a href={`tel:${admin.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 min-h-10 text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"><Phone className="w-4 h-4" />{admin.phone}</a>
    </div>
  );
}

function ResolutionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-2xl practmd-gradient-vivid text-white flex items-center justify-center">{children}</div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function InviteLanding({ token }: { token: string }) {
  const router = useRouter();
  const store = useProviderStore();
  const ready = useProviderStoreReady();
  const [step, setStep] = useState<Step>("account");
  const [finished, setFinished] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);

  const inv = store.invitations.find((i) => i.token === token);
  const state = inv ? inviteStateOf(inv) : "unknown";
  const provider = inv ? selectRecord(store, inv.providerId) : undefined;
  const clinicRec = CLINICS.find((c) => c.id === provider?.clinicAccess[0]);
  const clinic = clinicRec ? { name: clinicRec.name, emoji: clinicRec.logoEmoji, email: clinicRec.email, phone: clinicRec.phone } : undefined;
  const admin = clinicRec?.admins.find((a) => a.name === inv?.sentBy) ?? clinicRec?.admins[0];

  if (!ready) {
    return <CenteredCard><p className="text-sm text-center text-slate-400">One moment…</p></CenteredCard>;
  }

  /* ── Already used → this is now just a sign-in screen ── */
  if (!finished && state === "used") {
    return (
      <SplitScreen headline="Secure access, built for providers." sub="Your account is protected with the security controls your organization requires.">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 text-[13px] leading-relaxed text-brand-800 dark:text-brand-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
          <span><strong className="font-semibold">Your account is already set up.</strong> Sign in with your email and password.</span>
        </div>
        <h1 className="mt-6 text-[26px] leading-tight font-bold tracking-tight text-navy-900 dark:text-slate-100">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Provider Portal · {clinic?.name ?? "your clinic"}</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="si-email" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Email</label>
            <input id="si-email" type="email" value={inv?.email ?? ""} readOnly className={input} />
          </div>
          <div>
            <label htmlFor="si-pw" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <input id="si-pw" type={show ? "text" : "password"} placeholder="" className={cn(input, "pr-11")} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-end"><a href="#" className="text-[13px] font-semibold text-brand-700 dark:text-brand-400 hover:underline">Forgot password?</a></div>
        <button type="button" onClick={() => router.push("/")} className="mt-4 w-full h-12 rounded-xl practmd-gradient text-white text-sm font-semibold">Sign in</button>
        <p className="mt-4 text-xs text-center text-slate-400">Trouble signing in? Contact your clinic administrator.</p>
      </SplitScreen>
    );
  }

  /* ── A resend / email edit killed this specific link ── */
  if (!finished && state === "invalidated" && inv) {
    return (
      <CenteredCard>
        <ResolutionIcon><Mail className="w-6 h-6" /></ResolutionIcon>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900 dark:text-slate-100">A newer invitation was sent</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {clinic?.name ?? "Your clinic"} sent a fresh invitation, so this link no longer works.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Open the most recent email from {clinic?.name ?? "your clinic"} and use the button there.</p>
        <div className="mt-5 flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
          <Mail className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sent to</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{maskEmail(inv.email)}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Can&apos;t find it? Check your spam or junk folder, or contact {admin?.name ?? "your clinic administrator"}
          {admin && <> at <a href={`mailto:${admin.email}`} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">{admin.email}</a></>}.
        </p>
        <p className="mt-5 text-[13px] text-center text-slate-500 dark:text-slate-400">Already set up your account? <a href="#" onClick={(e) => { e.preventDefault(); router.push("/"); }} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">Sign in</a></p>
      </CenteredCard>
    );
  }

  /* ── Expired (also covers an unknown / delivery-failed link — no error screens) ── */
  if (!finished && (state === "expired" || state === "failed" || state === "unknown")) {
    return (
      <CenteredCard>
        <ResolutionIcon><Clock className="w-6 h-6" /></ResolutionIcon>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900 dark:text-slate-100">This invitation has expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Invitation links stay active for 7 days.{inv && <> This one expired on <strong className="font-semibold text-navy-800 dark:text-slate-200">{fmtDate(inv.expiresAt)}</strong>.</>}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Ask your clinic administrator to send you a new one — you&apos;ll get a fresh email straight away.</p>
        <AdminContactCard clinicName={clinic?.name ?? "your clinic"} admin={admin} />
        <p className="mt-5 text-[13px] text-center text-slate-500 dark:text-slate-400">Already set up your account? <a href="#" onClick={(e) => { e.preventDefault(); router.push("/"); }} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">Sign in</a></p>
      </CenteredCard>
    );
  }

  if (!inv || !provider) return null;

  const providerId = inv.providerId;
  const providerActive = provider.isActive;
  const rulesOk = RULES.every((r) => r.test(pw));
  const match = pw.length > 0 && pw === pw2;

  function finishAccountSetup() {
    setStep("mfa");
  }
  function finishMfa() {
    if (CLINIC_TERMS_REQUIRED) { setStep("terms"); return; }
    finish();
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
    setFinished(true);
    setStep(providerActive ? "ready" : "not-active");
  }

  /* ── Not active (deactivated before accepting) ── */
  if (step === "not-active") {
    return (
      <CenteredCard>
        <ResolutionIcon><UserX className="w-6 h-6" /></ResolutionIcon>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900 dark:text-slate-100">Your account is not active</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Your password has been saved, but your account at <strong className="font-semibold text-navy-800 dark:text-slate-200">{clinic?.name ?? "your clinic"}</strong> isn&apos;t active right now. Please contact your clinic administrator.
        </p>
        <AdminContactCard clinicName={clinic?.name ?? "your clinic"} admin={admin} />
        <p className="mt-4 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">Once your account is active, sign in with this email and the password you just created.</p>
        <p className="mt-5 text-[13px] text-center text-slate-500 dark:text-slate-400"><a href="#" onClick={(e) => { e.preventDefault(); router.push("/"); }} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">Back to sign in</a></p>
      </CenteredCard>
    );
  }

  /* ── Account ready → hand off to the activation wizard ── */
  if (step === "ready") {
    return (
      <CenteredCard>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center justify-center"><CheckCircle2 className="w-9 h-9" /></div>
          <h1 className="mt-5 text-xl font-bold text-navy-900 dark:text-slate-100">You&apos;re all set, {provider.firstName}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your account with <strong className="font-semibold text-navy-800 dark:text-slate-200">{clinic?.name ?? "your clinic"}</strong> is ready.</p>
          <div className="mt-5 w-full flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-left">
            <ShieldCheck className="w-5 h-5 text-navy-700 dark:text-navy-300 mt-px shrink-0" />
            <div>
              <p className="text-sm font-semibold text-navy-800 dark:text-slate-100">Next: confirm your profile and working hours</p>
              <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 mt-0.5">About two minutes — your clinic admin has pre-filled most of it.</p>
            </div>
          </div>
          <button type="button" onClick={() => router.push("/provider/activate")} className="mt-6 w-full h-12 rounded-xl practmd-gradient text-white text-sm font-semibold">Continue to activation</button>
        </div>
      </CenteredCard>
    );
  }

  /* ── Two-factor authentication (always skippable in this prototype) ── */
  if (step === "mfa") {
    return (
      <CenteredCard>
        <ResolutionIcon><ShieldCheck className="w-6 h-6" /></ResolutionIcon>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900 dark:text-slate-100">Set up two-factor authentication</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">This account will hold clinical records, so we recommend adding a second step to sign-in. You can turn it on any time from Settings.</p>
        <div className="mt-5 space-y-2">
          <button type="button" disabled className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 text-left opacity-60 cursor-not-allowed">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-200 flex items-center justify-center shrink-0"><QrCode className="w-4 h-4" /></div>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Authenticator app</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Scan a QR code with an app like Google Authenticator</span>
            </span>
          </button>
          <button type="button" disabled className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 text-left opacity-60 cursor-not-allowed">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-200 flex items-center justify-center shrink-0"><Smartphone className="w-4 h-4" /></div>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Text message</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Get a code by SMS each time you sign in</span>
            </span>
          </button>
        </div>
        <button type="button" onClick={finishMfa} className="mt-5 w-full h-12 rounded-xl practmd-gradient text-white text-sm font-semibold">Skip for now</button>
        <p className="mt-3 flex items-center gap-1.5 justify-center text-xs text-slate-400"><KeySquare className="w-3.5 h-3.5" /> {clinic?.name ?? "Your clinic"} hasn&apos;t made this required</p>
      </CenteredCard>
    );
  }

  /* ── Clinic policies (only when the clinic has switched this on) ── */
  if (step === "terms") {
    return (
      <CenteredCard>
        <button onClick={() => setStep("account")} className="-ml-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><ArrowLeft className="w-4 h-4" /> Back</button>
        <ResolutionIcon><FileText className="w-6 h-6" /></ResolutionIcon>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900 dark:text-slate-100">Review {clinic?.name ?? "the clinic"}&apos;s policies</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{clinic?.name ?? "Your clinic"} asks every provider to accept these before starting.</p>
        <div className="mt-5 space-y-2">
          {["Acceptable use policy", "Provider code of conduct"].map((doc) => (
            <div key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-navy-800">
              <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-200 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{doc}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">PDF</p>
              </div>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[13px] font-semibold text-brand-700 dark:text-brand-400 hover:underline">View</a>
            </div>
          ))}
        </div>
        <label className="mt-5 flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="w-[18px] h-[18px] mt-0.5 accent-brand-600" />
          I&apos;ve read and accept {clinic?.name ?? "the clinic"}&apos;s policies.
        </label>
        <button type="button" disabled={!accept} onClick={finish} className="mt-5 w-full h-12 rounded-xl practmd-gradient text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Accept and continue</button>
        <p className="mt-3 text-xs text-center text-slate-400">Your acceptance is recorded with the date and time.</p>
      </CenteredCard>
    );
  }

  /* ── Account setup: welcome + create password, one screen ── */
  return (
    <SplitScreen headline="Your Provider Portal is ready." sub="Manage your patients, encounters, schedules and clinical work from one place.">
      <form onSubmit={(e) => { e.preventDefault(); if (rulesOk && match) finishAccountSetup(); }}>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-navy-900 dark:text-slate-100">Welcome, {provider.firstName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {inv.sentBy} invited you to join <span className="font-semibold text-navy-800 dark:text-slate-200">{clinic?.name ?? "the clinic"}</span> on PractMD, the platform your clinic uses for patient care.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Create a password to set up your account — it takes about a minute.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input id="email" type="email" value={inv.email} readOnly className={cn(input, "pl-10")} />
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">You&apos;ll use this email to sign in.</p>
          </div>
          <div>
            <label htmlFor="pw" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Create password</label>
            <div className="relative">
              <input id="pw" type={show ? "text" : "password"} autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" aria-label="New password" className={cn(input, "pr-11")} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Your password must contain:</p>
            <ul className="space-y-1.5">
              {RULES.map((r) => (
                <li key={r.label} className={cn("flex items-center gap-2 text-xs", r.test(pw) ? "text-brand-700 dark:text-brand-400" : "text-slate-400")}>
                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0", r.test(pw) ? "bg-brand-100 dark:bg-brand-950/60" : "bg-slate-200 dark:bg-navy-800")}>
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label htmlFor="pw2" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Confirm password</label>
            <div className="relative">
              <input id="pw2" type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password" aria-label="Confirm password" className={cn(input, "pr-11")} />
            </div>
            {pw2.length > 0 && (
              <p className={cn("mt-1.5 flex items-center gap-1.5 text-xs", match ? "text-brand-700 dark:text-brand-400" : "text-rose-600 dark:text-rose-400")}>
                <Check className="w-3.5 h-3.5" /> {match ? "Both entries match" : "Doesn't match yet"}
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={!rulesOk || !match} className="mt-6 w-full h-12 rounded-xl practmd-gradient text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Set up my account</button>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">By continuing, you agree to PractMD&apos;s <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-700 dark:text-brand-400 hover:underline">Terms of Use</a> and <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-700 dark:text-brand-400 hover:underline">Privacy Policy</a>.</p>
      </form>
    </SplitScreen>
  );
}

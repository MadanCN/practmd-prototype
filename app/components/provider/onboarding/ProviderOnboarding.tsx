"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Check, ChevronLeft, Eye, EyeOff, Copy, Download, Smartphone,
  QrCode, KeyRound, ArrowRight, Lock, CheckCircle2, CalendarDays, MessageSquare,
  Users, FileText, DoorOpen, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PractMdLogo, PractMdLockup } from "@/components/brand/PractMdLogo";
import { markProviderOnboarded } from "@/lib/provider-onboarding";
import { FakeQrCode } from "./FakeQrCode";
import { CodeInput } from "./CodeInput";

/* ────────────────────────────────────────────────────────────────────────────
 * Prototype configuration. In the real product these come from the clinic's
 * security policy + the invitation payload. Flip them here to preview variants.
 * ──────────────────────────────────────────────────────────────────────────── */
const CLINIC_NAME = "Penfield Psychiatry";
const PROVIDER_EMAIL = "s.mitchell@penfieldpsych.com";
const MFA_MANDATORY = true;
const SUPPORTS_SMS = false;
const SUPPORTS_EMAIL = false;
const SETUP_KEY = "JBSW Y3DP EHPK 3PXP MZXW 6YTB";

const SLIDES = [
  {
    title: "Your Provider Portal is ready.",
    body: "Manage your patients, encounters, schedules, and clinical work from one place.",
  },
  {
    title: "Everything you need, in one place.",
    body: "Access your patient information and clinical workflows without jumping between systems.",
  },
  {
    title: "Work the way you need to.",
    body: "Review, document, and manage your clinical activities from your Provider Portal.",
  },
  {
    title: "Secure access, built for providers.",
    body: "Your account is protected with the security controls required by your organization.",
  },
];

type Step =
  | "password"
  | "activated"
  | "mfa-intro"
  | "mfa-method"
  | "mfa-download"
  | "mfa-connect"
  | "mfa-verify"
  | "mfa-recovery"
  | "mfa-done";

const MFA_SEQUENCE: Step[] = [
  "mfa-intro", "mfa-method", "mfa-download", "mfa-connect", "mfa-verify", "mfa-recovery",
];

const BACK: Partial<Record<Step, Step>> = {
  "mfa-method": "mfa-intro",
  "mfa-download": "mfa-method",
  "mfa-connect": "mfa-download",
  "mfa-verify": "mfa-connect",
  "mfa-recovery": "mfa-verify",
};

export default function ProviderOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");

  // password
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  // mfa
  const [method, setMethod] = useState<"authenticator" | "sms" | "email" | null>("authenticator");
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  // Recovery codes are generated once, lazily. They are not rendered until the
  // user clicks through to the recovery step, well after hydration.
  const [codes] = useState<string[]>(genRecoveryCodes);
  const [codesCopied, setCodesCopied] = useState(false);
  const [savedAck, setSavedAck] = useState(false);

  function finish() {
    markProviderOnboarded();
    router.push("/provider/today");
  }

  function verifyCode() {
    if (code.length < 6) return;
    // Demo: 000000 shows the friendly "wrong code" state; anything else passes.
    if (code === "000000") {
      setCodeError(true);
      return;
    }
    setCodeError(false);
    setStep("mfa-recovery");
  }

  function downloadCodes() {
    const text = `PractMD — Recovery codes\n${CLINIC_NAME}\nGenerated ${new Date().toLocaleString()}\n\n${codes.join("\n")}\n\nKeep these somewhere safe. Each code works once.\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "practmd-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy(text: string, after: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      after(true);
      setTimeout(() => after(false), 2000);
    } catch {
      /* ignore */
    }
  }

  /* ── Screen 1A — split: set password (left) + brand panel (right) ─────── */
  if (step === "password") {
    return (
      <div className="min-h-screen lg:flex bg-white dark:bg-navy-950">
        <div className="lg:w-[46%] xl:w-[44%] bg-navy-50 dark:bg-navy-950 flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 xl:px-14 lg:h-screen lg:overflow-y-auto">
          <div className="w-full max-w-[452px] mx-auto my-6 bg-white dark:bg-navy-900 rounded-[20px] p-7 sm:p-8 practmd-card-pop">
            <h1 className="text-[26px] font-bold text-navy-900 dark:text-slate-100 tracking-tight">
              Welcome to <span className="text-brand-600 dark:text-brand-400">PractMD</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              You&apos;ve been invited to access the Provider Portal by{" "}
              <span className="font-semibold text-navy-800 dark:text-slate-200">{CLINIC_NAME}</span>.
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Set up your password to activate your account and get started.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-700 dark:text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {PROVIDER_EMAIL}
                </div>
                <Hint>This email will be used to sign in to your account.</Hint>
              </div>

              <PasswordField
                label="Create password"
                placeholder="Enter your password"
                value={pw}
                onChange={setPw}
              />

              <PasswordChecklist pw={pw} />

              <PasswordField
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={setConfirm}
              />
              {confirm.length > 0 && confirm !== pw && (
                <p className="text-xs text-red-500 -mt-1">Passwords don&apos;t match yet.</p>
              )}
            </div>

            <PrimaryButton
              className="mt-6"
              disabled={!isPasswordValid(pw) || pw !== confirm}
              onClick={() => setStep("activated")}
            >
              Set up my account
            </PrimaryButton>

            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              By continuing, you agree to PractMD&apos;s{" "}
              <a href="#" className="text-brand-700 hover:underline">Terms of Use</a> and{" "}
              <a href="#" className="text-brand-700 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        <BrandPanel />
      </div>
    );
  }

  /* ── every other screen: centered card ───────────────────────────────── */
  const backTo = BACK[step];
  const mfaIndex = MFA_SEQUENCE.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col bg-navy-50 dark:bg-navy-950">
      <header className="flex items-center justify-center px-6 h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800">
        <PractMdLogo className="h-7" />
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-navy-900 rounded-[20px] border border-slate-100 dark:border-navy-800 practmd-card-pop p-6 sm:p-8">
            {(backTo || mfaIndex >= 0) && (
              <div className="flex items-center justify-between mb-5 h-6">
                {backTo ? (
                  <button
                    onClick={() => setStep(backTo)}
                    className="flex items-center gap-1 -ml-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <span />}
                {mfaIndex >= 0 && <Stepper total={MFA_SEQUENCE.length} current={mfaIndex} />}
              </div>
            )}

            {step === "activated" && (
              <Centered>
                <SuccessMark />
                <h1 className="mt-5 text-xl font-bold text-navy-900 dark:text-slate-100">
                  Your account is ready
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your PractMD account has been successfully activated.
                </p>
                <p className="mt-4 text-sm font-medium text-navy-800 dark:text-slate-200">
                  Next, let&apos;s secure your account.
                </p>
                <PrimaryButton className="mt-6" onClick={() => setStep("mfa-intro")}>
                  Continue to security setup
                  <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </Centered>
            )}

            {step === "mfa-intro" && (
              <div>
                <IconBadge><ShieldCheck className="w-6 h-6" /></IconBadge>
                <h1 className="mt-4 text-xl font-bold text-navy-900 dark:text-slate-100">
                  Protect your account
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Multi-factor authentication adds an extra layer of security to your PractMD
                  account. You&apos;ll use your password and a verification code when signing in.
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  You&apos;ll need
                </p>
                <ul className="mt-2.5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    Your mobile phone
                  </li>
                  <li className="flex items-start gap-3">
                    <KeyRound className="w-4 h-4 mt-0.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    An authenticator app such as Microsoft Authenticator, Google Authenticator, or Authy
                  </li>
                </ul>
                <PrimaryButton className="mt-6" onClick={() => setStep("mfa-method")}>
                  Set up MFA
                </PrimaryButton>
                {!MFA_MANDATORY && (
                  <p className="mt-3 text-xs text-slate-400 text-center">
                    You can change your MFA settings later from your account settings.
                  </p>
                )}
              </div>
            )}

            {step === "mfa-method" && (
              <div>
                <h1 className="text-xl font-bold text-navy-900 dark:text-slate-100">
                  Choose how you want to verify your identity
                </h1>
                <div className="mt-5 space-y-3">
                  <MethodCard
                    active={method === "authenticator"}
                    onClick={() => setMethod("authenticator")}
                    icon={<Smartphone className="w-5 h-5" />}
                    title="Authenticator app"
                    desc="Use a verification code generated by an authenticator app."
                    recommended
                  />
                  {SUPPORTS_SMS && (
                    <MethodCard
                      active={method === "sms"}
                      onClick={() => setMethod("sms")}
                      icon={<Smartphone className="w-5 h-5" />}
                      title="Text message"
                      desc="Receive a verification code by SMS."
                    />
                  )}
                  {SUPPORTS_EMAIL && (
                    <MethodCard
                      active={method === "email"}
                      onClick={() => setMethod("email")}
                      icon={<KeyRound className="w-5 h-5" />}
                      title="Email"
                      desc="Receive a verification code by email."
                    />
                  )}
                </div>
                <PrimaryButton
                  className="mt-6"
                  disabled={!method}
                  onClick={() => setStep(method === "authenticator" ? "mfa-download" : "mfa-verify")}
                >
                  Continue
                </PrimaryButton>
              </div>
            )}

            {step === "mfa-download" && (
              <div>
                <IconBadge><Smartphone className="w-6 h-6" /></IconBadge>
                <h1 className="mt-4 text-xl font-bold text-navy-900 dark:text-slate-100">
                  Get an authenticator app
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Download an authenticator app on your phone to generate secure verification codes.
                </p>
                <div className="mt-5 space-y-2.5">
                  <StoreButton
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                    label="Google Authenticator"
                  />
                  <StoreButton
                    href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
                    label="Microsoft Authenticator"
                  />
                </div>
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Already have an authenticator app?</p>
                <PrimaryButton className="mt-2" onClick={() => setStep("mfa-connect")}>
                  Continue
                </PrimaryButton>
              </div>
            )}

            {step === "mfa-connect" && (
              <div>
                <IconBadge><QrCode className="w-6 h-6" /></IconBadge>
                <h1 className="mt-4 text-xl font-bold text-navy-900 dark:text-slate-100">
                  Connect your authenticator app
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open your authenticator app and scan the QR code below.
                </p>
                <div className="mt-5 flex justify-center">
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white">
                    <FakeQrCode className="w-44 h-44" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    Can&apos;t scan the QR code? Enter setup key manually
                  </button>
                  {showKey && (
                    <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                      <code className="text-xs sm:text-sm font-mono tracking-wide text-navy-800 dark:text-slate-200 break-all text-left">
                        {SETUP_KEY}
                      </code>
                      <button
                        onClick={() => copy(SETUP_KEY.replace(/ /g, ""), setKeyCopied)}
                        className="shrink-0 text-slate-400 hover:text-brand-700"
                        title="Copy setup key"
                      >
                        {keyCopied ? <Check className="w-4 h-4 text-brand-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-5 text-xs text-slate-400 leading-relaxed">
                  Once your account is added, your authenticator app will generate a 6-digit
                  verification code.
                </p>
                <PrimaryButton className="mt-5" onClick={() => setStep("mfa-verify")}>
                  Continue
                </PrimaryButton>
              </div>
            )}

            {step === "mfa-verify" && (
              <div>
                <h1 className="text-xl font-bold text-navy-900 dark:text-slate-100">
                  Enter your verification code
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter the 6-digit code currently shown in your authenticator app.
                </p>
                <div className="mt-6 flex justify-center">
                  <CodeInput
                    value={code}
                    onChange={(v) => { setCode(v); if (codeError) setCodeError(false); }}
                    invalid={codeError}
                    onComplete={() => setCodeError(false)}
                  />
                </div>
                {codeError ? (
                  <p className="mt-3 text-sm text-red-500 text-center">
                    That code isn&apos;t correct. Check the code in your authenticator app and try again.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400 text-center">The code refreshes every 30 seconds.</p>
                )}
                <PrimaryButton className="mt-6" disabled={code.length < 6} onClick={verifyCode}>
                  Verify and continue
                </PrimaryButton>
              </div>
            )}

            {step === "mfa-recovery" && (
              <div>
                <IconBadge><KeyRound className="w-6 h-6" /></IconBadge>
                <h1 className="mt-4 text-xl font-bold text-navy-900 dark:text-slate-100">
                  Save your recovery codes
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Recovery codes can be used to access your account if you lose access to your
                  authenticator app.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-sm text-navy-800 dark:text-slate-200">
                  {codes.map((c) => <span key={c}>{c}</span>)}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={downloadCodes}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download codes
                  </button>
                  <button
                    onClick={() => copy(codes.join("\n"), setCodesCopied)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    {codesCopied ? <Check className="w-4 h-4 text-brand-600" /> : <Copy className="w-4 h-4" />}
                    {codesCopied ? "Copied" : "Copy codes"}
                  </button>
                </div>
                <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savedAck}
                    onChange={(e) => setSavedAck(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-brand-600"
                  />
                  I have saved my recovery codes somewhere secure.
                </label>
                <PrimaryButton className="mt-5" disabled={!savedAck} onClick={() => setStep("mfa-done")}>
                  Continue
                </PrimaryButton>
              </div>
            )}

            {step === "mfa-done" && (
              <Centered>
                <SuccessMark />
                <h1 className="mt-5 text-xl font-bold text-navy-900 dark:text-slate-100">You&apos;re all set</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your account is now protected with multi-factor authentication.
                </p>
                <p className="mt-4 text-sm font-medium text-navy-800 dark:text-slate-200">
                  Let&apos;s take you to your Provider Portal.
                </p>
                <PrimaryButton className="mt-6" onClick={finish}>
                  Go to Provider Portal
                  <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </Centered>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Need help? Contact your clinic administrator or{" "}
            <a href="#" className="text-brand-700 hover:underline">PractMD Support</a>.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function BrandPanel() {
  const [slide, setSlide] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setSlide((s) => (s + 1) % SLIDES.length);
    }, 5200);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="hidden lg:flex lg:flex-1 relative overflow-hidden practmd-gradient-vivid text-white flex-col p-9 xl:px-12 xl:py-10"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      {/* ambient depth */}
      <svg
        viewBox="0 0 240 130" aria-hidden="true"
        className="absolute -right-16 top-16 w-[500px] h-auto opacity-[0.09]"
        fill="none" stroke="currentColor" strokeWidth={12}
      >
        <circle cx="74" cy="65" r="46" />
        <circle cx="166" cy="65" r="46" />
      </svg>
      <div className="absolute -top-24 right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl practmd-animate-float" />
      <div className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-brand-300/25 blur-3xl practmd-animate-float" style={{ animationDelay: "-6s" }} />

      {/* top — logo */}
      <PractMdLockup className="h-6" boxClassName="relative self-start shadow-lg shadow-navy-950/25" />

      {/* middle — headline + chips, centred in the leftover space */}
      <div className="relative flex-1 flex flex-col justify-center min-h-0 py-8">
        <div className="max-w-lg">
          <div key={slide} className="practmd-animate-fade-up">
            <h2 className="text-[28px] xl:text-[33px] leading-[1.13] font-bold tracking-tight">
              {SLIDES[slide].title}
            </h2>
            <p className="mt-3.5 text-[15px] text-white/80 leading-relaxed max-w-md">{SLIDES[slide].body}</p>
          </div>
          <div className="mt-5 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === slide ? "w-7 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60",
                )}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Schedule", icon: CalendarDays },
              { label: "Patients", icon: Users },
              { label: "Encounters", icon: FileText },
              { label: "Messages", icon: MessageSquare },
            ].map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.13] border border-white/[0.14] text-xs font-medium"
              >
                <Icon className="w-[15px] h-[15px]" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* bottom — layered portal preview */}
      <div className="relative shrink-0 flex justify-end">
        <PortalPreviewMock />
      </div>
    </div>
  );
}

/** A stylised peek at the Provider Portal, echoing the marketing-panel product shot. */
function PortalPreviewMock() {
  return (
    <div className="relative self-end w-[404px] max-w-full -mr-2 xl:-mr-4">
      {/* floating "new message" toast */}
      <div className="absolute -top-4 right-0 z-20 w-[220px] bg-white rounded-xl p-3 shadow-2xl shadow-navy-950/40 flex gap-2.5 text-navy-900">
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-navy-600 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-navy-900">New message</span>
          <span className="block text-[10.5px] text-slate-400 mt-0.5 leading-tight">Marcus Webb · Follow-up question</span>
        </span>
        <span className="w-[7px] h-[7px] rounded-full bg-brand-500 shrink-0 mt-0.5" />
      </div>

      {/* window */}
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl shadow-navy-950/50 text-navy-900">
        <div className="flex items-center gap-1.5 px-4 h-8 bg-slate-50 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-brand-400" />
          <span className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="ml-1.5 text-[11px] font-semibold text-slate-500">Provider Portal — Today</span>
        </div>
        <div className="p-3.5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: CalendarDays, n: "9", l: "Appointments" },
              { icon: DoorOpen, n: "6", l: "Checked in" },
              { icon: MessageSquare, n: "4", l: "Messages" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-100 p-2">
                <div className="w-5 h-5 rounded-md practmd-gradient-vivid flex items-center justify-center">
                  <s.icon className="w-3 h-3 text-white" />
                </div>
                <p className="mt-1 text-sm font-bold leading-none">{s.n}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 space-y-2">
            {[
              { bar: "bg-navy-600", t: "9:00 AM · Follow-up", tag: "In person", join: false },
              { bar: "bg-sky-500", t: "10:00 AM · Initial consult", tag: "In person", join: false },
              { bar: "bg-brand-400", t: "10:30 AM · Telehealth", tag: "Join", join: true },
            ].map((r) => (
              <div key={r.t} className="flex items-center gap-2.5">
                <span className={cn("w-[3px] h-6 rounded-full shrink-0", r.bar)} />
                <div className="flex-1 min-w-0">
                  <div className="h-[6px] w-24 rounded-full bg-slate-200" />
                  <p className="mt-1 text-[9.5px] text-slate-400">{r.t}</p>
                </div>
                {r.join ? (
                  <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-white practmd-gradient px-2 py-1 rounded-md">
                    <Video className="w-3 h-3" /> Join
                  </span>
                ) : (
                  <span className="shrink-0 text-[9px] font-semibold text-slate-300">{r.tag}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating "waiting" chip */}
      <div className="absolute -left-6 -bottom-3 z-20 bg-white rounded-xl px-3 py-2 shadow-2xl shadow-navy-950/40 flex gap-2 items-center text-navy-900">
        <span className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
          <DoorOpen className="w-3.5 h-3.5 text-brand-600" />
        </span>
        <span className="text-xs font-semibold text-navy-900">6 patients waiting</span>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-slate-400">{children}</p>;
}

function PasswordField({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

const PW_RULES: { label: string; test: (s: string) => boolean }[] = [
  { label: "At least 8 characters", test: (s) => s.length >= 8 },
  { label: "One uppercase letter", test: (s) => /[A-Z]/.test(s) },
  { label: "One lowercase letter", test: (s) => /[a-z]/.test(s) },
  { label: "One number", test: (s) => /[0-9]/.test(s) },
  { label: "One special character", test: (s) => /[^A-Za-z0-9]/.test(s) },
];

function isPasswordValid(s: string) {
  return PW_RULES.every((r) => r.test(s));
}

function PasswordChecklist({ pw }: { pw: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 p-3">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        Your password must contain:
      </p>
      <ul className="space-y-1">
        {PW_RULES.map((r) => {
          const ok = pw.length > 0 && r.test(pw);
          return (
            <li key={r.label} className={cn("flex items-center gap-2 text-xs", ok ? "text-brand-700 dark:text-brand-400" : "text-slate-400")}>
              <span className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0", ok ? "bg-brand-100 dark:bg-brand-950" : "bg-slate-200 dark:bg-navy-800")}>
                {ok && <Check className="w-2.5 h-2.5" />}
              </span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PrimaryButton({
  children, onClick, disabled, className,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
        disabled
          ? "bg-slate-100 dark:bg-navy-800 text-slate-400 cursor-not-allowed"
          : "practmd-gradient text-white shadow-sm shadow-navy-900/20",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Stepper({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-5 bg-brand-500" : i < current ? "w-1.5 bg-brand-300" : "w-1.5 bg-slate-200 dark:bg-navy-800",
          )}
        />
      ))}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center text-center">{children}</div>;
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-2xl practmd-gradient-vivid text-white flex items-center justify-center shadow-sm shadow-navy-900/20">
      {children}
    </div>
  );
}

function SuccessMark() {
  return (
    <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center practmd-animate-fade-up">
      <CheckCircle2 className="w-9 h-9 text-brand-600 dark:text-brand-400" />
    </div>
  );
}

function MethodCard({
  active, onClick, icon, title, desc, recommended,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-colors",
        active
          ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/20 dark:border-brand-600"
          : "border-slate-200 dark:border-navy-800 hover:border-brand-300",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", active ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-900 dark:text-slate-100">{title}</span>
          {recommended && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400">
              Recommended
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
      </span>
      <span
        className={cn(
          "ml-auto mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
          active ? "border-brand-600 bg-brand-600" : "border-slate-300 dark:border-navy-700",
        )}
      >
        {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

function StoreButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-800 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
    >
      <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm font-medium text-navy-900 dark:text-slate-200">{label}</span>
      <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
    </a>
  );
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genRecoveryCodes(): string[] {
  const rand = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  return Array.from({ length: 10 }, () => `${rand(4)}-${rand(4)}`);
}

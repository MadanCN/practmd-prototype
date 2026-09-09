"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, CheckCircle2, UserRound, CalendarClock, Bell, Compass, ShieldCheck,
} from "lucide-react";
import { PractMdLogo } from "@/components/brand/PractMdLogo";
import { cn } from "@/lib/utils";
import { DAYS } from "@/data/clinics";
import { useProviderSession, setSessionStatus } from "@/lib/provider-session";
import {
  useActivation, completeActivationStep, recordCorrection, submitCredentials, finishActivation, ACTIVATION_STEPS,
} from "@/lib/provider-activation";
import { markProviderOnboarded } from "@/lib/provider-onboarding";

type StepId = (typeof ACTIVATION_STEPS)[number];

const STEP_META: Record<StepId, { n: number; label: string; icon: React.ElementType; skippable: boolean }> = {
  "confirm-profile": { n: 5, label: "Confirm profile", icon: UserRound, skippable: false },
  "confirm-hours": { n: 6, label: "Confirm working hours", icon: CalendarClock, skippable: false },
  "notification-prefs": { n: 7, label: "Notification preferences", icon: Bell, skippable: true },
  tour: { n: 8, label: "Product tour", icon: Compass, skippable: true },
};

export default function ActivateWizardPage() {
  const router = useRouter();
  const { provider, profile } = useProviderSession();
  const activation = useActivation();
  const [stepIdx, setStepIdx] = useState(() => {
    const firstUndone = ACTIVATION_STEPS.findIndex((s) => !activation.activationStepsDone.includes(s));
    return firstUndone === -1 ? 0 : firstUndone;
  });

  const step = ACTIVATION_STEPS[stepIdx];

  // profile fields (pre-filled from what the admin entered)
  const [displayName, setDisplayName] = useState(provider.displayName);
  const [preferred, setPreferred] = useState(provider.firstName);
  const [suffix, setSuffix] = useState(provider.credentials);
  const [npi, setNpi] = useState(profile.npi);
  const [bio, setBio] = useState(provider.bio);
  const original = useMemo(() => ({ displayName: provider.displayName, suffix: provider.credentials, npi: profile.npi }), [provider, profile]);

  // working hours
  const [hours, setHours] = useState(
    DAYS.map((d) => {
      const wh = provider.workingHours.find((w) => w.day === d);
      return { day: d, isOpen: wh?.isOpen ?? false, open: wh?.openTime ?? "09:00", close: wh?.closeTime ?? "17:00" };
    }),
  );

  // notification prefs
  const [prefs, setPrefs] = useState({ apptBooked: true, apptChanged: true, noteUnsigned: true, cosign: true, messages: true, escalation: true });

  function next() {
    if (step === "confirm-profile") {
      if (displayName !== original.displayName) recordCorrection("Display name", original.displayName, displayName);
      if (suffix !== original.suffix) recordCorrection("Credentials suffix", original.suffix, suffix);
      if (npi !== original.npi) recordCorrection("NPI", original.npi, npi);
      completeActivationStep("confirm-profile");
    }
    if (step === "confirm-hours") {
      completeActivationStep("confirm-hours");
      submitCredentials();
      setSessionStatus("under-verification");
    }
    if (step === "notification-prefs") completeActivationStep("notification-prefs");
    if (step === "tour") completeActivationStep("tour");

    if (stepIdx < ACTIVATION_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else complete();
  }

  function complete() {
    markProviderOnboarded();
    finishActivation();
    router.push("/provider/readiness");
  }

  const Icon = STEP_META[step].icon;

  return (
    <div className="min-h-screen flex flex-col bg-navy-50 dark:bg-navy-950">
      <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800">
        <PractMdLogo className="h-7" />
        <div className="flex items-center gap-1.5">
          {ACTIVATION_STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 rounded-full transition-all", i === stepIdx ? "w-6 bg-brand-500" : i < stepIdx ? "w-1.5 bg-brand-300" : "w-1.5 bg-slate-200 dark:bg-navy-800")} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-[20px] border border-slate-100 dark:border-navy-800 practmd-card-pop p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl practmd-gradient-vivid text-white flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step {STEP_META[step].n} of 8</p>
              <h1 className="text-lg font-bold text-navy-900 dark:text-slate-100">{STEP_META[step].label}</h1>
            </div>
          </div>

          {step === "confirm-profile" && (
            <div className="mt-5 space-y-3.5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pre-filled from what {provider.clinicAccess.length ? "your clinic admin" : "the admin"} entered. Confirm or correct — a change to NPI or licence raises a task to Credentialing.
              </p>
              <L label="Display name"><I value={displayName} onChange={setDisplayName} /></L>
              <L label="Preferred name"><I value={preferred} onChange={setPreferred} /></L>
              <L label="Credentials suffix"><I value={suffix} onChange={setSuffix} /></L>
              <L label="NPI (Type 1)"><I value={npi} onChange={setNpi} /></L>
              <L label="Professional bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputCls} /></L>
            </div>
          )}

          {step === "confirm-hours" && (
            <div className="mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Your standing week at {provider.city}. Completing this step submits your credentials for verification.
              </p>
              <div className="space-y-1.5">
                {hours.map((h, i) => (
                  <div key={h.day} className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 w-28 shrink-0">
                      <input type="checkbox" checked={h.isOpen} onChange={(e) => setHours((hs) => hs.map((x, j) => (j === i ? { ...x, isOpen: e.target.checked } : x)))} className="w-3.5 h-3.5 rounded accent-brand-600" />
                      <span className="text-slate-700 dark:text-slate-300">{h.day.slice(0, 3)}</span>
                    </label>
                    {h.isOpen ? (
                      <div className="flex items-center gap-1.5">
                        <input type="time" value={h.open} onChange={(e) => setHours((hs) => hs.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-xs" />
                        <span className="text-slate-400">–</span>
                        <input type="time" value={h.close} onChange={(e) => setHours((hs) => hs.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-xs" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Not working</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "notification-prefs" && (
            <div className="mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sensible defaults are selected. You can change these any time in Settings.</p>
              <div className="space-y-2">
                {([
                  ["apptBooked", "New appointment booked"],
                  ["apptChanged", "Appointment cancelled or rescheduled"],
                  ["noteUnsigned", "Encounter checked out, note unsigned"],
                  ["cosign", "Co-signature requested / returned"],
                  ["messages", "New patient message"],
                  ["escalation", "Unsigned note escalation"],
                ] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs((p) => ({ ...p, [k]: e.target.checked }))} className="w-4 h-4 rounded accent-brand-600" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === "tour" && (
            <div className="mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Seven areas, under a minute. You can replay it any time from the <span className="font-semibold">?</span> in the header.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["Today", "Schedule", "Clinical Notes", "Waiting Room", "Telehealth", "Patients", "Tasks"].map((a) => (
                  <div key={a} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-brand-500" /> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2">
            {stepIdx > 0 && (
              <button onClick={() => setStepIdx(stepIdx - 1)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {STEP_META[step].skippable && stepIdx < ACTIVATION_STEPS.length - 1 && (
              <button onClick={() => setStepIdx(stepIdx + 1)} className="px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                Skip
              </button>
            )}
            <button onClick={next} className="ml-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold practmd-gradient text-white">
              {stepIdx === ACTIVATION_STEPS.length - 1 ? <><ShieldCheck className="w-4 h-4" /> Finish activation</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </main>

      <footer className="pb-6 text-center">
        <p className="text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-brand-500" />
          Each step saves as you go — you can close this and pick up where you left off.
        </p>
      </footer>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
function I({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle2, UserRound, CalendarClock, Bell, ShieldCheck, Mail, MessageSquareMore, Smartphone,
} from "lucide-react";
import { PractMdLogo } from "@/components/brand/PractMdLogo";
import { cn } from "@/lib/utils";
import { CLINICS } from "@/data/clinics";
import { PROVIDER_TYPES, SERVICES_LIST, SPECIALIZATIONS_LIST, VISIT_TYPES_LIST } from "@/data/providers";
import {
  NPI_QUALIFIER, providerInitials, qualifierLabel, type CredentialRow, type EducationRow, type ProviderRecord,
} from "@/data/provider-record";
import { readPhoto } from "@/lib/photo";
import { useProviderSession } from "@/lib/provider-session";
import {
  useActivation, completeActivationStep, submitCredentials, finishActivation, ACTIVATION_STEPS,
} from "@/lib/provider-activation";
import { markProviderOnboarded } from "@/lib/provider-onboarding";
import { changeStatus, getRecord, submitCorrection, type CorrectionFieldDiff } from "@/lib/provider-store";
import WorkingHoursEditor, { type LocationOption } from "@/components/ui/WorkingHoursEditor";
import { Field, INPUT, MultiSelect } from "@/components/provider-staff/form/fields";

type StepId = (typeof ACTIVATION_STEPS)[number];

const STEP_META: Record<StepId, { label: string; icon: React.ElementType; skippable: boolean }> = {
  "confirm-profile": { label: "Confirm profile", icon: UserRound, skippable: false },
  "confirm-hours": { label: "Confirm working hours", icon: CalendarClock, skippable: false },
  "notification-prefs": { label: "Notification preferences", icon: Bell, skippable: true },
};

type NotifChannel = "inApp" | "email";
const NOTIF_ROWS: { key: string; label: string; lockedInApp?: boolean }[] = [
  { key: "apptBooked", label: "New appointment booked" },
  { key: "apptChanged", label: "Appointment cancelled or rescheduled" },
  { key: "noteUnsigned", label: "Encounter checked out, note unsigned" },
  { key: "cosign", label: "Co-signature requested / returned" },
  { key: "messages", label: "New patient message" },
  { key: "escalation", label: "Unsigned note escalation", lockedInApp: true },
];

let eduSeq = 0;
const newEduId = () => `wed_${Date.now().toString(36)}${eduSeq++}`;

function diffStr(field: string, from: string, to: string, out: CorrectionFieldDiff[]) {
  if (from.trim() !== to.trim()) out.push({ field, from: from.trim() || "Not specified", to: to.trim() || "Not specified" });
}
function diffList(field: string, from: string[], to: string[], out: CorrectionFieldDiff[]) {
  const a = from.join(", "), b = to.join(", ");
  if (a !== b) out.push({ field, from: a || "None selected", to: b || "None selected" });
}

export default function ActivateWizardPage() {
  const router = useRouter();
  const { raw } = useProviderSession();
  const activation = useActivation();

  // The record as the admin left it — fetched once when the wizard mounts, so
  // "what changed" always diffs against what the provider was actually shown,
  // not against whatever the record has become mid-session.
  const [record] = useState<ProviderRecord | undefined>(() => getRecord(raw.providerId));

  const [stepIdx, setStepIdx] = useState(() => {
    const firstUndone = ACTIVATION_STEPS.findIndex((s) => !activation.activationStepsDone.includes(s));
    return firstUndone === -1 ? 0 : firstUndone;
  });
  const step = ACTIVATION_STEPS[stepIdx];

  // ── Confirm-profile field state, seeded from the real record ──
  const [photo, setPhoto] = useState(record?.photo ?? "");
  const [firstName, setFirstName] = useState(record?.firstName ?? "");
  const [middleName, setMiddleName] = useState(record?.middleName ?? "");
  const [lastName, setLastName] = useState(record?.lastName ?? "");
  const [suffix, setSuffix] = useState(record?.credentialsSuffix ?? "");
  const [phone, setPhone] = useState(record?.phone ?? "");
  const [dob, setDob] = useState(record?.dob ?? "");
  const [credentials, setCredentials] = useState<CredentialRow[]>(record?.credentials ?? []);
  const [providerType, setProviderType] = useState(record?.providerType ?? "");
  const [visitTypes, setVisitTypes] = useState<string[]>(record?.visitTypes ?? []);
  const [specializations, setSpecializations] = useState<string[]>(record?.specializations ?? []);
  const [aboutProvider, setAboutProvider] = useState(record?.aboutProvider ?? "");
  const [education, setEducation] = useState<EducationRow[]>(record?.education ?? []);
  const [yearsExperience, setYearsExperience] = useState(record?.yearsExperience ?? "");
  const [experienceSummary, setExperienceSummary] = useState(record?.experienceSummary ?? "");
  const [servicesProvided, setServicesProvided] = useState<string[]>(record?.servicesProvided ?? []);

  const fileRef = useRef<HTMLInputElement>(null);
  const profileOn = record?.capabilities.include_for_self_scheduling ?? false;
  const clinicNames = (record?.clinicAccess ?? []).map((id) => CLINICS.find((c) => c.id === id)?.name).filter((x): x is string => !!x);

  // ── Confirm-hours field state ──
  const [hours, setHours] = useState(record?.workingHours ?? []);
  const hourLocations: LocationOption[] = CLINICS
    .filter((c) => record?.clinicAccess.includes(c.id))
    .flatMap((c) => c.locations.map((l) => ({ id: l.id, name: l.name })));

  // ── Notification prefs — In App / Email toggles per row; SMS is coming soon (not
  // yet a channel we can actually deliver on), and "Unsigned note escalation" can't
  // have its In App alert turned off — that's the one that keeps a note from going
  // stale unsigned, so it isn't something to silence by accident. No record field
  // backs these yet, same as before this pass. ──
  const [prefs, setPrefs] = useState<Record<string, Record<NotifChannel, boolean>>>(() =>
    Object.fromEntries(NOTIF_ROWS.map((r) => [r.key, { inApp: true, email: true }])));
  const [notice, setNotice] = useState<string | null>(null);

  function submitProfileCorrection(): number {
    if (!record) return 0;
    const fields: CorrectionFieldDiff[] = [];
    diffStr("First name", record.firstName, firstName, fields);
    diffStr("Middle name", record.middleName, middleName, fields);
    diffStr("Last name", record.lastName, lastName, fields);
    diffStr("Credentials suffix", record.credentialsSuffix, suffix, fields);
    diffStr("Phone number", record.phone, phone, fields);
    diffStr("Date of birth", record.dob, dob, fields);
    diffStr("Provider type", record.providerType, providerType, fields);
    diffList("Visit types", record.visitTypes, visitTypes, fields);
    diffList("Specializations", record.specializations, specializations, fields);
    record.credentials.forEach((orig, i) => {
      const cur = credentials[i];
      if (!cur) return;
      const label = orig.qualifier === NPI_QUALIFIER ? "NPI" : qualifierLabel(orig.qualifier);
      diffStr(label, orig.value, cur.value, fields);
      diffStr(`${label} expiry`, orig.expiry, cur.expiry, fields);
    });
    if (profileOn) {
      diffStr("About provider", record.aboutProvider, aboutProvider, fields);
      diffStr("Years of experience", record.yearsExperience, yearsExperience, fields);
      diffStr("Experience summary", record.experienceSummary, experienceSummary, fields);
      diffList("Services provided", record.servicesProvided, servicesProvided, fields);
      if (JSON.stringify(record.education) !== JSON.stringify(education)) fields.push({ field: "Education", from: "As entered by the admin", to: "Updated by the provider" });
    }
    if (photo !== record.photo) fields.push({ field: "Photo", from: record.photo ? "Previous photo" : "No photo", to: "New photo" });

    const patch: Partial<ProviderRecord> = {
      firstName, middleName, lastName, credentialsSuffix: suffix, phone, dob, photo, credentials,
      providerType, visitTypes, specializations,
      ...(profileOn ? { aboutProvider, education, yearsExperience, experienceSummary, servicesProvided } : {}),
    };
    const revertPatch: Partial<ProviderRecord> = {
      firstName: record.firstName, middleName: record.middleName, lastName: record.lastName, credentialsSuffix: record.credentialsSuffix,
      phone: record.phone, dob: record.dob, photo: record.photo, credentials: record.credentials,
      providerType: record.providerType, visitTypes: record.visitTypes, specializations: record.specializations,
      ...(profileOn ? { aboutProvider: record.aboutProvider, education: record.education, yearsExperience: record.yearsExperience, experienceSummary: record.experienceSummary, servicesProvided: record.servicesProvided } : {}),
    };
    submitCorrection(record.id, "profile", fields, patch, revertPatch);
    return fields.length;
  }

  function submitHoursCorrection(): number {
    if (!record) return 0;
    if (JSON.stringify(record.workingHours) === JSON.stringify(hours)) return 0;
    submitCorrection(record.id, "hours", [{ field: "Working hours", from: "As entered by the admin", to: "Updated by the provider" }],
      { workingHours: hours }, { workingHours: record.workingHours });
    return 1;
  }

  function next() {
    let nextNotice: string | null = null;
    if (step === "confirm-profile") {
      const changed = submitProfileCorrection();
      completeActivationStep("confirm-profile");
      if (changed > 0) nextNotice = `${changed} change${changed === 1 ? "" : "s"} to your profile ${changed === 1 ? "was" : "were"} sent to your clinic admin for review.`;
    }
    if (step === "confirm-hours") {
      const changed = submitHoursCorrection();
      completeActivationStep("confirm-hours");
      submitCredentials();
      // Activation wizard complete → status moves from Account Setup to Under
      // Verification (PRD "Activation Wizard completion"); Credentialing then
      // reviews before Clinic Admin approval moves it to Clinically Active.
      if (record) changeStatus(record.id, "under-verification", "Activation wizard completed — credentials submitted for verification");
      if (changed > 0) nextNotice = "Your working-hours change was sent to your clinic admin for review.";
    }
    if (step === "notification-prefs") completeActivationStep("notification-prefs");

    setNotice(nextNotice);
    if (stepIdx < ACTIVATION_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else complete();
  }

  function complete() {
    markProviderOnboarded();
    finishActivation();
    router.push("/provider/readiness");
  }

  const Icon = STEP_META[step].icon;

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 dark:bg-navy-950">
        <p className="text-sm text-slate-400">Loading your profile…</p>
      </div>
    );
  }

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

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-[20px] border border-slate-100 dark:border-navy-800 practmd-card-pop p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl practmd-gradient-vivid text-white flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-navy-900 dark:text-slate-100">{STEP_META[step].label}</h1>
          </div>

          {notice && (
            <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 text-[13px] leading-relaxed text-brand-800 dark:text-brand-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-px" />
              <span>{notice}</span>
            </div>
          )}

          {step === "confirm-profile" && (
            <div className="mt-5 space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pre-filled from what your clinic admin entered. Confirm it&apos;s right, or correct it — changes save immediately and go to your admin to review.
              </p>

              <div className="flex gap-4 items-start">
                <div className="shrink-0">
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Upload photo"
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 flex items-center justify-center text-slate-400 hover:border-brand-400 group">
                    {photo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photo} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-slate-400">{providerInitials({ firstName, lastName })}</span>}
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">{photo ? "Change" : "Upload"}</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) try { setPhoto(await readPhoto(f)); } catch { /* unreadable image */ }
                    }} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <L label="First name"><I value={firstName} onChange={setFirstName} /></L>
                  <L label="Last name"><I value={lastName} onChange={setLastName} /></L>
                  <L label="Middle name"><I value={middleName} onChange={setMiddleName} /></L>
                  <L label="Credentials suffix"><I value={suffix} onChange={setSuffix} placeholder="e.g. MD, PsyD" /></L>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <L label="Phone number"><I value={phone} onChange={setPhone} /></L>
                <L label="Date of birth"><input type="date" value={dob} max={new Date().toISOString().split("T")[0]} onChange={(e) => setDob(e.target.value)} className={fieldCls} /></L>
              </div>
              <L label="Email"><input value={record.email} readOnly disabled className={fieldCls} /></L>
              <p className="-mt-3 text-xs text-slate-400">Your email is your login. Ask your clinic admin to change it.</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider type">
                  <select value={providerType} onChange={(e) => setProviderType(e.target.value)} className={INPUT}>
                    <option value="">Select provider type</option>
                    {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Visit types offered">
                  <MultiSelect options={VISIT_TYPES_LIST} value={visitTypes} onChange={setVisitTypes} placeholder="Select visit types" />
                </Field>
                <Field label="Specializations" className="col-span-2">
                  <MultiSelect options={SPECIALIZATIONS_LIST} value={specializations} onChange={setSpecializations} placeholder="Select specializations" />
                </Field>
              </div>

              {clinicNames.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Clinic access</p>
                  <div className="flex flex-wrap gap-1.5">
                    {clinicNames.map((n) => <span key={n} className="px-2 py-0.5 rounded-md text-xs bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-300 border border-navy-100 dark:border-navy-800">{n}</span>)}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Set by your clinic admin.</p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Credentials</p>
                <div className="rounded-xl border border-slate-200 dark:border-navy-800 divide-y divide-slate-100 dark:divide-navy-800">
                  {credentials.map((c, i) => (
                    <div key={c.id} className="px-3.5 py-2.5 grid grid-cols-[1fr_1fr_140px] gap-2.5 items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.qualifier === NPI_QUALIFIER ? "NPI" : qualifierLabel(c.qualifier)}</span>
                      <input aria-label="Value" className={cn(fieldCls, "font-mono")} value={c.value}
                        onChange={(e) => setCredentials((cs) => cs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                      <input aria-label="Expiry" type="date" className={fieldCls} value={c.expiry}
                        onChange={(e) => setCredentials((cs) => cs.map((x, j) => (j === i ? { ...x, expiry: e.target.value } : x)))} />
                    </div>
                  ))}
                </div>
              </div>

              {profileOn && (
                <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-navy-800">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-4">Profile & bio — shown to patients while self-scheduling</p>
                  <L label="About you"><textarea value={aboutProvider} onChange={(e) => setAboutProvider(e.target.value)} rows={3} className={cn(fieldCls, "resize-y")} /></L>
                  <div>
                    <p className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Education</p>
                    <div className="space-y-2">
                      {education.map((e) => (
                        <div key={e.id} className="grid grid-cols-[1fr_1.3fr_80px] gap-2">
                          <input aria-label="Degree" placeholder="Degree" value={e.degree} className={fieldCls}
                            onChange={(ev) => setEducation((eds) => eds.map((x) => (x.id === e.id ? { ...x, degree: ev.target.value } : x)))} />
                          <input aria-label="Institution" placeholder="Institution" value={e.institution} className={fieldCls}
                            onChange={(ev) => setEducation((eds) => eds.map((x) => (x.id === e.id ? { ...x, institution: ev.target.value } : x)))} />
                          <input aria-label="Year" placeholder="Year" value={e.year} maxLength={4} className={fieldCls}
                            onChange={(ev) => setEducation((eds) => eds.map((x) => (x.id === e.id ? { ...x, year: ev.target.value.replace(/\D/g, "").slice(0, 4) } : x)))} />
                        </div>
                      ))}
                      <button type="button" onClick={() => setEducation((eds) => [...eds, { id: newEduId(), degree: "", institution: "", year: "" }])}
                        className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">+ Add education</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <L label="Years of experience"><input inputMode="numeric" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value.replace(/\D/g, "").slice(0, 2))} className={fieldCls} /></L>
                    <Field label="Services provided"><MultiSelect options={SERVICES_LIST} value={servicesProvided} onChange={setServicesProvided} placeholder="Select services" /></Field>
                  </div>
                  <L label="Experience summary"><textarea value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)} rows={2} className={cn(fieldCls, "resize-y")} /></L>
                </div>
              )}
            </div>
          )}

          {step === "confirm-hours" && (
            <div className="mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Your standing week, as your clinic admin set it up. Completing this step submits your profile for verification.
              </p>
              {hourLocations.length > 0 ? (
                <WorkingHoursEditor hours={hours} onChange={setHours} locations={hourLocations} />
              ) : (
                <p className="text-sm text-slate-400">No clinic locations on file yet — ask your clinic admin.</p>
              )}
            </div>
          )}

          {step === "notification-prefs" && (
            <div className="mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sensible defaults are selected. You can change these any time in Settings.</p>
              <div className="rounded-xl border border-slate-200 dark:border-navy-800 overflow-hidden">
                <div className="grid grid-cols-[1fr_60px_60px_76px] gap-2 px-3.5 py-2 bg-slate-50 dark:bg-navy-950 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span />
                  <span className="text-center flex flex-col items-center gap-0.5"><MessageSquareMore className="w-3.5 h-3.5" />In App</span>
                  <span className="text-center flex flex-col items-center gap-0.5"><Mail className="w-3.5 h-3.5" />Email</span>
                  <span className="text-center flex flex-col items-center gap-0.5"><Smartphone className="w-3.5 h-3.5" />SMS</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-navy-800">
                  {NOTIF_ROWS.map((r) => (
                    <div key={r.key} className="grid grid-cols-[1fr_60px_60px_76px] gap-2 px-3.5 py-2.5 items-center text-sm text-slate-700 dark:text-slate-300">
                      <span>{r.label}</span>
                      <span className="flex justify-center">
                        <input type="checkbox" checked={prefs[r.key].inApp} disabled={r.lockedInApp}
                          onChange={(e) => setPrefs((p) => ({ ...p, [r.key]: { ...p[r.key], inApp: e.target.checked } }))}
                          className="w-4 h-4 rounded accent-brand-600 disabled:opacity-60" />
                      </span>
                      <span className="flex justify-center">
                        <input type="checkbox" checked={prefs[r.key].email}
                          onChange={(e) => setPrefs((p) => ({ ...p, [r.key]: { ...p[r.key], email: e.target.checked } }))}
                          className="w-4 h-4 rounded accent-brand-600" />
                      </span>
                      <span className="flex justify-center text-[10px] font-semibold text-slate-400">Soon</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">Unsigned note escalation always alerts you in-app — it&apos;s what keeps a note from going stale unnoticed.</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2">
            {stepIdx > 0 && (
              <button onClick={() => { setNotice(null); setStepIdx(stepIdx - 1); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {STEP_META[step].skippable && (
              <button onClick={next} className="px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
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

const fieldCls = "w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
function I({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={fieldCls} />;
}

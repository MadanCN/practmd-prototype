"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import Toggle from "@/components/ui/Toggle";
import { PROVIDERS } from "@/data/providers";
import { DIAGNOSIS_CODES, PROCEDURE_CODES } from "@/lib/encounter-store";
import { VISIT_TYPES } from "@/lib/visit-types";
import {
  User, BellRing, CalendarCog, ClipboardList, Receipt, ShieldCheck, Palette,
  Monitor, Smartphone, LogOut, Check, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resetProviderOnboarding } from "@/lib/provider-onboarding";

const CURRENT_PROVIDER_ID = "p1";

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "scheduling", label: "Scheduling", icon: CalendarCog },
  { id: "documentation", label: "Documentation", icon: ClipboardList },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;
type TabId = (typeof TABS)[number]["id"];

const fieldCls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">{children}</div>;
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ChipInput({ label, value, onChange, options }: { label: string; value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const [pick, setPick] = useState("");
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.length === 0 && <span className="text-xs text-slate-400">None selected</span>}
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">
            {v}
            <button onClick={() => onChange(value.filter((x) => x !== v))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={cn(fieldCls, "flex-1")}>
          <option value="">Add…</option>
          {options.filter((o) => !value.includes(o)).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={() => { if (pick) { onChange([...value, pick]); setPick(""); } }} className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Add</button>
      </div>
    </Field>
  );
}

const SESSIONS = [
  { id: "s1", device: "Chrome on Windows", location: "Rochester, NY", icon: Monitor, current: true },
  { id: "s2", device: "PractMD Mobile — iPhone", location: "Rochester, NY", icon: Smartphone, current: false },
];

export default function ProviderSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const provider = PROVIDERS.find((p) => p.id === CURRENT_PROVIDER_ID)!;
  const [tab, setTab] = useState<TabId>("account");
  const [saved, setSaved] = useState(false);

  // account
  const [firstName, setFirstName] = useState(provider.firstName);
  const [lastName, setLastName] = useState(provider.lastName);
  const [email, setEmail] = useState(provider.email);
  const [phone, setPhone] = useState(provider.phone);
  const [credentials, setCredentials] = useState(provider.credentials);
  const [displayName, setDisplayName] = useState(provider.displayName);
  const [timezone, setTimezone] = useState("America/New_York");

  // notifications
  const [notif, setNotif] = useState({
    apptBooked: true, apptCancelled: true, checkedIn: true, messages: true,
    unsignedReminders: true, tasks: true, labs: true, refills: false,
  });
  const [reminderCadence, setReminderCadence] = useState("daily");
  const [channel, setChannel] = useState({ email: true, sms: true, desktop: false });

  // scheduling
  const [defaultDuration, setDefaultDuration] = useState("30");
  const [buffer, setBuffer] = useState("0");
  const [checkInWindow, setCheckInWindow] = useState("30");
  const [defaultVisitType, setDefaultVisitType] = useState("Follow-Up");
  const [doubleBook, setDoubleBook] = useState(false);
  const [autoTelehealthLink, setAutoTelehealthLink] = useState(true);
  const [defaultView, setDefaultView] = useState("today");
  const [weekStart, setWeekStart] = useState("monday");

  // documentation
  const [defaultTemplate, setDefaultTemplate] = useState("SOAP");
  const [autopopulate, setAutopopulate] = useState(true);
  const [requireDx, setRequireDx] = useState(true);
  const [cosignDefault, setCosignDefault] = useState(false);
  const [defaultCosigner, setDefaultCosigner] = useState(PROVIDERS.find((p) => p.id !== "p1")?.displayName ?? "");
  const [favDx, setFavDx] = useState<string[]>(["F41.1 — Generalized Anxiety Disorder", "F33.1 — MDD, recurrent, moderate"]);
  const [favCpt, setFavCpt] = useState<string[]>(["99214 — E&M — Established, Moderate complexity"]);

  // billing
  const [defaultPos, setDefaultPos] = useState("11");
  const [renderingProvider, setRenderingProvider] = useState(provider.displayName);
  const [chargeReview, setChargeReview] = useState(true);

  // security
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessions, setSessions] = useState(SESSIONS);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // appearance
  const [density, setDensity] = useState("comfortable");

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <ProviderLayout>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Account, notifications, scheduling, documentation, billing and security</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* tab rail */}
          <div className="w-48 shrink-0 hidden sm:block" data-tour="settings-rail">
            <div className="space-y-0.5 sticky top-4">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      tab === t.id ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                    <Icon className="w-4 h-4 shrink-0" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-5" data-tour="settings-panel">
            {/* mobile tab select */}
            <select value={tab} onChange={(e) => setTab(e.target.value as TabId)} className={cn(fieldCls, "sm:hidden")}>
              {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            {tab === "account" && (
              <Panel>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldCls} /></Field>
                  <Field label="Last name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldCls} /></Field>
                </div>
                <Field label="Display name"><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={fieldCls} /></Field>
                <Field label="Credentials"><input value={credentials} onChange={(e) => setCredentials(e.target.value)} className={fieldCls} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} /></Field>
                  <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} /></Field>
                </div>
                <Field label="Timezone">
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={fieldCls}>
                    <option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4 opacity-70">
                  <Field label="NPI (read-only)"><input value={provider.npi} disabled className={cn(fieldCls, "cursor-not-allowed")} /></Field>
                  <Field label="License (read-only)"><input value={`${provider.licenseNumber} · ${provider.licenseState}`} disabled className={cn(fieldCls, "cursor-not-allowed")} /></Field>
                </div>
              </Panel>
            )}

            {tab === "notifications" && (
              <>
                <Panel>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 -mb-1">What to notify me about</p>
                  <ToggleRow label="New appointment booked" desc="A patient or coordinator schedules a visit with you" checked={notif.apptBooked} onChange={(v) => setNotif({ ...notif, apptBooked: v })} />
                  <ToggleRow label="Appointment cancelled / rescheduled" desc="Changes to visits already on your calendar" checked={notif.apptCancelled} onChange={(v) => setNotif({ ...notif, apptCancelled: v })} />
                  <ToggleRow label="Patient checked in" desc="A patient arrives and enters your waiting room" checked={notif.checkedIn} onChange={(v) => setNotif({ ...notif, checkedIn: v })} />
                  <ToggleRow label="Patient messages" desc="New secure messages from patients" checked={notif.messages} onChange={(v) => setNotif({ ...notif, messages: v })} />
                  <ToggleRow label="Unsigned note reminders" desc="Nudge me about encounter notes awaiting signature" checked={notif.unsignedReminders} onChange={(v) => setNotif({ ...notif, unsignedReminders: v })} />
                  <ToggleRow label="Task assignments" desc="Chart reviews, prior auths and callbacks assigned to me" checked={notif.tasks} onChange={(v) => setNotif({ ...notif, tasks: v })} />
                  <ToggleRow label="Lab results" desc="New results posted for my patients" checked={notif.labs} onChange={(v) => setNotif({ ...notif, labs: v })} />
                  <ToggleRow label="Refill requests" desc="Pharmacy refill requests routed to me" checked={notif.refills} onChange={(v) => setNotif({ ...notif, refills: v })} />
                </Panel>
                <Panel>
                  <Field label="Unsigned-note reminder cadence">
                    <select value={reminderCadence} onChange={(e) => setReminderCadence(e.target.value)} className={fieldCls}>
                      <option value="off">Off</option><option value="daily">Daily digest</option><option value="twice-daily">Twice daily</option><option value="realtime">As they occur</option>
                    </select>
                  </Field>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Delivery channels</p>
                    <div className="flex flex-wrap gap-3">
                      {([["email", "Email"], ["sms", "SMS"], ["desktop", "Desktop"]] as const).map(([k, l]) => (
                        <label key={k} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input type="checkbox" checked={channel[k]} onChange={(e) => setChannel({ ...channel, [k]: e.target.checked })} className="accent-brand-600 w-4 h-4" /> {l}
                        </label>
                      ))}
                    </div>
                  </div>
                </Panel>
              </>
            )}

            {tab === "scheduling" && (
              <Panel>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default appointment length">
                    <select value={defaultDuration} onChange={(e) => setDefaultDuration(e.target.value)} className={fieldCls}>
                      {["15", "20", "30", "45", "60"].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </Field>
                  <Field label="Buffer between visits">
                    <select value={buffer} onChange={(e) => setBuffer(e.target.value)} className={fieldCls}>
                      {["0", "5", "10", "15"].map((d) => <option key={d} value={d}>{d === "0" ? "None" : `${d} min`}</option>)}
                    </select>
                  </Field>
                  <Field label="Check-in window (before start)">
                    <select value={checkInWindow} onChange={(e) => setCheckInWindow(e.target.value)} className={fieldCls}>
                      {["15", "30", "45", "60"].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </Field>
                  <Field label="Default visit type">
                    <select value={defaultVisitType} onChange={(e) => setDefaultVisitType(e.target.value)} className={fieldCls}>
                      {VISIT_TYPES.map((v) => <option key={v.id} value={v.label}>{v.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Default calendar landing">
                    <select value={defaultView} onChange={(e) => setDefaultView(e.target.value)} className={fieldCls}>
                      <option value="today">Today</option><option value="calendar">Calendar</option><option value="list">Appointment list</option><option value="waiting-room">Waiting room</option>
                    </select>
                  </Field>
                  <Field label="Week starts on">
                    <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={fieldCls}>
                      <option value="monday">Monday</option><option value="sunday">Sunday</option>
                    </select>
                  </Field>
                </div>
                <div className="pt-1">
                  <ToggleRow label="Allow double-booking" desc="Permit overlapping appointments in the same slot" checked={doubleBook} onChange={setDoubleBook} />
                  <ToggleRow label="Auto-generate telehealth link" desc="Create a video room automatically for telehealth visits" checked={autoTelehealthLink} onChange={setAutoTelehealthLink} />
                </div>
              </Panel>
            )}

            {tab === "documentation" && (
              <>
                <Panel>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Default note template">
                      <select value={defaultTemplate} onChange={(e) => setDefaultTemplate(e.target.value)} className={fieldCls}>
                        {["SOAP", "BIRP", "DAP", "Narrative"].map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Default co-signer">
                      <select value={defaultCosigner} onChange={(e) => setDefaultCosigner(e.target.value)} className={fieldCls}>
                        {PROVIDERS.filter((p) => p.id !== "p1").map((p) => <option key={p.id}>{p.displayName}</option>)}
                      </select>
                    </Field>
                  </div>
                  <ToggleRow label="Auto-populate from last visit" desc="Pre-fill new notes with the prior encounter's content" checked={autopopulate} onChange={setAutopopulate} />
                  <ToggleRow label="Require a diagnosis before signing" desc="Block signing until at least one ICD-10 code is attached" checked={requireDx} onChange={setRequireDx} />
                  <ToggleRow label="Request co-signature by default" desc="Route every signed note to my default co-signer" checked={cosignDefault} onChange={setCosignDefault} />
                </Panel>
                <Panel>
                  <ChipInput label="Favorite diagnoses" value={favDx} onChange={setFavDx} options={DIAGNOSIS_CODES.map((d) => `${d.code} — ${d.label}`)} />
                  <ChipInput label="Favorite procedure codes" value={favCpt} onChange={setFavCpt} options={PROCEDURE_CODES.map((c) => `${c.code} — ${c.label}`)} />
                </Panel>
              </>
            )}

            {tab === "billing" && (
              <Panel>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default place of service">
                    <select value={defaultPos} onChange={(e) => setDefaultPos(e.target.value)} className={fieldCls}>
                      <option value="11">11 — Office</option><option value="10">10 — Telehealth (patient home)</option><option value="02">02 — Telehealth (other)</option><option value="19">19 — Off-campus outpatient</option>
                    </select>
                  </Field>
                  <Field label="Rendering provider">
                    <select value={renderingProvider} onChange={(e) => setRenderingProvider(e.target.value)} className={fieldCls}>
                      {PROVIDERS.map((p) => <option key={p.id}>{p.displayName}</option>)}
                    </select>
                  </Field>
                </div>
                <ToggleRow label="Review charges before submission" desc="Hold charges in the 'Ready' queue until I approve them" checked={chargeReview} onChange={setChargeReview} />
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  Fee schedule is managed by Revenue Management. Signed notes create charges automatically — track them under Revenue Management → Charges.
                </div>
              </Panel>
            )}

            {tab === "security" && (
              <>
                <Panel>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Change password</p>
                  <Field label="Current password"><input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={fieldCls} /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="New password"><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={fieldCls} /></Field>
                    <Field label="Confirm new password"><input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={fieldCls} /></Field>
                  </div>
                </Panel>
                <Panel>
                  <ToggleRow label="Two-factor authentication" desc="Require a verification code in addition to your password" checked={twoFactor} onChange={setTwoFactor} />
                </Panel>
                <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Replay account activation</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Demo only — clears the local activation flag and reopens the invitation &amp; MFA flow.</p>
                  </div>
                  <button onClick={() => { resetProviderOnboarding(); router.push("/provider/welcome"); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" /> Replay
                  </button>
                </div>
                <Panel>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active sessions</p>
                  {sessions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.id} className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.device} {s.current && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">This device</span>}</p>
                          <p className="text-xs text-slate-400">{s.location}</p>
                        </div>
                        {!s.current && (
                          <button onClick={() => setSessions((p) => p.filter((x) => x.id !== s.id))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30">
                            <LogOut className="w-3.5 h-3.5" /> Sign out
                          </button>
                        )}
                      </div>
                    );
                  })}
                </Panel>
              </>
            )}

            {tab === "appearance" && (
              <Panel>
                <Field label="Theme">
                  <div className="flex gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button key={t} onClick={() => setTheme(t)}
                        className={cn("px-3.5 py-2 rounded-lg text-sm font-medium capitalize border transition-colors",
                          theme === t ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Density">
                  <select value={density} onChange={(e) => setDensity(e.target.value)} className={fieldCls}>
                    <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
                  </select>
                </Field>
              </Panel>
            )}

            <div className="flex items-center gap-3">
              <button onClick={handleSave} data-tour="settings-save" className="px-5 py-2.5 rounded-lg practmd-gradient text-white text-sm font-semibold">Save changes</button>
              {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><Check className="w-4 h-4" /> Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}

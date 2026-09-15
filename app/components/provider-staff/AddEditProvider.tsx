"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Upload, AlertCircle, Send } from "lucide-react";
import {
  PROVIDER_TYPES, SPECIALIZATIONS_LIST, VISIT_TYPES_LIST, SERVICES_LIST,
  PERMISSION_ROLES, PROVIDER_COLORS, PROVIDERS, type WorkingHour,
} from "@/data/providers";
import { CLINICS, DAYS } from "@/data/clinics";
import {
  providerTypeKey, defaultCapabilities, CAPABILITY_KEYS, CAPABILITY_META,
  type ProviderCapabilities,
} from "@/data/provider-credentialing";
import Toggle from "@/components/ui/Toggle";
import WorkingHoursEditor from "@/components/ui/WorkingHoursEditor";
import { cn } from "@/lib/utils";

const US_STATES = ["New York", "New Jersey", "Connecticut", "Pennsylvania", "Massachusetts", "Florida", "California", "Texas"];

type TabId = "overview" | "professional" | "access" | "bio";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "professional", label: "Professional" },
  { id: "access", label: "Access & Services" },
  { id: "bio", label: "Bio & Profile" },
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];
const LANGUAGES_LIST = ["English", "Spanish", "French", "Mandarin", "Hindi", "Arabic", "Portuguese", "Vietnamese"];

function defaultWorkingHours(clinicId: string): WorkingHour[] {
  const loc = clinicId || CLINICS.find((c) => c.isActive)?.id || "";
  return DAYS.map((day) => ({
    day,
    isWorking: day !== "Saturday" && day !== "Sunday",
    segments: day !== "Saturday" && day !== "Sunday" && loc ? [{ clinicId: loc, startTime: "09:00", endTime: "17:00" }] : [],
  }));
}

interface FormState {
  firstName: string; lastName: string; gender: string; email: string; dob: string; phone: string;
  color: string; street: string; city: string; state: string; zip: string;
  providerType: string; npi: string; licenseNumber: string; licenseState: string;
  specializations: string[]; clinicAccess: string[];
  workingHours: WorkingHour[];
  visitTypes: string[]; services: string[]; permissionRole: string; telehealthEnabled: boolean;
  displayName: string; credentials: string; bio: string; languages: string[];
  pronouns: string; licensedStates: string[];
  capabilities: ProviderCapabilities; capabilityOverrides: (keyof ProviderCapabilities)[];
}

const INITIAL: FormState = {
  firstName: "", lastName: "", gender: "", email: "", dob: "", phone: "", color: "", street: "", city: "", state: "", zip: "",
  providerType: "", npi: "", licenseNumber: "", licenseState: "", specializations: [], clinicAccess: [],
  workingHours: defaultWorkingHours(""),
  visitTypes: [], services: [], permissionRole: "", telehealthEnabled: false,
  displayName: "", credentials: "", bio: "", languages: [],
  pronouns: "", licensedStates: [],
  capabilities: defaultCapabilities("therapist"), capabilityOverrides: [],
};

const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

interface Props { providerId?: string }

export default function AddEditProviderScreen({ providerId }: Props) {
  const router = useRouter();
  const existing = providerId ? PROVIDERS.find(p => p.id === providerId) : undefined;
  const isEdit = !!existing;

  const [form, setForm] = useState<FormState>(existing ? {
    firstName: existing.firstName, lastName: existing.lastName, gender: existing.gender, email: existing.email,
    dob: existing.dob, phone: existing.phone, color: existing.color, street: existing.street,
    city: existing.city, state: existing.state, zip: existing.zip, providerType: existing.providerType,
    npi: existing.npi, licenseNumber: existing.licenseNumber, licenseState: existing.licenseState,
    specializations: existing.specializations, clinicAccess: existing.clinicAccess,
    workingHours: existing.workingHours,
    visitTypes: existing.visitTypes, services: existing.services,
    permissionRole: existing.permissionRole, telehealthEnabled: existing.telehealthEnabled,
    displayName: existing.displayName, credentials: existing.credentials, bio: existing.bio, languages: existing.languages,
    pronouns: "", licensedStates: [existing.licenseState].filter(Boolean),
    capabilities: defaultCapabilities(existing.providerType.toLowerCase().includes("psychiatr") ? "md-do" : "therapist"),
    capabilityOverrides: [],
  } : INITIAL);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [invited, setInvited] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    if (key === "firstName" || key === "lastName") {
      const fn = key === "firstName" ? value as string : form.firstName;
      const ln = key === "lastName" ? value as string : form.lastName;
      setForm(f => ({ ...f, [key]: value, displayName: [fn, ln].filter(Boolean).join(" ") }));
    }
    if (key === "providerType") {
      const caps = defaultCapabilities(providerTypeKey(value as string));
      setForm(f => ({ ...f, providerType: value as string, capabilities: caps, capabilityOverrides: [] }));
    }
  }

  function toggleCapability(k: keyof ProviderCapabilities) {
    setForm(f => {
      const next = { ...f.capabilities, [k]: !f.capabilities[k] };
      const seeded = defaultCapabilities(providerTypeKey(f.providerType || "therapist"));
      const overrides = CAPABILITY_KEYS.filter(x => next[x] !== seeded[x]);
      return { ...f, capabilities: next, capabilityOverrides: overrides };
    });
  }

  function toggleArr<K extends "specializations" | "clinicAccess" | "visitTypes" | "services" | "languages" | "licensedStates">(key: K, val: string) {
    setForm(f => {
      const next = (f[key] as string[]).includes(val) ? (f[key] as string[]).filter(x => x !== val) : [...(f[key] as string[]), val];
      if (key !== "clinicAccess") return { ...f, [key]: next };
      // Dropping a location a provider no longer has access to: reassign any
      // working-hours segment pointing at it to the new first location, or
      // clear the day entirely if no location is left.
      const fallback = next[0] ?? "";
      const workingHours = f.workingHours.map(h => {
        const segments = h.segments
          .map(s => (next.includes(s.clinicId) ? s : fallback ? { ...s, clinicId: fallback } : null))
          .filter((s): s is NonNullable<typeof s> => s !== null);
        return { ...h, segments, isWorking: h.isWorking && segments.length > 0 };
      });
      return { ...f, clinicAccess: next, workingHours };
    });
  }

  function tabDot(tab: TabId) {
    const required = tab === "overview" ? !!(form.firstName && form.lastName && form.email && form.phone && form.credentials && form.providerType)
      : tab === "professional" ? !!(form.clinicAccess.length > 0) : null;
    if (required === null) return null;
    return required ? "bg-emerald-500" : "bg-rose-500";
  }

  const missingFields: string[] = [];
  if (!form.firstName) missingFields.push("Legal first name");
  if (!form.lastName) missingFields.push("Legal last name");
  if (!form.email) missingFields.push("Work email");
  if (!form.phone) missingFields.push("Mobile");
  if (!form.credentials) missingFields.push("Credentials suffix");
  if (!form.providerType) missingFields.push("Provider type");
  if (!form.clinicAccess.length) missingFields.push("Clinic access");
  if (form.telehealthEnabled && form.licensedStates.length === 0) missingFields.push("Licensed states");

  const providerColor = PROVIDER_COLORS.find(c => c.value === form.color);
  const avatarInitials = `${form.firstName[0] ?? "?"}${form.lastName[0] ?? ""}`.toUpperCase();
  const displayName = form.displayName || (form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : null);

  return (
    <div className="flex flex-col min-h-full -mt-1">

      {/* ── Sticky horizontal profile summary bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 py-3 mb-6 -mx-6 px-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: form.color || "#94a3b8" }}>
            {avatarInitials}
          </div>

          {/* Name + type */}
          <div className="flex-shrink-0 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[180px]">
              {displayName ?? <span className="text-slate-400 italic font-normal text-sm">No name yet</span>}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Active</span>
              {form.providerType && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{form.providerType}</span>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

          {/* Key info pills */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {form.email && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[200px]">
                {form.email}
              </span>
            )}
            {form.phone && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                {form.phone}
              </span>
            )}
            {form.clinicAccess.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 text-xs font-medium">
                {form.clinicAccess.length} clinic{form.clinicAccess.length !== 1 ? "s" : ""}
              </span>
            )}
            {form.credentials && (
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900 text-xs font-medium">
                {form.credentials}
              </span>
            )}
          </div>

          {/* Missing fields warning */}
          {missingFields.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Missing: </span>{missingFields.join(", ")}
            </div>
          )}

          {/* Invite — available as soon as Tab 1 (identity) validates */}
          {!isEdit && (
            <button
              disabled={!(form.firstName && form.lastName && form.email && form.phone && form.credentials && form.providerType)}
              onClick={() => setInvited(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-sm font-semibold hover:bg-brand-50 dark:hover:bg-brand-950/30 disabled:opacity-40 flex-shrink-0 transition-colors">
              <Send className="w-4 h-4" /> {invited ? "Invitation sent" : "Send Invitation"}
            </button>
          )}

          {/* Save button */}
          <button
            disabled={missingFields.length > 0}
            onClick={() => router.push("/provider-staff")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 flex-shrink-0 transition-colors">
            <CheckCircle2 className="w-4 h-4" />
            {isEdit ? "Save Changes" : "Add Provider"}
          </button>
        </div>
        {invited && (
          <p className="mt-2 text-xs text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Practice-branded invitation sent to {form.email}. Single-use link, expires in 7 days. Record status: Invited.
          </p>
        )}
      </div>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? "Edit Provider" : "Add New Provider"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Update provider information" : "Fill in the provider details to add them to your clinic"}
          </p>
        </div>
        <button onClick={() => router.push("/provider-staff")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
      </div>

      {/* ── Tab stepper ── */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 mb-6">
        {TABS.map(tab => {
          const dot = tabDot(tab.id);
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
              {tab.label}
              {dot && <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dot)} />}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="space-y-5">

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>First Name <span className="text-rose-500">*</span></label>
                <input className={INPUT} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Enter first name" />
              </div>
              <div>
                <label className={LABEL}>Last Name <span className="text-rose-500">*</span></label>
                <input className={INPUT} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Enter last name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Gender</label>
                <select className={INPUT} value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Date of Birth</label>
                <input type="date" className={INPUT} value={form.dob} onChange={e => set("dob", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Email <span className="text-rose-500">*</span></label>
              <input type="email" className={INPUT} value={form.email} onChange={e => set("email", e.target.value)} placeholder="provider@clinic.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Mobile number</label>
                <input className={INPUT} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (234) 567-8900" />
              </div>
              <div>
                <label className={LABEL}>Pronouns</label>
                <select className={INPUT} value={form.pronouns} onChange={e => set("pronouns", e.target.value)}>
                  <option value="">Select</option>
                  {["She / Her", "He / Him", "They / Them", "Prefer not to say"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Credentials suffix <span className="text-rose-500">*</span></label>
              <input className={INPUT} value={form.credentials} onChange={e => set("credentials", e.target.value)} placeholder="e.g. MD, PsyD, LCSW, PMHNP-BC" />
            </div>
            <div>
              <label className={LABEL}>Provider type <span className="text-rose-500">*</span></label>
              <select className={INPUT} value={form.providerType} onChange={e => set("providerType", e.target.value)}>
                <option value="">Select — drives every capability default</option>
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Provider Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PROVIDER_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => set("color", c.value)} title={c.label}
                    className={cn("w-8 h-8 rounded-full border-2 transition-all", form.color === c.value ? "border-slate-900 dark:border-white scale-110" : "border-transparent hover:scale-105")}
                    style={{ backgroundColor: c.value }} />
                ))}
                {form.color && <span className="text-sm text-slate-500 dark:text-slate-400">{providerColor?.label}</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">Address</h3>
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Street</label>
                  <input className={INPUT} value={form.street} onChange={e => set("street", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>City</label>
                    <input className={INPUT} value={form.city} onChange={e => set("city", e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>State</label>
                    <input className={INPUT} value={form.state} onChange={e => set("state", e.target.value)} />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className={LABEL}>Zip Code</label>
                  <input className={INPUT} value={form.zip} onChange={e => set("zip", e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "professional" && (
          <>
            <div>
              <label className={LABEL}>Provider Type <span className="text-rose-500">*</span></label>
              <select className={INPUT} value={form.providerType} onChange={e => set("providerType", e.target.value)}>
                <option value="">Select provider type</option>
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>NPI Number</label>
              <input className={INPUT} value={form.npi} onChange={e => set("npi", e.target.value)} placeholder="10-digit NPI" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>License Number</label>
                <input className={INPUT} value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>License State</label>
                <input className={INPUT} value={form.licenseState} onChange={e => set("licenseState", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Specializations</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleArr("specializations", s)}
                    className={cn("px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                      form.specializations.includes(s) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Clinic Access <span className="text-rose-500">*</span></label>
              <div className="space-y-2">
                {CLINICS.filter(c => c.isActive).map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4"
                      checked={form.clinicAccess.includes(c.id)} onChange={() => toggleArr("clinicAccess", c.id)} />
                    <span className="text-xl">{c.logoEmoji}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.city}, {c.state}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 border-t border-slate-100 dark:border-slate-800 pt-4">Working Hours</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Provider-specific schedule. Each day can be split across locations — e.g. one site in the morning, another in the afternoon.</p>
              {form.clinicAccess.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">Select Clinic Access above first — working hours are set per location.</p>
              ) : (
                <WorkingHoursEditor hours={form.workingHours} onChange={wh => set("workingHours", wh)}
                  locations={CLINICS.filter(c => form.clinicAccess.includes(c.id)).map(c => ({ id: c.id, name: c.name }))} />
              )}
            </div>
          </>
        )}

        {activeTab === "access" && (
          <>
            <div>
              <label className={LABEL}>Visit Types</label>
              <div className="grid grid-cols-2 gap-2">
                {VISIT_TYPES_LIST.map(vt => (
                  <label key={vt} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4"
                      checked={form.visitTypes.includes(vt)} onChange={() => toggleArr("visitTypes", vt)} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{vt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Services</label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES_LIST.map(s => (
                  <label key={s} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4"
                      checked={form.services.includes(s)} onChange={() => toggleArr("services", s)} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Permission Role</label>
              <select className={INPUT} value={form.permissionRole} onChange={e => set("permissionRole", e.target.value)}>
                <option value="">Select role</option>
                {PERMISSION_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Telehealth Enabled</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Whether they can be booked for video. Depends on telehealth licences purchased.</p>
              </div>
              <Toggle checked={form.telehealthEnabled} onChange={v => set("telehealthEnabled", v)} />
            </div>

            {form.telehealthEnabled && (
              <div>
                <label className={LABEL}>Licensed states <span className="text-rose-500">*</span></label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">A hard gate — a video visit can&apos;t be delivered to a patient physically located in a state the provider isn&apos;t licensed in.</p>
                <div className="flex flex-wrap gap-2">
                  {US_STATES.map(s => (
                    <button key={s} type="button" onClick={() => toggleArr("licensedStates", s)}
                      className={cn("px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                        form.licensedStates.includes(s) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 pt-3">Capabilities</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Pre-filled from the provider-type{form.providerType ? ` (${form.providerType})` : ""}. Each is individually overridable.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {CAPABILITY_KEYS.map(k => (
                  <label key={k} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type="checkbox" className="accent-blue-600 w-4 h-4 mt-0.5"
                      checked={form.capabilities[k]} onChange={() => toggleCapability(k)} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{CAPABILITY_META[k].label}</span>
                        {CAPABILITY_META[k].soon && <span className="text-[9px] font-bold text-slate-400">SOON</span>}
                        {form.capabilityOverrides.includes(k) && <span className="text-[9px] font-bold text-amber-500 uppercase">override</span>}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono">{k}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "bio" && (
          <>
            <div>
              <label className={LABEL}>Profile Photo</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer">
                <Upload className="w-8 h-8" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload or drag & drop</p>
                <p className="text-xs">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <div>
              <label className={LABEL}>Display Name</label>
              <input className={INPUT} value={form.displayName} onChange={e => set("displayName", e.target.value)} placeholder="Dr. First Last" />
            </div>
            <div>
              <label className={LABEL}>Credentials</label>
              <input className={INPUT} value={form.credentials} onChange={e => set("credentials", e.target.value)} placeholder="e.g. MD, PhD, LCSW" />
            </div>
            <div>
              <label className={LABEL}>Bio</label>
              <textarea rows={4} className={INPUT + " resize-none"} value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Brief professional biography..." />
            </div>
            <div>
              <label className={LABEL}>Languages Spoken</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES_LIST.map(l => (
                  <button key={l} type="button" onClick={() => toggleArr("languages", l)}
                    className={cn("px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                      form.languages.includes(l) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer nav ── */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
        <button disabled={activeTab === "overview"} onClick={() => {
          const idx = TABS.findIndex(t => t.id === activeTab);
          if (idx > 0) setActiveTab(TABS[idx - 1].id);
        }} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
          ← Previous
        </button>
        {activeTab !== "bio" ? (
          <button onClick={() => {
            const idx = TABS.findIndex(t => t.id === activeTab);
            if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
          }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button disabled={missingFields.length > 0} onClick={() => router.push("/provider-staff")}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" /> {isEdit ? "Save Changes" : "Add Provider"}
          </button>
        )}
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Globe, CheckCircle2, Clock, Circle, Send } from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import {
  buildClinicalProfile, credentialStatus, CAPABILITY_KEYS, CAPABILITY_META,
  STATUS_META, PROVIDER_TYPE_LABEL,
} from "@/data/provider-credentialing";
import { WorkingHoursReadOnly } from "@/components/ui/WorkingHoursEditor";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "working-hours", label: "Working Hours" },
  { id: "access", label: "Access & Services" },
  { id: "credentialing", label: "Credentialing & Readiness" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || <span className="text-slate-400 italic font-normal">Not specified</span>}</p>
    </div>
  );
}

function Chip({ label, color = "default" }: { label: string; color?: "blue" | "emerald" | "violet" | "default" }) {
  const cls = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900",
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
    violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-900",
    default: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  };
  return <span className={cn("px-2.5 py-1 rounded-lg border text-xs font-medium", cls[color])}>{label}</span>;
}

export default function ProviderDetailScreen({ id }: { id: string }) {
  const provider = PROVIDERS.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [invited, setInvited] = useState(false);
  const clinical = provider ? buildClinicalProfile(id) : null;

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-3">Provider not found</p>
        <Link href="/provider-staff" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Providers
        </Link>
      </div>
    );
  }

  const clinicNames = provider.clinicAccess.map(id => CLINICS.find(c => c.id === id)?.name ?? id);

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span>/</span>
        <Link href="/provider-staff" className="hover:text-slate-600">Provider & Staff</Link>
        <span>/</span>
        <span className="text-slate-500">{provider.displayName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ backgroundColor: provider.color || "#94a3b8" }}>
            {provider.firstName[0]}{provider.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{provider.displayName}</h1>
              {clinical && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {STATUS_META[clinical.clinicalStatus].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span>{provider.providerType}</span>
              {provider.credentials && <span className="font-medium text-slate-600 dark:text-slate-300">{provider.credentials}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/provider-staff" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Link>
          {clinical && ["invited", "account-setup"].includes(clinical.clinicalStatus) && (
            <button onClick={() => setInvited(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-950/30">
              <Send className="w-4 h-4" /> {invited ? "Invitation resent" : "Resend invitation"}
            </button>
          )}
          <Link href={`/provider-staff/${id}?edit=true`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {invited && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 px-3 py-2 text-xs text-brand-700 dark:text-brand-400">
          <CheckCircle2 className="w-4 h-4" /> A practice-branded invitation was sent to {provider.email}. The single-use link expires in 7 days; the previous link is now invalid.
        </div>
      )}

      {/* Quick info bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-6 flex-wrap text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 flex-shrink-0" />{provider.email}</span>
          {provider.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 flex-shrink-0" />{provider.phone}</span>}
          {provider.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 flex-shrink-0" />{provider.city}, {provider.state}</span>}
          <span className="flex items-center gap-1.5">
            {provider.telehealthEnabled
              ? <><Globe className="w-4 h-4 text-blue-500" /><span className="text-blue-600 dark:text-blue-400 font-medium">Telehealth Enabled</span></>
              : <><Globe className="w-4 h-4" />Telehealth Disabled</>}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === t.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 space-y-8">
        {activeTab === "overview" && (
          <>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <Field label="First Name" value={provider.firstName} />
                <Field label="Last Name" value={provider.lastName} />
                <Field label="Gender" value={provider.gender} />
                <Field label="Date of Birth" value={provider.dob} />
                <Field label="Email" value={provider.email} />
                <Field label="Phone" value={provider.phone} />
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Address</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {[provider.street, provider.city, provider.state, provider.zip].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Professional Details</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <Field label="Provider Type" value={provider.providerType} />
                <Field label="NPI Number" value={provider.npi} />
                <Field label="License Number" value={provider.licenseNumber} />
                <Field label="License State" value={provider.licenseState} />
                <Field label="Credentials" value={provider.credentials} />
                <Field label="Permission Role" value={provider.permissionRole} />
              </div>
            </div>
            {provider.specializations.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.specializations.map(s => <Chip key={s} label={s} color="violet" />)}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Clinic Access</h2>
              <div className="space-y-2">
                {clinicNames.map((name, i) => {
                  const c = CLINICS.find(cl => cl.id === provider.clinicAccess[i]);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xl">{c?.logoEmoji ?? "🏥"}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p>
                        {c && <p className="text-xs text-slate-500 dark:text-slate-400">{c.city}, {c.state}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {provider.bio && (
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Bio</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{provider.bio}</p>
              </div>
            )}
            {provider.languages.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map(l => <Chip key={l} label={l} color="blue" />)}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "working-hours" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Working Hours</h2>
              <Link href={`/provider-staff/${id}?edit=true&tab=professional`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Pencil className="w-3.5 h-3.5" /> Edit Schedule
              </Link>
            </div>
            <WorkingHoursReadOnly hours={provider.workingHours} locations={CLINICS.flatMap((c) => c.locations)} />
          </div>
        )}

        {activeTab === "credentialing" && <CredentialingTab providerId={id} />}

        {activeTab === "access" && (
          <div className="space-y-6">
            {provider.visitTypes.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Visit Types</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.visitTypes.map(vt => <Chip key={vt} label={vt} color="emerald" />)}
                </div>
              </div>
            )}
            {provider.services.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map(s => <Chip key={s} label={s} />)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-8">
              <Field label="Permission Role" value={provider.permissionRole} />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Telehealth</p>
                <span className={cn("px-2.5 py-1 rounded-full text-sm font-medium", provider.telehealthEnabled ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                  {provider.telehealthEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Credentialing & readiness (PRD 'The provider record', 'Milestone gates') ── */

function CredentialingTab({ providerId }: { providerId: string }) {
  const p = buildClinicalProfile(providerId);
  const npiOk = /^\d{10}$/.test(p.npi);
  const anyExpired = p.credentials.some((c) => credentialStatus(c) === "expired");
  const enrolled = p.payerEnrolment.filter((e) => e.status === "enrolled").length;

  const milestones = [
    { label: "Invitation accepted & profile confirmed", done: !["invited", "account-setup"].includes(p.clinicalStatus), blocks: "login" },
    { label: "Licence verification", done: !anyExpired && ["clinically-active", "active-limited", "offboarding"].includes(p.clinicalStatus), blocks: "being booked" },
    { label: "NPI + taxonomy on file", done: npiOk, blocks: "billing" },
    { label: "Visit types & telehealth licensure set", done: !!p.licensedStates.length, blocks: "being bookable" },
    { label: `Payer enrolment (${enrolled}/${p.payerEnrolment.length})`, done: enrolled === p.payerEnrolment.length, blocks: "nothing — enrolment is the long pole" },
  ];

  return (
    <div className="space-y-8">
      {/* status + readiness */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Readiness</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {STATUS_META[p.clinicalStatus].label} · {PROVIDER_TYPE_LABEL[p.providerType]}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {milestones.map((m) => (
            <div key={m.label} className="flex items-center gap-3 px-4 py-3">
              {m.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{m.label}</span>
              {!m.done && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">blocks {m.blocks}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* capabilities */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Capabilities</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {CAPABILITY_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              {p.capabilities[k] ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={cn("font-mono text-xs", p.capabilities[k] ? "text-slate-700 dark:text-slate-300" : "text-slate-400")}>{k}</span>
              {CAPABILITY_META[k].soon && <span className="text-[9px] font-bold text-slate-400">SOON</span>}
              {p.capabilityOverrides.includes(k) && <span className="text-[9px] font-bold text-amber-500 uppercase">overridden</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Defaults are seeded from the provider-type; each is individually overridable by the Clinic Admin.</p>
      </div>

      {/* credentials table */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Credentials</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2.5">Credential</th><th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Issuer</th><th className="px-4 py-2.5">Number</th>
                <th className="px-4 py-2.5">Expiry</th><th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {p.credentials.map((c) => {
                const st = credentialStatus(c);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.type}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.issuingBody}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{c.number}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.expiryDate}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        st === "valid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : st === "expiring" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400")}>{st}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">No credential files are stored — name, number and expiry only. Expiry drives tasks at 60 / 30 / 7 days; an expired licence auto-suspends.</p>
      </div>

      {/* payer enrolment */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Payer enrolment</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {p.payerEnrolment.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm">
              <span className="text-slate-700 dark:text-slate-300">{e.payer} <span className="text-slate-400">· {e.location}</span></span>
              <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                e.status === "enrolled" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : e.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>{e.status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Enrolment takes 60–120 days per payer per location and does not block seeing patients — the booking screen shows out-of-network for pending payers.</p>
      </div>
    </div>
  );
}

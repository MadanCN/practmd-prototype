"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Building2, Stethoscope, Globe } from "lucide-react";
import { PROVIDERS, type Provider } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import { BusinessHoursReadOnly } from "@/components/ui/BusinessHoursGrid";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "working-hours", label: "Working Hours" },
  { id: "access", label: "Access & Services" },
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
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                provider.isActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                {provider.isActive ? "Active" : "Inactive"}
              </span>
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
          <Link href={`/provider-staff/${id}?edit=true`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

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
            <BusinessHoursReadOnly hours={provider.workingHours} />
          </div>
        )}

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

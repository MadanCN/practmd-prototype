"use client";

import { useState } from "react";
import {
  Heart, Save, CheckCircle, Pencil, X, Check, User, Home, Phone,
  AlertCircle, Pill, Activity,
} from "lucide-react";
import { PATIENT_HEALTH_PROFILE } from "@/data/patient-portal";
import { CC_PATIENTS } from "@/data/cc-patients";
import { cn } from "@/lib/utils";

const patient = CC_PATIENTS.find(p => p.id === "pt01")!;
const profile = PATIENT_HEALTH_PROFILE;

const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";
const LABEL = "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

function Section({ title, icon: Icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      </div>
      <div className="px-5 py-4 bg-white dark:bg-slate-900/30">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 flex gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200 flex-1">{value}</span>
    </div>
  );
}

export default function HealthProfilePage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable fields (local state for demo)
  const [address, setAddress] = useState(profile.address);
  const [ec, setEc] = useState(profile.emergencyContact);
  const [locationPref, setLocationPref] = useState(profile.locationPreference);

  function handleSave() {
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Health Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your personal health information on file</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Saved
          </div>
        )}
      </div>

      {/* Demographics */}
      <Section title="Personal Information" icon={User}>
        <InfoRow label="Full Name" value={patient.displayName} />
        <InfoRow label="Date of Birth" value={new Date(patient.dob + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + ` (Age ${new Date().getFullYear() - new Date(patient.dob).getFullYear()})`} />
        <InfoRow label="Gender" value={patient.gender} />
        <InfoRow label="Pronouns" value={profile.pronouns} />
        <InfoRow label="Preferred Language" value={profile.preferredLanguage} />
        <InfoRow label="Marital Status" value={profile.maritalStatus} />
        <InfoRow label="Occupation" value={profile.occupation} />
        <InfoRow label="Race" value={profile.race} />
        <InfoRow label="Ethnicity" value={profile.ethnicity} />
        <InfoRow label="MRN" value={patient.mrn} />
        <InfoRow label="Email" value={patient.email} />
        <InfoRow label="Phone" value={patient.phone} />
      </Section>

      {/* Address */}
      <Section title="Address" icon={Home}>
        {editing === "address" ? (
          <div className="space-y-3">
            <div>
              <label className={LABEL}>Street Address</label>
              <input className={INPUT} value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className={LABEL}>City</label>
                <input className={INPUT} value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>State</label>
                <input className={INPUT} value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} maxLength={2} />
              </div>
              <div>
                <label className={LABEL}>ZIP</label>
                <input className={INPUT} value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-800 dark:text-slate-200">{address.street}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{address.city}, {address.state} {address.zip}</p>
            </div>
            <button onClick={() => setEditing("address")} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </Section>

      {/* Emergency Contact */}
      <Section title="Emergency Contact" icon={Phone}>
        {editing === "ec" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Name</label>
                <input className={INPUT} value={ec.name} onChange={e => setEc(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Relationship</label>
                <input className={INPUT} value={ec.relationship} onChange={e => setEc(c => ({ ...c, relationship: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Phone</label>
                <input className={INPUT} value={ec.phone} onChange={e => setEc(c => ({ ...c, phone: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input className={INPUT} value={ec.email ?? ""} onChange={e => setEc(c => ({ ...c, email: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ec.name}</p>
              <p className="text-xs text-slate-500">{ec.relationship} · {ec.phone}</p>
              {ec.email && <p className="text-xs text-slate-400">{ec.email}</p>}
            </div>
            <button onClick={() => setEditing("ec")} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </Section>

      {/* Vitals */}
      <Section title="Last Recorded Vitals" icon={Activity}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Height", val: profile.height },
            { label: "Weight", val: profile.weight },
            { label: "BMI", val: profile.bmi },
            { label: "Blood Type", val: profile.bloodType },
          ].map(v => (
            <div key={v.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">{v.label}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{v.val}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Care Needs */}
      <Section title="Care & Treatment" icon={Heart}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Primary Diagnoses</p>
            <div className="flex flex-wrap gap-2">
              {profile.primaryDiagnoses.map(d => (
                <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">{d}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Care Needs</p>
            <div className="flex flex-wrap gap-2">
              {profile.careNeeds.map(n => (
                <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{n}</span>
              ))}
            </div>
          </div>
          <InfoRow label="Primary Care" value={profile.primaryCareProvider} />
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-500 w-36 shrink-0">Location Preference</span>
            <div className="flex gap-2">
              {(["in-person", "telehealth", "both"] as const).map(opt => (
                <button key={opt} onClick={() => setLocationPref(opt)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    locationPref === opt
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400")}>
                  {opt === "both" ? "Both" : opt === "in-person" ? "In Person" : "Telehealth"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Lifestyle */}
      <Section title="Lifestyle & Social History" icon={AlertCircle}>
        <InfoRow label="Smoking" value={profile.smokingStatus} />
        <InfoRow label="Alcohol Use" value={profile.alcoholUse} />
        <InfoRow label="Exercise" value={profile.exerciseFrequency} />
      </Section>

      {/* Medications placeholder */}
      <Section title="Current Medications" icon={Pill}>
        <div className="space-y-3">
          {[
            { name: "Sertraline", dose: "50 mg", freq: "Once daily (AM)", prescriber: "Dr. Sarah Mitchell", since: "3 weeks ago" },
            { name: "Lorazepam", dose: "0.5 mg", freq: "As needed (PRN) — anxiety/panic", prescriber: "Dr. Sarah Mitchell", since: "6 weeks ago" },
          ].map(med => (
            <div key={med.name} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
              <Pill className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{med.name} <span className="font-normal text-slate-500">{med.dose}</span></p>
                <p className="text-xs text-slate-500">{med.freq}</p>
                <p className="text-xs text-slate-400 mt-0.5">Prescribed by {med.prescriber} · {med.since}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

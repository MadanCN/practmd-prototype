"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowUpRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PatientProfile, calcAge, getPatientProfile, getCareCoordinator,
} from "@/data/provider-patients";

const PHR_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  "pending-verification": { label: "Pending Email Verification", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
};

export function OverviewSection({
  profile, editing, onSave, onCancel,
}: {
  profile: PatientProfile;
  editing: boolean;
  onSave: (next: PatientProfile) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PatientProfile>(profile);
  const p = editing ? draft : profile;

  function set<K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function setAddr<K extends keyof PatientProfile["address"]>(key: K, value: string) {
    setDraft((d) => ({ ...d, address: { ...d.address, [key]: value } }));
  }
  function setPref(key: keyof PatientProfile["preferences"], value: boolean) {
    setDraft((d) => ({ ...d, preferences: { ...d.preferences, [key]: value } }));
  }

  const linked = p.linkedPatientId ? getPatientProfile(p.linkedPatientId) : undefined;
  const caregiverLinked = p.caregiver?.linkedPatientId ? getPatientProfile(p.caregiver.linkedPatientId) : undefined;
  const coordinator = getCareCoordinator(p.careCoordinatorId);
  const phr = PHR_STATUS[p.phr.status];

  return (
    <div className="space-y-4">
      {editing && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/70 dark:bg-brand-950/20 px-4 py-2.5">
          <p className="text-sm text-brand-800 dark:text-brand-300">Editing patient overview — changes stay in this session.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDraft(profile); onCancel(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white"
            >
              <Check className="w-3.5 h-3.5" /> Save changes
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Basic information */}
        <Group title="Basic information">
          <Field label="MRN">{p.mrn}</Field>
          <EditRow label="First name" editing={editing} value={p.firstName} onChange={(v) => set("firstName", v)} />
          <EditRow label="Middle name" editing={editing} value={p.middleName ?? ""} onChange={(v) => set("middleName", v)} placeholder="—" />
          <EditRow label="Last name" editing={editing} value={p.lastName} onChange={(v) => set("lastName", v)} />
          <Field label="Date of birth">{p.dob} · {calcAge(p.dob)} yrs</Field>
          <Field label="Gender">{p.gender}</Field>
          <EditRow label="Pronouns" editing={editing} value={p.pronouns ?? ""} onChange={(v) => set("pronouns", v)} placeholder="—" />
          <EditRow label="Preferred name" editing={editing} value={p.preferredName ?? ""} onChange={(v) => set("preferredName", v)} placeholder="—" />
          <Field label="Clinic">{p.clinicName}</Field>
          <Field label="Patient type">{p.patientType}</Field>
          <Field label="Linked patient">
            {linked ? (
              <Link href={`/provider/patients/${linked.id}`} className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-400 hover:underline">
                {linked.displayName} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : "None"}
          </Field>
        </Group>

        {/* Contact details */}
        <Group title="Contact details">
          <EditRow label="Address line" editing={editing} value={p.address.line1} onChange={(v) => setAddr("line1", v)} />
          <EditRow label="City" editing={editing} value={p.address.city} onChange={(v) => setAddr("city", v)} />
          <EditRow label="State" editing={editing} value={p.address.state} onChange={(v) => setAddr("state", v)} />
          <EditRow label="Country" editing={editing} value={p.address.country} onChange={(v) => setAddr("country", v)} />
          <EditRow label="ZIP" editing={editing} value={p.address.zip} onChange={(v) => setAddr("zip", v)} />
          <EditRow label="Cell phone" editing={editing} value={p.phone} onChange={(v) => set("phone", v)} />
          <EditRow label="Home phone" editing={editing} value={p.homePhone ?? ""} onChange={(v) => set("homePhone", v)} placeholder="—" />
          <EditRow label="Email" editing={editing} value={p.email} onChange={(v) => set("email", v)} />
        </Group>

        {/* Emergency contact */}
        <Group title="Emergency contact">
          <EditRow
            label="Contact name" editing={editing} value={p.emergencyContact.name}
            onChange={(v) => set("emergencyContact", { ...p.emergencyContact, name: v })}
          />
          <Field label="Relationship">{p.emergencyContact.relationship}</Field>
          <EditRow
            label="Contact number" editing={editing} value={p.emergencyContact.phone}
            onChange={(v) => set("emergencyContact", { ...p.emergencyContact, phone: v })}
          />
        </Group>

        {/* Caregiver */}
        <Group title="Caregiver">
          {p.caregiver ? (
            <>
              <Field label="Relationship">{p.caregiver.relationship}</Field>
              <Field label="Name">
                {caregiverLinked ? (
                  <Link href={`/provider/patients/${caregiverLinked.id}`} className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-400 hover:underline">
                    {p.caregiver.name} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : p.caregiver.name}
              </Field>
              {p.caregiver.phone && <Field label="Phone">{p.caregiver.phone}</Field>}
            </>
          ) : (
            <p className="text-sm text-slate-400 py-1">No caregiver on file — this patient manages their own care.</p>
          )}
        </Group>

        {/* Patient preferences */}
        <Group title="Patient preferences">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Preferred communication</p>
          <PrefRow label="Email" value={p.preferences.email} editing={editing} onChange={(v) => setPref("email", v)} />
          <PrefRow label="Text message" value={p.preferences.text} editing={editing} onChange={(v) => setPref("text", v)} />
          <PrefRow label="Voice call" value={p.preferences.voice} editing={editing} onChange={(v) => setPref("voice", v)} />
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Field label="Care coordinator">{coordinator?.name ?? "Unassigned"}</Field>
          </div>
        </Group>

        {/* PHR registration */}
        <Group title="PHR registration">
          <Field label="Status">
            <span className={cn("inline-flex text-xs font-semibold px-2 py-0.5 rounded-full", phr.cls)}>{phr.label}</span>
          </Field>
          <Field label="Registered account email">{p.phr.accountEmail}</Field>
          <div className="pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Secondary accounts</p>
            {p.phr.secondaryAccounts.length === 0 ? (
              <p className="text-sm text-slate-400">None</p>
            ) : (
              <ul className="space-y-1.5">
                {p.phr.secondaryAccounts.map((sa) => (
                  <li key={sa.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {sa.name} <span className="text-slate-400">· {sa.relationship}</span>
                    </span>
                    {sa.accountCreated ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Account created</span>
                    ) : (
                      <button className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                        <UserPlus className="w-3.5 h-3.5" /> Create account
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Group>

        {/* How did you hear about us */}
        <Group title="How did you hear about us">
          <Field label="Source">{p.referral.source}</Field>
          <Field label="Specific source">{p.referral.specificSource ?? "—"}</Field>
        </Group>
      </div>
    </div>
  );
}

/* ── primitives ─────────────────────────────────────────────────────────── */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <dt className="w-36 shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="flex-1 text-slate-700 dark:text-slate-200 break-words">{children}</dd>
    </div>
  );
}

function EditRow({
  label, editing, value, onChange, placeholder = "",
}: {
  label: string; editing: boolean; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  if (!editing) return <Field label={label}>{value || placeholder || "—"}</Field>;
  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="w-36 shrink-0 text-xs text-slate-400">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  );
}

function PrefRow({
  label, value, editing, onChange,
}: {
  label: string; value: boolean; editing: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      {editing ? (
        <button
          onClick={() => onChange(!value)}
          className={cn(
            "w-9 h-5 rounded-full relative transition-colors",
            value ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600",
          )}
        >
          <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", value ? "left-[18px]" : "left-0.5")} />
        </button>
      ) : (
        <span className={cn("text-xs font-semibold", value ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>
          {value ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
}

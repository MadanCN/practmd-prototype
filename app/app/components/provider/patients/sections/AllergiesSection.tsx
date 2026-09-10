"use client";

import { useState } from "react";
import { Plus, ShieldAlert, X } from "lucide-react";
import type { PatientAllergy, AllergySeverity, AllergyType } from "@/data/patient-portal";
import { PATIENT_ALLERGIES_BY_ID } from "@/data/provider-patient-clinical";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";

const SEVERITY_CFG: Record<AllergySeverity, string> = {
  mild: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  severe: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "life-threatening": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const TYPES: AllergyType[] = ["medication", "food", "environmental", "other"];
const SEVERITIES: AllergySeverity[] = ["mild", "moderate", "severe", "life-threatening"];

export function AllergiesSection({ patient }: { patient: PatientProfile }) {
  const [list, setList] = useState<PatientAllergy[]>(() => PATIENT_ALLERGIES_BY_ID[patient.id] ?? []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ allergen: "", type: "medication" as AllergyType, severity: "moderate" as AllergySeverity, reaction: "", onset: "" });

  function add() {
    if (!draft.allergen.trim()) return;
    setList((prev) => [{ id: `al-new-${Date.now()}`, status: "active", ...draft }, ...prev]);
    setDraft({ allergen: "", type: "medication", severity: "moderate", reaction: "", onset: "" });
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{list.filter((a) => a.status === "active").length} active</p>
        <button onClick={() => setAdding((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
          <Plus className="w-3.5 h-3.5" /> Add allergy
        </button>
      </div>

      {adding && (
        <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">New allergy</h3>
            <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Fld label="Allergen"><input value={draft.allergen} onChange={(e) => setDraft({ ...draft, allergen: e.target.value })} className={inp} placeholder="e.g. Penicillin" /></Fld>
            <Fld label="Type"><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as AllergyType })} className={inp}>{TYPES.map((t) => <option key={t} className="capitalize">{t}</option>)}</select></Fld>
            <Fld label="Severity"><select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as AllergySeverity })} className={inp}>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Fld>
            <Fld label="Onset"><input value={draft.onset} onChange={(e) => setDraft({ ...draft, onset: e.target.value })} className={inp} placeholder="e.g. 2018 / Childhood" /></Fld>
            <Fld label="Reaction" full><input value={draft.reaction} onChange={(e) => setDraft({ ...draft, reaction: e.target.value })} className={inp} placeholder="Observed reaction" /></Fld>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={add} disabled={!draft.allergen.trim()} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", draft.allergen.trim() ? "practmd-gradient text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>Save allergy</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No known allergies recorded.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left">
                {["Allergen", "Type", "Severity", "Reaction", "Onset", "Status"].map((h) => <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((a) => (
                <tr key={a.id} className={cn(a.status === "inactive" && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{a.allergen}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{a.type}</td>
                  <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", SEVERITY_CFG[a.severity])}>{a.severity}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.reaction || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.onset || "—"}</td>
                  <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inp = "w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize";

function Fld({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

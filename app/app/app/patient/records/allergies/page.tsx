"use client";

import { useState } from "react";
import { AlertTriangle, Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { PATIENT_ALLERGIES, type PatientAllergy } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

const SEVERITY_CFG: Record<PatientAllergy["severity"], { label: string; cls: string; dot: string }> = {
  "life-threatening": { label: "Life-Threatening", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800", dot: "bg-red-600" },
  severe:   { label: "Severe",    cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  moderate: { label: "Moderate",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",  dot: "bg-amber-500" },
  mild:     { label: "Mild",      cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",   dot: "bg-yellow-400" },
};

const TYPE_CFG: Record<PatientAllergy["type"], string> = {
  medication:   "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  food:         "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  environmental:"bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  other:        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";

const BLANK: Omit<PatientAllergy, "id"> = {
  allergen: "", type: "medication", reaction: "", severity: "moderate", onset: "", status: "active",
};

export default function AllergiesPage() {
  const [allergies, setAllergies] = useState(PATIENT_ALLERGIES);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleSave() {
    if (!form.allergen.trim()) return;
    if (editId) {
      setAllergies(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a));
      setEditId(null);
    } else {
      setAllergies(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setShowAdd(false);
    setForm({ ...BLANK });
  }

  function openEdit(a: PatientAllergy) {
    setForm({ allergen: a.allergen, type: a.type, reaction: a.reaction, severity: a.severity, onset: a.onset, status: a.status, notes: a.notes });
    setEditId(a.id);
    setShowAdd(true);
  }

  const active = allergies.filter(a => a.status === "active");
  const inactive = allergies.filter(a => a.status === "inactive");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Allergies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{active.length} active allergies on record</p>
        </div>
        <button onClick={() => { setShowAdd(s => !s); setEditId(null); setForm({ ...BLANK }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Allergy
        </button>
      </div>

      {/* Banner for life-threatening */}
      {active.some(a => a.severity === "life-threatening") && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Life-threatening allergies on file</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {active.filter(a => a.severity === "life-threatening").map(a => a.allergen).join(", ")} — EpiPen required
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{editId ? "Edit Allergy" : "Add Allergy"}</p>
            <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Allergen *</label>
              <input className={INPUT} value={form.allergen} onChange={e => setForm(f => ({ ...f, allergen: e.target.value }))} placeholder="e.g., Penicillin, Peanuts" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
              <select className={INPUT} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PatientAllergy["type"] }))}>
                <option value="medication">Medication</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Severity</label>
              <select className={INPUT} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as PatientAllergy["severity"] }))}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life-threatening">Life-Threatening</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reaction</label>
              <input className={INPUT} value={form.reaction} onChange={e => setForm(f => ({ ...f, reaction: e.target.value }))} placeholder="Describe the reaction" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Onset / Year</label>
              <input className={INPUT} value={form.onset} onChange={e => setForm(f => ({ ...f, onset: e.target.value }))} placeholder="e.g., 2020 or Childhood" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PatientAllergy["status"] }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive / Resolved</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">
              <Check className="w-4 h-4" /> {editId ? "Save Changes" : "Add Allergy"}
            </button>
            <button onClick={() => { setShowAdd(false); setEditId(null); }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active allergies */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Allergies</p>
        {active.map(a => {
          const sev = SEVERITY_CFG[a.severity];
          return (
            <div key={a.id} className={cn("rounded-2xl border p-4 transition-all", sev.cls)}>
              <div className="flex items-start gap-3">
                <span className={cn("w-3 h-3 rounded-full shrink-0 mt-1.5", sev.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.allergen}</p>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", sev.cls)}>{sev.label}</span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", TYPE_CFG[a.type])}>{a.type}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-80">Reaction: {a.reaction}</p>
                  <p className="text-xs opacity-60 mt-0.5">Onset: {a.onset}</p>
                  {a.notes && <p className="text-xs opacity-60 italic mt-0.5">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 text-current opacity-60 hover:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 text-current opacity-60 hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {active.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">No active allergies on file.</p>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive / Resolved</p>
          {inactive.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 opacity-60">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300">{a.allergen}</p>
              <span className="text-xs text-slate-400 ml-auto">Resolved</span>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Remove this allergy?</p>
            <p className="text-xs text-slate-500">This will be removed from your medical record. Your care team will be notified.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => { setAllergies(prev => prev.filter(a => a.id !== deleteId)); setDeleteId(null); }}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

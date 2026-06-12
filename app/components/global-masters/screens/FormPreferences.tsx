"use client";

import { useState } from "react";
import { ClipboardCheck, Plus, Pencil, Trash2 } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

interface FormPreference {
  id: string;
  provider: string;
  visitType: string;
  selectedForms: string[];
}

const PROVIDERS = ["All Providers", "Dr. Sarah Mitchell", "Dr. James O'Brien", "Lisa Nguyen, LCSW"];
const VISIT_TYPES = ["All Visit Types", "Initial Consultation", "Follow-Up", "Therapy Session", "Medication Check"];
const AVAILABLE_FORMS = [
  "Patient Intake Form",
  "Consent to Treat",
  "HIPAA Notice",
  "Privacy Practice Agreement",
  "Telehealth Consent",
  "PHQ-9 Depression Screening",
  "GAD-7 Anxiety Screening",
  "Columbia Suicide Severity Rating",
  "CAGE-AID Substance Use",
  "ACE Questionnaire",
  "Release of Information",
  "Financial Agreement",
];

const SEED: FormPreference[] = [
  { id: "p1", provider: "All Providers", visitType: "Initial Consultation", selectedForms: ["Patient Intake Form", "Consent to Treat", "HIPAA Notice", "PHQ-9 Depression Screening"] },
  { id: "p2", provider: "All Providers", visitType: "Follow-Up", selectedForms: ["PHQ-9 Depression Screening"] },
  { id: "p3", provider: "All Providers", visitType: "Telehealth", selectedForms: ["Telehealth Consent"] },
];

export default function FormPreferencesScreen() {
  const [preferences, setPreferences] = useState<FormPreference[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FormPreference | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drawer state
  const [selProvider, setSelProvider] = useState("");
  const [selVisitType, setSelVisitType] = useState("");
  const [formsLoaded, setFormsLoaded] = useState(false);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);

  function openAdd() {
    setSelProvider("");
    setSelVisitType("");
    setFormsLoaded(false);
    setSelectedForms([]);
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(pref: FormPreference) {
    setSelProvider(pref.provider);
    setSelVisitType(pref.visitType);
    setFormsLoaded(true);
    setSelectedForms([...pref.selectedForms]);
    setEditing(pref);
    setDrawerOpen(true);
  }

  function handleLoadForms() {
    if (selProvider && selVisitType) {
      setFormsLoaded(true);
      // Keep existing selections if editing, otherwise start fresh
      if (!editing) setSelectedForms([]);
    }
  }

  function toggleForm(form: string) {
    setSelectedForms(prev =>
      prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]
    );
  }

  function handleSave() {
    if (!selProvider || !selVisitType) return;
    if (editing) {
      setPreferences(p => p.map(pref => pref.id === editing.id
        ? { ...pref, provider: selProvider, visitType: selVisitType, selectedForms }
        : pref
      ));
    } else {
      setPreferences(p => [...p, { id: crypto.randomUUID(), provider: selProvider, visitType: selVisitType, selectedForms }]);
    }
    setDrawerOpen(false);
  }

  const canLoadForms = selProvider !== "" && selVisitType !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Form Preferences</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure which intake and clinical forms are shown for each provider and visit type combination.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Preference
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Provider</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Visit Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Forms</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {preferences.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-slate-400">No preferences configured</td></tr>
            )}
            {preferences.map(pref => (
              <tr key={pref.id}
                onMouseEnter={() => setHoveredId(pref.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{pref.provider}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pref.visitType}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{pref.selectedForms.length} form{pref.selectedForms.length !== 1 ? "s" : ""}</span>
                    {pref.selectedForms.slice(0, 2).map(f => (
                      <span key={f} className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                    {pref.selectedForms.length > 2 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">+{pref.selectedForms.length - 2} more</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === pref.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(pref)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(pref.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Preference" : "Add Preference"}
        description="Select provider, visit type, and the forms to include"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!formsLoaded}
              className={cn(
                "px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors",
                formsLoaded ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 dark:bg-blue-800 cursor-not-allowed"
              )}>
              Save Preference
            </button>
          </div>
        }>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Provider</label>
            <select
              value={selProvider}
              onChange={e => { setSelProvider(e.target.value); setFormsLoaded(false); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select provider…</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Visit Type</label>
            <select
              value={selVisitType}
              onChange={e => { setSelVisitType(e.target.value); setFormsLoaded(false); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select visit type…</option>
              {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {canLoadForms && !formsLoaded && (
            <button
              onClick={handleLoadForms}
              className="w-full py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium transition-colors">
              Load Forms
            </button>
          )}

          {formsLoaded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Available Forms</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedForms.length} selected</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {AVAILABLE_FORMS.map(form => (
                  <label key={form} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form)}
                      onChange={() => toggleForm(form)}
                      className="w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200">{form}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this preference?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setPreferences(p => p.filter(pref => pref.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

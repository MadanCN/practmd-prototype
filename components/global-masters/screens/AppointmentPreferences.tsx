"use client";

import { useState } from "react";
import { Settings2, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface RadioGroup {
  id: string;
  label: string;
  description: string;
  options: { value: string; label: string }[];
  value: string;
}

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  value: boolean;
}

const INIT_RADIO: RadioGroup[] = [
  {
    id: "booking_window", label: "Staff Booking Window", description: "How far into the future staff can book appointments. Select Any for no limit.",
    options: [{ value: "30", label: "30 days" }, { value: "60", label: "60 days" }, { value: "90", label: "90 days" }, { value: "180", label: "180 days" }, { value: "any", label: "Any" }],
    value: "90",
  },
  {
    id: "patient_booking_window", label: "Patient Booking Window", description: "How far into the future patients can book appointments via the portal.",
    options: [{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" }, { value: "any", label: "Any" }],
    value: "30",
  },
  {
    id: "cancellation_policy", label: "Cancellation Policy", description: "Minimum notice required to cancel without a fee",
    options: [{ value: "12", label: "12 hours" }, { value: "24", label: "24 hours" }, { value: "48", label: "48 hours" }, { value: "72", label: "72 hours" }],
    value: "24",
  },
];

const INIT_TOGGLES: ToggleSetting[] = [
  { id: "patient_notes", label: "Allow Patient Notes at Booking", description: "Patients can add a note when booking online", value: true },
  { id: "insurance_check", label: "Insurance Check at Booking (Patient)", description: "Verify insurance eligibility when patient books online", value: false },
  { id: "confirm_required", label: "Require Appointment Confirmation", description: "Patient must confirm before appointment is finalized", value: true },
];

export default function AppointmentPreferencesScreen() {
  const [radioGroups, setRadioGroups] = useState<RadioGroup[]>(INIT_RADIO);
  const [toggles, setToggles] = useState<ToggleSetting[]>(INIT_TOGGLES);
  const [saved, setSaved] = useState(false);

  function setRadio(id: string, value: string) {
    setSaved(false);
    setRadioGroups(p => p.map(g => g.id === id ? { ...g, value } : g));
  }

  function setToggle(id: string, value: boolean) {
    setSaved(false);
    setToggles(p => p.map(t => t.id === id ? { ...t, value } : t));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Preferences</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organization-wide scheduling defaults and appointment policy settings.</p>
        </div>
      </div>

      {/* Radio groups */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Scheduling Policies</h2>
        {radioGroups.map(group => (
          <div key={group.id} className="space-y-2">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{group.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRadio(group.id, opt.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full border text-sm font-medium transition-colors",
                    group.value === opt.value
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Feature Toggles</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {toggles.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
              </div>
              <Toggle checked={t.value} onChange={v => setToggle(t.id, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved successfully
          </div>
        )}
      </div>
    </div>
  );
}

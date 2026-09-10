"use client";

import { useState } from "react";
import { ClipboardList, Save, CheckCircle, RefreshCw } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface RecordIdConfig {
  prefix: string;
  includeYear: boolean;
  includeMonth: boolean;
  padLength: number;
  separator: string;
  startFrom: number;
  autoIncrement: boolean;
}

interface RequiredField {
  id: string;
  label: string;
  required: boolean;
  visible: boolean;
}

const INITIAL_CONFIG: RecordIdConfig = {
  prefix: "PT",
  includeYear: true,
  includeMonth: false,
  padLength: 5,
  separator: "-",
  startFrom: 1001,
  autoIncrement: true,
};

const INITIAL_FIELDS: RequiredField[] = [
  { id: "first_name", label: "First Name", required: true, visible: true },
  { id: "last_name", label: "Last Name", required: true, visible: true },
  { id: "dob", label: "Date of Birth", required: true, visible: true },
  { id: "gender", label: "Gender", required: true, visible: true },
  { id: "phone", label: "Phone Number", required: true, visible: true },
  { id: "email", label: "Email Address", required: false, visible: true },
  { id: "address", label: "Home Address", required: false, visible: true },
  { id: "ssn", label: "Social Security Number", required: false, visible: true },
  { id: "insurance", label: "Insurance Information", required: false, visible: true },
  { id: "emergency_contact", label: "Emergency Contact", required: false, visible: true },
  { id: "referral_source", label: "Referral Source", required: false, visible: true },
  { id: "race_ethnicity", label: "Race / Ethnicity", required: false, visible: true },
  { id: "preferred_language", label: "Preferred Language", required: false, visible: true },
  { id: "pronouns", label: "Pronouns", required: false, visible: true },
];

function generatePreview(config: RecordIdConfig) {
  const parts: string[] = [];
  if (config.prefix) parts.push(config.prefix);
  if (config.includeYear) parts.push("2025");
  if (config.includeMonth) parts.push("06");
  parts.push(String(config.startFrom).padStart(config.padLength, "0"));
  return parts.join(config.separator);
}

export default function PatientRegistrationScreen() {
  const [config, setConfig] = useState<RecordIdConfig>(INITIAL_CONFIG);
  const [fields, setFields] = useState<RequiredField[]>(INITIAL_FIELDS);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const preview = generatePreview(config);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Patient Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure the patient Record ID format and required registration fields.</p>
        </div>
      </div>

      {/* Record ID format */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Record ID Format</h2>

        <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 flex items-center gap-3">
          <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{preview}</div>
          <button onClick={() => setConfig(c => ({ ...c, startFrom: c.startFrom + 1 }))}
            className="ml-auto flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700">
            <RefreshCw className="w-3 h-3" /> Preview next
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prefix</label>
            <input value={config.prefix} onChange={e => setConfig(c => ({ ...c, prefix: e.target.value.toUpperCase().slice(0, 5) }))} placeholder="e.g., PT"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Separator</label>
            <select value={config.separator} onChange={e => setConfig(c => ({ ...c, separator: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="-">Hyphen (-)</option>
              <option value="_">Underscore (_)</option>
              <option value="">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Number Padding Length</label>
            <input type="number" min={3} max={8} value={config.padLength} onChange={e => setConfig(c => ({ ...c, padLength: parseInt(e.target.value) || 5 }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start From</label>
            <input type="number" min={1} value={config.startFrom} onChange={e => setConfig(c => ({ ...c, startFrom: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="space-y-2">
          {[
            { key: "includeYear", label: "Include Year", desc: "Append current year to the record ID" },
            { key: "includeMonth", label: "Include Month", desc: "Append current month to the record ID" },
            { key: "autoIncrement", label: "Auto-Increment", desc: "Automatically increment the sequence number for each new patient" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
              </div>
              <Toggle checked={Boolean(config[opt.key as keyof RecordIdConfig])} onChange={v => setConfig(c => ({ ...c, [opt.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Required fields */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Registration Fields</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure which fields are required or visible on the patient registration form.</p>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400">Field</th>
                <th className="text-center py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Required</th>
                <th className="text-center py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Visible</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">{f.label}</td>
                  <td className="py-2.5 px-4 text-center">
                    <input type="checkbox" checked={f.required} onChange={e => setFields(p => p.map(x => x.id === f.id ? { ...x, required: e.target.checked, visible: e.target.checked ? true : x.visible } : x))}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <input type="checkbox" checked={f.visible} disabled={f.required} onChange={e => setFields(p => p.map(x => x.id === f.id ? { ...x, visible: e.target.checked } : x))}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Registration Settings
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

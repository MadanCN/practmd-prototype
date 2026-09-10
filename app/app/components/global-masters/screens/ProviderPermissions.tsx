"use client";

import { useState } from "react";
import { Stethoscope, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const PERMISSIONS = [
  { key: "can_prescribe", label: "Can Prescribe Medication", description: "Issue and manage prescriptions in the EHR" },
  { key: "can_diagnose", label: "Can Diagnose", description: "Enter diagnostic codes and clinical diagnoses" },
  { key: "can_sign_notes", label: "Can Sign Clinical Notes", description: "Co-sign or counter-sign progress notes" },
  { key: "can_order_labs", label: "Can Order Labs", description: "Submit lab and diagnostic orders" },
  { key: "can_schedule_self", label: "Self-Scheduling Enabled", description: "Appear in self-scheduling portal for patients" },
  { key: "can_telehealth", label: "Telehealth Enabled", description: "Conduct virtual appointments via telehealth" },
  { key: "can_bill", label: "Can Submit Claims", description: "Submit billing claims under their NPI" },
  { key: "can_view_all_patients", label: "View All Patients", description: "See all patients, not just their panel" },
  { key: "can_manage_staff", label: "Can Manage Staff", description: "Add and edit staff members in their clinic" },
  { key: "can_view_reports", label: "Can View Reports", description: "Access practice analytics and reports" },
];

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  can_prescribe: true,
  can_diagnose: true,
  can_sign_notes: true,
  can_order_labs: true,
  can_schedule_self: true,
  can_telehealth: true,
  can_bill: true,
  can_view_all_patients: false,
  can_manage_staff: false,
  can_view_reports: true,
};

export default function ProviderPermissionsScreen() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setSaved(false);
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Provider Permissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure capability toggles for the Provider role. These govern what providers can do in the system.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Provider</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {enabledCount} / {PERMISSIONS.length} capabilities enabled
          </p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {PERMISSIONS.map(perm => (
            <div key={perm.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{perm.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{perm.description}</p>
              </div>
              <Toggle
                checked={permissions[perm.key] ?? false}
                onChange={() => toggle(perm.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Permissions
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Permissions saved
          </div>
        )}
      </div>
    </div>
  );
}

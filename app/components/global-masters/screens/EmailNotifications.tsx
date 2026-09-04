"use client";

import { useState } from "react";
import { Mail, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "patient", label: "Patient" },
  { id: "provider", label: "Provider" },
  { id: "admin", label: "Admin" },
];

interface NotifRow {
  id: string;
  event: string;
  required: boolean;
}

const PATIENT_ROWS: NotifRow[] = [
  { id: "appt_confirm", event: "Appointment Confirmation", required: true },
  { id: "appt_reminder_48", event: "Appointment Reminder (48h)", required: true },
  { id: "appt_reminder_24", event: "Appointment Reminder (24h)", required: false },
  { id: "appt_cancel", event: "Appointment Cancellation", required: true },
  { id: "appt_reschedule", event: "Appointment Rescheduled", required: true },
  { id: "intake_form", event: "Intake Form Link", required: false },
  { id: "telehealth_link", event: "Telehealth Join Link", required: true },
  { id: "invoice", event: "Invoice / Statement", required: false },
  { id: "payment_receipt", event: "Payment Receipt", required: false },
  { id: "recall", event: "Recall / Re-engagement Campaign", required: false },
  { id: "welcome", event: "Welcome Email (New Patient)", required: false },
];

const PROVIDER_ROWS: NotifRow[] = [
  { id: "new_appt", event: "New Appointment Booked", required: false },
  { id: "cancel_p", event: "Patient Cancelled", required: false },
  { id: "reschedule_p", event: "Patient Rescheduled", required: false },
  { id: "no_show", event: "No-Show Notification", required: false },
  { id: "form_sub", event: "Form Submitted by Patient", required: false },
  { id: "daily_schedule", event: "Daily Schedule Summary", required: false },
];

const ADMIN_ROWS: NotifRow[] = [
  { id: "new_patient", event: "New Patient Registration", required: false },
  { id: "payment_fail", event: "Payment Failed", required: false },
  { id: "low_capacity", event: "Low Appointment Capacity Alert", required: false },
  { id: "staff_new", event: "New Staff Account Created", required: false },
  { id: "audit_alert", event: "Audit / Security Alert", required: true },
];

const ROWS_BY_TAB: Record<string, NotifRow[]> = { patient: PATIENT_ROWS, provider: PROVIDER_ROWS, admin: ADMIN_ROWS };

type Status = "required" | "not_required" | "disabled";

function initStatus(rows: NotifRow[]): Record<string, Status> {
  return Object.fromEntries(rows.map(r => [r.id, r.required ? "required" : "not_required"]));
}

export default function EmailNotificationsScreen() {
  const [activeTab, setActiveTab] = useState("patient");
  const [statusMap, setStatusMap] = useState<Record<string, Record<string, Status>>>({
    patient: initStatus(PATIENT_ROWS),
    provider: initStatus(PROVIDER_ROWS),
    admin: initStatus(ADMIN_ROWS),
  });
  const [saved, setSaved] = useState(false);

  function setStatus(tab: string, id: string, val: Status) {
    setSaved(false);
    setStatusMap(p => ({ ...p, [tab]: { ...p[tab], [id]: val } }));
  }

  const rows = ROWS_BY_TAB[activeTab] ?? [];
  const map = statusMap[activeTab] ?? {};

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Email Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure which email notifications are sent for each trigger event.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Event</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-36">Required</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-36">Not Required</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Disabled</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200">{row.event}</span>
                    {row.required && <span className="text-xs bg-red-50 dark:bg-red-950/40 text-red-500 px-1.5 py-0.5 rounded">Core</span>}
                  </div>
                </td>
                {(["required", "not_required", "disabled"] as Status[]).map(status => (
                  <td key={status} className="py-3 px-4 text-center">
                    <input type="radio" name={`${activeTab}_${row.id}`} checked={map[row.id] === status}
                      onChange={() => setStatus(activeTab, row.id, status)}
                      disabled={status === "required" && row.required}
                      className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Email Settings
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

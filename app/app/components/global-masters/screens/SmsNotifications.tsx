"use client";

import { useState } from "react";
import { MessageSquare, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "patient", label: "Patient" },
  { id: "provider", label: "Provider" },
  { id: "twoway", label: "Two-Way" },
  { id: "agent", label: "Booking Assistant" },
];

interface NotifRow {
  id: string;
  event: string;
  required: boolean | null;
}

const PATIENT_ROWS: NotifRow[] = [
  { id: "appt_confirm", event: "Appointment Confirmation", required: true },
  { id: "appt_reminder_24", event: "Appointment Reminder (24h)", required: true },
  { id: "appt_reminder_1", event: "Appointment Reminder (1h)", required: null },
  { id: "appt_cancel", event: "Appointment Cancellation", required: true },
  { id: "appt_reschedule", event: "Appointment Rescheduled", required: true },
  { id: "appt_waitlist", event: "Added to Waitlist", required: null },
  { id: "intake_form", event: "Intake Form Request", required: null },
  { id: "telehealth_link", event: "Telehealth Link", required: true },
  { id: "balance_due", event: "Balance Due Notification", required: null },
  { id: "recall", event: "Recall / Re-engagement", required: null },
];

const PROVIDER_ROWS: NotifRow[] = [
  { id: "new_appt", event: "New Appointment Booked", required: null },
  { id: "appt_cancel_p", event: "Patient Cancelled Appointment", required: null },
  { id: "appt_reschedule_p", event: "Patient Rescheduled", required: null },
  { id: "no_show", event: "Patient No-Show", required: null },
  { id: "message_received", event: "New Patient Message", required: null },
  { id: "form_submitted", event: "Form Submitted by Patient", required: null },
];

const TWOWAY_ROWS: NotifRow[] = [
  { id: "tw_enabled", event: "Two-Way SMS Enabled", required: null },
  { id: "tw_auto_reply", event: "Auto-Reply for Off-Hours", required: null },
  { id: "tw_opt_out", event: "Opt-Out Handling (STOP keyword)", required: null },
];

const AGENT_ROWS: NotifRow[] = [
  { id: "agent_booking", event: "Booking Assistant Active", required: null },
  { id: "agent_confirm", event: "Agent Sends Confirmation SMS", required: null },
  { id: "agent_reschedule", event: "Agent Handles Reschedule Requests", required: null },
  { id: "agent_escalate", event: "Escalate to Human After N Turns", required: null },
];

const ROWS_BY_TAB: Record<string, NotifRow[]> = {
  patient: PATIENT_ROWS,
  provider: PROVIDER_ROWS,
  twoway: TWOWAY_ROWS,
  agent: AGENT_ROWS,
};

type Status = "required" | "not_required" | "disabled";

function initStatus(rows: NotifRow[]): Record<string, Status> {
  return Object.fromEntries(rows.map(r => [r.id, r.required === true ? "required" : "not_required"]));
}

export default function SmsNotificationsScreen() {
  const [activeTab, setActiveTab] = useState("patient");
  const [statusMap, setStatusMap] = useState<Record<string, Record<string, Status>>>({
    patient: initStatus(PATIENT_ROWS),
    provider: initStatus(PROVIDER_ROWS),
    twoway: initStatus(TWOWAY_ROWS),
    agent: initStatus(AGENT_ROWS),
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
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">SMS Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure which SMS notifications are sent for each event, and whether they are required or optional.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
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
                    {row.required === true && (
                      <span className="text-xs bg-red-50 dark:bg-red-950/40 text-red-500 px-1.5 py-0.5 rounded">Core</span>
                    )}
                  </div>
                </td>
                {(["required", "not_required", "disabled"] as Status[]).map(status => (
                  <td key={status} className="py-3 px-4 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="radio"
                        name={`${activeTab}_${row.id}`}
                        checked={map[row.id] === status}
                        onChange={() => setStatus(activeTab, row.id, status)}
                        disabled={status === "required" && row.required === true}
                        className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>
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
          Save SMS Settings
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

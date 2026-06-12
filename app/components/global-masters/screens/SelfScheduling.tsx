"use client";

import { useState } from "react";
import { Globe, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export default function SelfSchedulingScreen() {
  const [settings, setSettings] = useState({
    enabled: true,
    newPatients: true,
    existingPatients: true,
    requireAuth: false,
    requireInsurance: false,
    requireCreditCard: false,
    confirmationType: "instant" as "instant" | "manual",
    bufferDays: 1,
    maxAdvanceDays: 60,
    showProviderBio: true,
    showVisitTypeDetails: true,
    allowCancellation: true,
    allowReschedule: true,
    cancellationHours: 24,
    customMessage: "",
    allowGuestBooking: false,
    showAvailabilityCount: false,
    collectChiefComplaint: true,
    requireReferral: false,
  });
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSaved(false);
    setSettings(s => ({ ...s, [key]: value }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Self Scheduling</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure the patient-facing online booking experience.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Saved successfully
            </div>
          )}
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Master toggle */}
      <div className={cn(
        "flex items-center justify-between py-4 px-5 rounded-xl border-2 transition-colors",
        settings.enabled ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800"
      )}>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Self-Scheduling Portal</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enable or disable online booking entirely</p>
        </div>
        <Toggle checked={settings.enabled} onChange={v => update("enabled", v)} />
      </div>

      {settings.enabled && (
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Patient Access */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Access</h2>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { key: "newPatients" as const, label: "New Patients", desc: "Allow patients not yet in the system to book" },
                  { key: "existingPatients" as const, label: "Existing Patients", desc: "Allow existing patients to book online" },
                  { key: "allowGuestBooking" as const, label: "Guest Booking", desc: "Allow booking without creating an account" },
                  { key: "requireAuth" as const, label: "Require Login / Verification", desc: "Patient must verify identity before booking" },
                  { key: "requireInsurance" as const, label: "Require Insurance Info", desc: "Collect insurance details before confirming" },
                  { key: "requireCreditCard" as const, label: "Require Credit Card on File", desc: "Collect payment method to hold appointment" },
                  { key: "requireReferral" as const, label: "Require Referral", desc: "Patient must provide a referral to book" },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                    </div>
                    <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Window */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booking Window</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Min Lead Time (days)</label>
                  <input type="number" min={0} max={30} value={settings.bufferDays}
                    onChange={e => update("bufferDays", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Advance (days)</label>
                  <input type="number" min={7} max={365} value={settings.maxAdvanceDays}
                    onChange={e => update("maxAdvanceDays", parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* Confirmation Type */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmation Type</h2>
              <div className="flex gap-2">
                {([
                  { value: "instant", label: "Instant Confirmation", desc: "Appointment confirmed immediately" },
                  { value: "manual", label: "Manual Review", desc: "Staff must approve before confirming" },
                ] as const).map(opt => (
                  <button key={opt.value} onClick={() => update("confirmationType", opt.value)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border text-left transition-colors",
                      settings.confirmationType === opt.value
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    )}>
                    <p className={cn("text-sm font-medium", settings.confirmationType === opt.value ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200")}>{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Portal Display */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portal Display & Features</h2>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { key: "showProviderBio" as const, label: "Show Provider Bio", desc: "Display provider photo and bio on booking page" },
                  { key: "showVisitTypeDetails" as const, label: "Show Visit Type Details", desc: "Display duration and description for each visit type" },
                  { key: "showAvailabilityCount" as const, label: "Show Available Slot Count", desc: "Show how many slots remain for each date" },
                  { key: "collectChiefComplaint" as const, label: "Collect Chief Complaint", desc: "Ask patients to describe their reason for visit" },
                  { key: "allowCancellation" as const, label: "Allow Online Cancellation", desc: "Let patients cancel from the portal" },
                  { key: "allowReschedule" as const, label: "Allow Online Rescheduling", desc: "Let patients reschedule from the portal" },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                    </div>
                    <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Custom Welcome Message</label>
              <textarea
                value={settings.customMessage}
                onChange={e => update("customMessage", e.target.value)}
                rows={3}
                placeholder="Optional message shown at the top of the booking page…"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Video, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Settings {
  joinWindowMins: number;
  waitingRoomEnabled: boolean;
  waitingRoomBranding: string;
  passwordRequired: boolean;
  consentFormId: string;
  linkDelivery: "sms" | "email" | "both";
  recordingEnabled: boolean;
  recordingConsent: boolean;
  retentionDays: number;
}

const CONSENT_FORMS = [
  { value: "", label: "— None —" },
  { value: "cf-001", label: "Telehealth Consent Form v1" },
  { value: "cf-002", label: "Telehealth Consent Form v2 (HIPAA)" },
  { value: "cf-003", label: "Telepsychiatry Consent" },
];

export default function TelehealthSettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    joinWindowMins: 10,
    waitingRoomEnabled: true,
    waitingRoomBranding: "PractMD Virtual Waiting Room",
    passwordRequired: false,
    consentFormId: "cf-002",
    linkDelivery: "both",
    recordingEnabled: false,
    recordingConsent: true,
    retentionDays: 30,
  });
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSaved(false);
    setSettings(s => ({ ...s, [key]: value }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center flex-shrink-0">
          <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Telehealth Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organization-level configuration for virtual visit behavior and compliance settings.</p>
        </div>
      </div>

      {/* Patient Join Window */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Session Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Patient Join Window</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">How early (in minutes) a patient can enter the virtual waiting room before the appointment</p>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={30} step={1} value={settings.joinWindowMins} onChange={e => update("joinWindowMins", Number(e.target.value))}
                className="w-48 accent-teal-600" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-20">{settings.joinWindowMins} min early</span>
            </div>
          </div>

          {[
            { key: "waitingRoomEnabled" as const, label: "Waiting Room", desc: "Enable virtual waiting room before the provider joins" },
            { key: "passwordRequired" as const, label: "Require Meeting Password", desc: "Patients must enter a password to join" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
              </div>
              <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
            </div>
          ))}

          {settings.waitingRoomEnabled && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Waiting Room Display Name</label>
              <input value={settings.waitingRoomBranding} onChange={e => update("waitingRoomBranding", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          )}
        </div>
      </div>

      {/* Consent & Link */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Consent & Link Delivery</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Consent Form</label>
          <select value={settings.consentFormId} onChange={e => update("consentFormId", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {CONSENT_FORMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Appointment Link Delivery</label>
          <div className="flex gap-2">
            {(["sms", "email", "both"] as const).map(opt => (
              <button key={opt} onClick={() => update("linkDelivery", opt)}
                className={cn("px-4 py-1.5 rounded-full border text-sm font-medium transition-colors capitalize",
                  settings.linkDelivery === opt ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400")}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recording */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Recording</h2>
        {[
          { key: "recordingEnabled" as const, label: "Session Recording", desc: "Record telehealth sessions (requires patient consent)" },
          { key: "recordingConsent" as const, label: "Require Consent Before Recording", desc: "Patient must actively consent before recording begins" },
        ].map(opt => (
          <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
            </div>
            <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
          </div>
        ))}
        {settings.recordingEnabled && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Recording Retention (days)</label>
            <input type="number" min={7} max={365} value={settings.retentionDays} onChange={e => update("retentionDays", parseInt(e.target.value) || 30)}
              className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Telehealth Settings
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Settings saved
          </div>
        )}
      </div>
    </div>
  );
}

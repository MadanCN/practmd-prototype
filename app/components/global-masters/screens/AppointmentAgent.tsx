"use client";

import { useState } from "react";
import { Bot, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const ESCALATION_TURNS = [2, 3, 4, 5, 6];
const AUTH_METHODS = [
  { value: "dob", label: "Date of Birth" },
  { value: "phone", label: "Phone Number (Last 4)" },
  { value: "email", label: "Email Address" },
  { value: "mrn", label: "Patient Record ID" },
];

export default function AppointmentAgentScreen() {
  const [settings, setSettings] = useState({
    enabled: true,
    authMethod: "dob",
    maxTurns: 4,
    greeting: "Hi! I'm the PractMD scheduling assistant. I can help you book, reschedule, or cancel an appointment. How can I help you today?",
    fallbackMessage: "I'm having trouble with that request. Let me connect you with our front desk team.",
    collectInsurance: false,
    confirmBeforeBook: true,
    sendConfirmationSms: true,
    sendConfirmationEmail: true,
    allowCancellation: true,
    allowReschedule: true,
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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Agent</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure the AI scheduling assistant for automated patient booking via SMS and chat.</p>
        </div>
      </div>

      {/* Master toggle */}
      <div className={cn("flex items-center justify-between py-4 px-4 rounded-xl border-2 transition-colors",
        settings.enabled ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-800")}>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appointment Agent</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enable AI-powered scheduling assistant</p>
        </div>
        <Toggle checked={settings.enabled} onChange={v => update("enabled", v)} />
      </div>

      {settings.enabled && (
        <>
          {/* Identity verification */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Identity Verification</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Verification Method</label>
              <div className="grid grid-cols-2 gap-2">
                {AUTH_METHODS.map(m => (
                  <label key={m.value} onClick={() => update("authMethod", m.value)} className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors",
                    settings.authMethod === m.value ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300")}>
                    <input type="radio" name="auth" value={m.value} checked={settings.authMethod === m.value} onChange={() => update("authMethod", m.value)} className="accent-indigo-600" />
                    <span className={cn("text-sm font-medium", settings.authMethod === m.value ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300")}>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Escalation */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Escalation</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">When the AI agent cannot resolve a patient&apos;s request after the selected number of conversation turns, it will automatically transfer the conversation to a live Care Coordinator. The agent will inform the patient and hand off all context collected so far.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Escalate to Human After</label>
              <div className="flex gap-2">
                {ESCALATION_TURNS.map(n => (
                  <button key={n} onClick={() => update("maxTurns", n)}
                    className={cn("px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                      settings.maxTurns === n ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400")}>
                    {n} turns
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Capabilities</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { key: "allowCancellation" as const, label: "Cancellations", desc: "Agent can process appointment cancellations" },
                { key: "allowReschedule" as const, label: "Rescheduling", desc: "Agent can reschedule existing appointments" },
                { key: "confirmBeforeBook" as const, label: "Confirm Before Booking", desc: "Agent confirms all details before finalizing" },
                { key: "collectInsurance" as const, label: "Collect Insurance Info", desc: "Agent asks for insurance details during booking" },
                { key: "sendConfirmationSms" as const, label: "Send Confirmation SMS", desc: "Send SMS confirmation after booking" },
                { key: "sendConfirmationEmail" as const, label: "Send Confirmation Email", desc: "Send email confirmation after booking" },
              ].map(opt => (
                <div key={opt.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                  <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Agent Messages</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Greeting Message</label>
              <textarea value={settings.greeting} onChange={e => update("greeting", e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fallback / Handoff Message</label>
              <textarea value={settings.fallbackMessage} onChange={e => update("fallbackMessage", e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Agent Settings
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>
    </div>
  );
}

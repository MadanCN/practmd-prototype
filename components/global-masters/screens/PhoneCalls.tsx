"use client";

import { useState } from "react";
import { Phone, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const CALL_FLOWS = [
  {
    id: "inbound_general", label: "Inbound — General", desc: "Main incoming call flow for new callers",
    steps: ["Welcome greeting", "Press 1: Schedule appointment", "Press 2: Billing inquiries", "Press 3: Speak to staff"],
  },
  {
    id: "inbound_patient", label: "Inbound — Existing Patient", desc: "Recognized patient caller flow",
    steps: ["Welcome greeting by name", "Press 1: Confirm upcoming appointment", "Press 2: Leave a message for provider", "Press 3: Billing"],
  },
  {
    id: "after_hours", label: "After Hours", desc: "Call routing when clinic is closed",
    steps: ["After hours message with business hours", "Press 1: Leave voicemail", "Press 2: Emergency line"],
  },
];

export default function PhoneCallsScreen() {
  const [activeFlow, setActiveFlow] = useState("inbound_general");
  const [settings, setSettings] = useState({
    recordCalls: false,
    transcription: false,
    callerId: "+1 (585) 555-0100",
    holdMusic: "default",
    maxHoldSeconds: 120,
    afterHoursForward: "",
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

  const flow = CALL_FLOWS.find(f => f.id === activeFlow);

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
          <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Phone Calls</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure call flows, IVR menus, hold settings, and call recording policies.</p>
        </div>
      </div>

      {/* Call flows */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Call Flows</h2>
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {CALL_FLOWS.map(f => (
            <button key={f.id} onClick={() => setActiveFlow(f.id)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeFlow === f.id ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
              {f.label}
            </button>
          ))}
        </div>
        {flow && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{flow.desc}</p>
            <div className="space-y-2">
              {flow.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">{i + 1}</div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Global Call Settings</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Outbound Caller ID</label>
          <input value={settings.callerId} onChange={e => update("callerId", e.target.value)}
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Hold Time (seconds)</label>
          <input type="number" min={30} max={600} value={settings.maxHoldSeconds} onChange={e => update("maxHoldSeconds", parseInt(e.target.value) || 120)}
            className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">After-Hours Forward To</label>
          <input value={settings.afterHoursForward} onChange={e => update("afterHoursForward", e.target.value)} placeholder="Phone number or voicemail"
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="space-y-2">
          {[
            { key: "recordCalls" as const, label: "Record Calls", desc: "Record all inbound and outbound calls (requires disclosure)" },
            { key: "transcription" as const, label: "Auto-Transcription", desc: "Generate transcripts from recorded calls" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
              </div>
              <Toggle checked={settings[opt.key]} onChange={v => update(opt.key, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Phone Settings
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

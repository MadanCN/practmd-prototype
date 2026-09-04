"use client";

import { useState } from "react";
import { Volume2, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", desc: "Neutral and balanced — good for general announcements" },
  { value: "echo", label: "Echo", desc: "Warm and conversational" },
  { value: "fable", label: "Fable", desc: "Expressive and dynamic" },
  { value: "onyx", label: "Onyx", desc: "Deep and authoritative" },
  { value: "nova", label: "Nova", desc: "Bright and energetic" },
];

const CALL_EVENTS = [
  { id: "appt_reminder", label: "Appointment Reminder Call", desc: "Automated call 24h before appointment" },
  { id: "recall_outreach", label: "Recall Outreach Call", desc: "Automated call for recall campaigns" },
  { id: "no_show_follow_up", label: "No-Show Follow-Up", desc: "Call after a missed appointment" },
  { id: "balance_due", label: "Balance Due Notification", desc: "Automated call for outstanding balances" },
];

export default function VoiceScreen() {
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [callerId, setCallerId] = useState("+1 (585) 555-0100");
  const [greeting, setGreeting] = useState("Hello, this is {{clinic_name}} calling for {{patient_name}}.");
  const [enabledCalls, setEnabledCalls] = useState<Record<string, boolean>>({
    appt_reminder: true, recall_outreach: false, no_show_follow_up: true, balance_due: false,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Voice Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure automated voice calls — AI voice selection, caller ID, and event triggers.</p>
        </div>
      </div>

      {/* Voice selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">AI Voice</h2>
        <div className="space-y-2">
          {VOICE_OPTIONS.map(v => (
            <label key={v.value} onClick={() => setSaved(false)} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
              selectedVoice === v.value ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            )}>
              <input type="radio" name="voice" value={v.value} checked={selectedVoice === v.value} onChange={() => setSelectedVoice(v.value)} className="accent-purple-600" />
              <div>
                <p className={cn("text-sm font-medium", selectedVoice === v.value ? "text-purple-700 dark:text-purple-300" : "text-slate-800 dark:text-slate-200")}>{v.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{v.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Caller ID + Greeting */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Call Configuration</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Caller ID (From Number)</label>
          <input value={callerId} onChange={e => { setCallerId(e.target.value); setSaved(false); }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Opening Greeting Script</label>
          <textarea value={greeting} onChange={e => { setGreeting(e.target.value); setSaved(false); }} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{{variable}}"}</code> for patient name, clinic name, etc.</p>
        </div>
      </div>

      {/* Enabled call types */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Automated Call Events</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {CALL_EVENTS.map(ev => (
            <div key={ev.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ev.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ev.desc}</p>
              </div>
              <Toggle checked={enabledCalls[ev.id] ?? false} onChange={v => { setSaved(false); setEnabledCalls(p => ({ ...p, [ev.id]: v })); }} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Voice Settings
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

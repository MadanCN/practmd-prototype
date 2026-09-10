"use client";

import { useState } from "react";
import { RotateCcw, Save, CheckCircle, Plus, Trash2 } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface TouchPoint {
  id: string;
  channel: "sms" | "email" | "phone";
  daysBefore: number;
  enabled: boolean;
}

interface RecallConfig {
  maxAttempts: number;
  stopOnBooking: boolean;
  stopOnDecline: boolean;
  touchPoints: TouchPoint[];
}

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  sms: { label: "SMS", color: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" },
  email: { label: "Email", color: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400" },
  phone: { label: "Phone Call", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" },
};

const INITIAL: RecallConfig = {
  maxAttempts: 3,
  stopOnBooking: true,
  stopOnDecline: true,
  touchPoints: [
    { id: "1", channel: "sms", daysBefore: 0, enabled: true },
    { id: "2", channel: "email", daysBefore: -3, enabled: true },
    { id: "3", channel: "sms", daysBefore: -7, enabled: true },
    { id: "4", channel: "phone", daysBefore: -14, enabled: false },
  ],
};

export default function RecallPreferenceScreen() {
  const [config, setConfig] = useState<RecallConfig>(INITIAL);
  const [saved, setSaved] = useState(false);

  function updateTouchPoint(id: string, changes: Partial<TouchPoint>) {
    setSaved(false);
    setConfig(c => ({ ...c, touchPoints: c.touchPoints.map(t => t.id === id ? { ...t, ...changes } : t) }));
  }

  function addTouchPoint() {
    setSaved(false);
    setConfig(c => ({
      ...c,
      touchPoints: [...c.touchPoints, { id: crypto.randomUUID(), channel: "sms", daysBefore: -21, enabled: true }]
    }));
  }

  function removeTouchPoint(id: string) {
    setSaved(false);
    setConfig(c => ({ ...c, touchPoints: c.touchPoints.filter(t => t.id !== id) }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const sorted = [...config.touchPoints].sort((a, b) => b.daysBefore - a.daysBefore);

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recall Preference</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure the multi-channel outreach sequence for patient recall campaigns.</p>
        </div>
      </div>

      {/* General settings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Campaign Rules</h2>
        <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">Maximum Outreach Attempts</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => { setSaved(false); setConfig(c => ({ ...c, maxAttempts: n })); }}
                className={cn("w-8 h-8 rounded-full text-sm font-medium border transition-colors",
                  config.maxAttempts === n ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400")}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {[
          { key: "stopOnBooking" as const, label: "Stop When Patient Books", desc: "Halt the outreach sequence once an appointment is booked" },
          { key: "stopOnDecline" as const, label: "Stop When Patient Declines", desc: "Halt after the patient responds with a decline" },
        ].map(opt => (
          <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
            </div>
            <Toggle checked={config[opt.key]} onChange={v => { setSaved(false); setConfig(c => ({ ...c, [opt.key]: v })); }} />
          </div>
        ))}
      </div>

      {/* Outreach sequence */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Outreach Sequence</h2>
          <button onClick={addTouchPoint} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Touch Point
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Define what channel to use and when. Day 0 = recall due date. Negative values = days after the recall date.</p>

        <div className="space-y-2">
          {sorted.map((tp, idx) => (
            <div key={tp.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors", tp.enabled ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" : "border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 opacity-60")}>
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{idx + 1}</div>
              <select value={tp.channel} onChange={e => updateTouchPoint(tp.id, { channel: e.target.value as "sms" | "email" | "phone" })}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
              </select>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Day</span>
                <input type="number" value={tp.daysBefore} onChange={e => updateTouchPoint(tp.id, { daysBefore: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <span className="text-xs text-slate-400">{tp.daysBefore === 0 ? "(due date)" : tp.daysBefore > 0 ? `(${tp.daysBefore}d before)` : `(${Math.abs(tp.daysBefore)}d after)`}</span>
              </div>
              <Toggle checked={tp.enabled} onChange={v => updateTouchPoint(tp.id, { enabled: v })} />
              <button onClick={() => removeTouchPoint(tp.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save Recall Preferences
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

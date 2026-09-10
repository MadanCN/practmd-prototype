"use client";

import { useState } from "react";
import { ListOrdered, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export default function WaitlistSettingsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [confirmTime, setConfirmTime] = useState(24);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const stepperClass = cn(
    "w-20 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700",
    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <ListOrdered className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Waitlist Setting</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure the waitlist feature and patient confirmation window.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {/* Enable Waitlist toggle */}
        <div className={cn(
          "flex items-center justify-between px-5 py-4 transition-colors",
          enabled ? "bg-blue-50 dark:bg-blue-950/20" : ""
        )}>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enable Waitlist</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Automatically offer cancelled slots to waitlisted patients</p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>

        {/* Confirmation time — only shown when enabled */}
        {enabled && (
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Patient Confirmation Time (hours)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  After a slot opens up, patients on the waitlist have this long to confirm before the slot is offered to the next patient.
                </p>
              </div>
              <div className="flex items-center gap-2 ml-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmTime(Math.max(1, confirmTime - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={72}
                  step={1}
                  value={confirmTime}
                  onChange={(e) => setConfirmTime(Math.min(72, Math.max(1, Number(e.target.value))))}
                  className={stepperClass}
                />
                <button
                  type="button"
                  onClick={() => setConfirmTime(Math.min(72, confirmTime + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Setting
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

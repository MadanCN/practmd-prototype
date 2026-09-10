"use client";

import { useState } from "react";
import { Clock, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RescheduleSettingsScreen() {
  const [window, setWindow] = useState(48);
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
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reschedule Setting</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control the time window allowed for rescheduling appointments.</p>
        </div>
      </div>

      {/* Setting card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Reschedule Window (hours)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Restricts rescheduling to appointments that occurred within the specified time window.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-6 shrink-0">
            <button
              type="button"
              onClick={() => setWindow(Math.max(1, window - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={168}
              step={1}
              value={window}
              onChange={(e) => setWindow(Math.min(168, Math.max(1, Number(e.target.value))))}
              className={stepperClass}
            />
            <button
              type="button"
              onClick={() => setWindow(Math.min(168, window + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
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

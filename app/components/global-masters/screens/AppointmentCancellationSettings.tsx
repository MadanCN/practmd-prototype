"use client";

import { useState } from "react";
import { Ban, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export default function AppointmentCancellationSettingsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("25.00");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  }

  function handleAmountBlur() {
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      setAmount(num.toFixed(2));
    } else {
      setAmount("0.00");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <Ban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Cancellation Setting</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure the late cancellation fee for appointments.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {/* Enable toggle */}
        <div className={cn(
          "flex items-center justify-between px-5 py-4 transition-colors",
          enabled ? "bg-blue-50 dark:bg-blue-950/20" : ""
        )}>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enable Late Cancellation Fee</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Charge a fee for appointments cancelled within the cancellation policy window</p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>

        {/* Fee amount — only shown when enabled */}
        {enabled && (
          <div className="px-5 py-4 space-y-2">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Late Cancellation Amount ($)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fee charged to patients who cancel within the cancellation policy window.
            </p>
            <div className="relative w-40 mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                className={cn(
                  "w-full pl-7 pr-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                )}
              />
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

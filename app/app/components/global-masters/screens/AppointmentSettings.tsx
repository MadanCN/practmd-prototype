"use client";

import { useState } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export default function AppointmentSettingsScreen() {
  const [checkInBuffer, setCheckInBuffer] = useState(15);
  const [autoEligibility, setAutoEligibility] = useState(true);
  const [noShowWindow, setNoShowWindow] = useState(15);
  const [waitlistConfirmTime, setWaitlistConfirmTime] = useState(24);
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
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure check-in, no-show, and waitlist appointment behavior.</p>
        </div>
      </div>

      {/* Check-In Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Check-In Settings</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Check-In Buffer Time */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Check-In Buffer Time (minutes)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How early before an appointment patients can check in</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCheckInBuffer(Math.max(0, checkInBuffer - 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={60}
                step={5}
                value={checkInBuffer}
                onChange={(e) => setCheckInBuffer(Math.min(60, Math.max(0, Number(e.target.value))))}
                className={stepperClass}
              />
              <button
                type="button"
                onClick={() => setCheckInBuffer(Math.min(60, checkInBuffer + 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Auto Eligibility Check */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Auto Eligibility Check on Check-In</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automatically verify insurance eligibility when a patient checks in</p>
            </div>
            <Toggle
              checked={autoEligibility}
              onChange={setAutoEligibility}
            />
          </div>
        </div>
      </div>

      {/* No Show & Late Cancellation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">No Show &amp; Late Cancellation</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* No Show Time Window */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No Show Time Window (minutes after appointment)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Minutes after the scheduled time before marking as a no-show</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNoShowWindow(Math.max(0, noShowWindow - 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={120}
                step={5}
                value={noShowWindow}
                onChange={(e) => setNoShowWindow(Math.min(120, Math.max(0, Number(e.target.value))))}
                className={stepperClass}
              />
              <button
                type="button"
                onClick={() => setNoShowWindow(Math.min(120, noShowWindow + 5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Waitlist</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Waitlist Confirmation Time */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Waitlist Appointment Confirmation Time (hours)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How long a patient has to confirm a waitlist slot before it is offered to the next patient</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaitlistConfirmTime(Math.max(1, waitlistConfirmTime - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={72}
                step={1}
                value={waitlistConfirmTime}
                onChange={(e) => setWaitlistConfirmTime(Math.min(72, Math.max(1, Number(e.target.value))))}
                className={stepperClass}
              />
              <button
                type="button"
                onClick={() => setWaitlistConfirmTime(Math.min(72, waitlistConfirmTime + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>
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
          Save Settings
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

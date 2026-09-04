"use client";

import { useState } from "react";
import { Clock, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface DaySchedule {
  day: string;
  enabled: boolean;
  from: string;
  to: string;
}

const DEFAULT_HOURS: DaySchedule[] = [
  { day: "Monday", enabled: true, from: "08:00", to: "17:00" },
  { day: "Tuesday", enabled: true, from: "08:00", to: "17:00" },
  { day: "Wednesday", enabled: true, from: "08:00", to: "17:00" },
  { day: "Thursday", enabled: true, from: "08:00", to: "17:00" },
  { day: "Friday", enabled: true, from: "08:00", to: "17:00" },
  { day: "Saturday", enabled: false, from: "09:00", to: "13:00" },
  { day: "Sunday", enabled: false, from: "09:00", to: "13:00" },
];

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BusinessHoursScreen() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  function updateDay(idx: number, changes: Partial<DaySchedule>) {
    setSaved(false);
    setSchedule(prev => prev.map((d, i) => i === idx ? { ...d, ...changes } : d));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function applyToAll(from: string, to: string) {
    setSaved(false);
    setSchedule(prev => prev.map(d => d.enabled ? { ...d, from, to } : d));
  }

  const enabledDays = schedule.filter(d => d.enabled);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Business Hours</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set the operating hours for this organization. These hours drive appointment availability and patient communications.
            </p>
          </div>
        </div>
      </div>

      {/* Apply to all banner */}
      {enabledDays.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm">
          <span className="text-slate-600 dark:text-slate-400 flex-1">Apply same hours to all open days:</span>
          <input
            type="time"
            defaultValue="08:00"
            id="bulk-from"
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="time"
            defaultValue="17:00"
            id="bulk-to"
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              const from = (document.getElementById("bulk-from") as HTMLInputElement).value;
              const to = (document.getElementById("bulk-to") as HTMLInputElement).value;
              applyToAll(from, to);
            }}
            className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Day grid */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Day</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-20">Open</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">From</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">To</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-xs text-slate-400">Duration</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((day, idx) => {
              const fromMins = day.from.split(":").reduce((a, b, i) => a + (i === 0 ? Number(b) * 60 : Number(b)), 0);
              const toMins = day.to.split(":").reduce((a, b, i) => a + (i === 0 ? Number(b) * 60 : Number(b)), 0);
              const dur = toMins - fromMins;
              const durLabel = dur > 0 ? `${Math.floor(dur / 60)}h ${dur % 60 > 0 ? `${dur % 60}m` : ""}`.trim() : "—";

              return (
                <tr
                  key={day.day}
                  className={cn(
                    "border-t border-slate-100 dark:border-slate-800 transition-colors",
                    !day.enabled && "opacity-50"
                  )}
                >
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{day.day}</td>
                  <td className="py-3 px-4 text-center">
                    <Toggle
                      checked={day.enabled}
                      onChange={v => updateDay(idx, { enabled: v })}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="time"
                      value={day.from}
                      disabled={!day.enabled}
                      onChange={e => updateDay(idx, { from: e.target.value })}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    {day.enabled && (
                      <span className="ml-2 text-xs text-slate-400">{fmt12(day.from)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="time"
                      value={day.to}
                      disabled={!day.enabled}
                      onChange={e => updateDay(idx, { to: e.target.value })}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    {day.enabled && (
                      <span className="ml-2 text-xs text-slate-400">{fmt12(day.to)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500">
                    {day.enabled ? durLabel : "Closed"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Business Hours
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

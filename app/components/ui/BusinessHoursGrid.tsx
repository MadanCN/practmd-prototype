"use client";

import type { BusinessHour } from "@/data/clinics";
import { cn } from "@/lib/utils";

interface Props {
  hours: BusinessHour[];
  onChange: (hours: BusinessHour[]) => void;
  compact?: boolean;
  mode?: "clinic" | "provider";
}

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = ((h % 12) || 12).toString();
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const TIME_INPUT_CLS = "w-32 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function BusinessHoursGrid({ hours, onChange, compact = false, mode = "clinic" }: Props) {
  const isProvider = mode === "provider";

  function update(index: number, field: keyof BusinessHour, value: string | boolean) {
    onChange(hours.map((h, i) => i === index ? { ...h, [field]: value } : h));
  }

  const headers = isProvider
    ? ["DAY", "ACTIVE", "START TIME", "END TIME"]
    : ["DAY", "OPEN", "OPEN TIME", "CLOSE TIME", "BREAK START", "BREAK END"];

  const timeFields: (keyof BusinessHour)[] = isProvider
    ? ["openTime", "closeTime"]
    : ["openTime", "closeTime", "breakStart", "breakEnd"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {headers.map(col => (
              <th key={col} className={cn(
                "text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap",
                col === "DAY" ? "w-28" : ""
              )}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {hours.map((h, i) => (
            <tr key={h.day} className={cn(
              "transition-colors",
              h.isOpen ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/20"
            )}>
              <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 w-28">{h.day}</td>
              <td className="py-2.5 px-3">
                <input
                  type="checkbox"
                  checked={h.isOpen}
                  onChange={e => update(i, "isOpen", e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
              </td>
              {timeFields.map(field => (
                <td key={field} className="py-2.5 px-3">
                  {h.isOpen ? (
                    <input
                      type="time"
                      value={h[field] as string}
                      onChange={e => update(i, field, e.target.value)}
                      className={TIME_INPUT_CLS}
                    />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 text-sm italic">
                      {isProvider ? "Off" : "Closed"}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BusinessHoursReadOnly({ hours }: { hours: BusinessHour[] }) {
  const openDays = hours.filter(h => h.isOpen);
  if (openDays.length === 0) return <p className="text-sm text-slate-500">Closed all days</p>;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
      {hours.map(h => (
        <div key={h.day} className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400 w-24">{h.day}</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">
            {h.isOpen ? `${fmt12(h.openTime)} – ${fmt12(h.closeTime)}` : "Closed"}
          </span>
        </div>
      ))}
    </div>
  );
}

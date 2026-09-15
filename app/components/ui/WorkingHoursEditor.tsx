"use client";

import { Plus, X } from "lucide-react";
import { DAYS, type DayName } from "@/data/clinics";
import type { WorkingHour, WorkingHourSegment } from "@/data/providers";
import { cn } from "@/lib/utils";

export interface LocationOption {
  id: string;
  name: string;
}

interface Props {
  hours: WorkingHour[];
  onChange: (hours: WorkingHour[]) => void;
  locations: LocationOption[];
}

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const TIME_CLS = "px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

/** Per-day working-hours editor shared by the admin Add/Edit Provider screen
 *  and the provider portal's "Request Change in Working Hours" flow — one
 *  checkbox per day, and (when working) one or more location + time
 *  segments with an "Add time" affordance, so a provider can split a day
 *  across sites (e.g. a location in the morning, a different one in the
 *  afternoon). A gap between two segments is an implicit break; there's no
 *  separate break field. */
export default function WorkingHoursEditor({ hours, onChange, locations }: Props) {
  const defaultLocation = locations[0]?.id ?? "";

  function dayOf(day: DayName): WorkingHour {
    return hours.find((h) => h.day === day) ?? { day, isWorking: false, segments: [] };
  }
  function updateDay(day: DayName, next: WorkingHour) {
    onChange(DAYS.map((d) => (d === day ? next : dayOf(d))));
  }

  function toggleWorking(day: DayName, isWorking: boolean) {
    const h = dayOf(day);
    updateDay(day, {
      day, isWorking,
      segments: isWorking ? (h.segments.length ? h.segments : [{ locationId: defaultLocation, startTime: "09:00", endTime: "17:00" }]) : [],
    });
  }
  function updateSegment(day: DayName, idx: number, changes: Partial<WorkingHourSegment>) {
    const h = dayOf(day);
    updateDay(day, { ...h, segments: h.segments.map((s, i) => (i === idx ? { ...s, ...changes } : s)) });
  }
  function addSegment(day: DayName) {
    const h = dayOf(day);
    const last = h.segments[h.segments.length - 1];
    updateDay(day, { ...h, segments: [...h.segments, { locationId: last?.locationId ?? defaultLocation, startTime: last?.endTime ?? "09:00", endTime: "17:00" }] });
  }
  function removeSegment(day: DayName, idx: number) {
    const h = dayOf(day);
    updateDay(day, { ...h, segments: h.segments.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const h = dayOf(day);
        return (
          <div key={day} className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="w-28 flex items-center gap-2 pt-1 flex-shrink-0">
              <input type="checkbox" checked={h.isWorking}
                onChange={(e) => toggleWorking(day, e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer" />
              <span className={cn("text-sm font-medium", h.isWorking ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>{day.slice(0, 3)}</span>
            </div>
            {h.isWorking ? (
              <div className="flex-1 space-y-1.5">
                {h.segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <select value={seg.locationId} onChange={(e) => updateSegment(day, i, { locationId: e.target.value })} className={TIME_CLS}>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="time" value={seg.startTime} onChange={(e) => updateSegment(day, i, { startTime: e.target.value })} className={TIME_CLS} />
                    <span className="text-slate-400 text-sm">–</span>
                    <input type="time" value={seg.endTime} onChange={(e) => updateSegment(day, i, { endTime: e.target.value })} className={TIME_CLS} />
                    {h.segments.length > 1 && (
                      <button type="button" onClick={() => removeSegment(day, i)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addSegment(day)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5">
                  <Plus className="w-3 h-3" /> Add time
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 pt-2">Off</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WorkingHoursReadOnly({ hours, locations }: { hours: WorkingHour[]; locations: LocationOption[] }) {
  const nameOf = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  if (!hours.some((h) => h.isWorking)) return <p className="text-sm text-slate-500">Not scheduled any day</p>;
  return (
    <div className="space-y-2.5 text-sm">
      {hours.map((h) => (
        <div key={h.day} className="flex items-start justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 pt-0.5">{h.day}</span>
          {h.isWorking && h.segments.length > 0 ? (
            <div className="flex-1 text-right space-y-0.5">
              {h.segments.map((s, i) => (
                <p key={i} className="text-slate-800 dark:text-slate-200 font-medium">
                  {fmt12(s.startTime)} – {fmt12(s.endTime)} <span className="text-slate-400 font-normal">· {nameOf(s.locationId)}</span>
                </p>
              ))}
            </div>
          ) : (
            <span className="text-slate-400 pt-0.5">Off</span>
          )}
        </div>
      ))}
    </div>
  );
}

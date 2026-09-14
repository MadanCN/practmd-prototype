"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Provider } from "@/data/providers";
import { getAvailableDates } from "@/lib/cc-availability";
import { todayIso } from "@/lib/cc-date-format";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Local calendar-date components, not a UTC round-trip: toISOString() on a
// local-midnight Date shifts the ISO date back a day in any positive-UTC-
// offset timezone (e.g. a grid cell showing "15" would report iso "…-14")
// — this grid is inherently a local-calendar-day concept, so it must read
// getFullYear/getMonth/getDate, never go through UTC.
function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday-start 6-row grid covering `month`, matching the CC calendar's own week convention. */
function buildMonthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0=Monday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

interface Props {
  provider: Provider | undefined;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Which month to open on — defaults to the selected date's month, or today's. */
  initialMonth?: string;
}

export default function MiniAvailabilityCalendar({ provider, selectedDate, onSelectDate, initialMonth }: Props) {
  const anchor = initialMonth || selectedDate || todayIso();
  const [month, setMonth] = useState(() => new Date(anchor + "T12:00:00"));

  const availableDates = useMemo(() => getAvailableDates(provider, 60), [provider]);
  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const today = todayIso();
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  const canGoBack = new Date(month.getFullYear(), month.getMonth(), 1) > new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => shiftMonth(-1)} disabled={!canGoBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{monthLabel}</p>
        <button type="button" onClick={() => shiftMonth(1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const iso = isoOf(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isPast = iso < today;
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const isAvailable = availableDates.has(iso);
          const disabled = isPast || !isAvailable || !inMonth;

          return (
            <button key={iso} type="button" disabled={disabled} onClick={() => onSelectDate(iso)}
              title={!inMonth ? undefined : isPast ? "Past date" : isAvailable ? undefined : "No availability"}
              className={cn(
                "relative aspect-square rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center gap-0.5",
                !inMonth && "invisible",
                disabled && inMonth && "text-slate-300 dark:text-slate-700 cursor-not-allowed",
                !disabled && !isSelected && "text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/30 cursor-pointer",
                isSelected && "bg-brand-600 text-white",
                isToday && !isSelected && "ring-1 ring-inset ring-brand-400",
              )}>
              {d.getDate()}
              {isAvailable && !isPast && (
                <span className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-brand-500")} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" /> Has openings</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-1 ring-inset ring-brand-400 inline-block" /> Today</span>
      </div>
    </div>
  );
}

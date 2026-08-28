"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import { PROVIDER_LEAVE_REQUESTS } from "@/data/provider-leaves";
import { useProviderAvailabilityStore } from "@/lib/provider-availability-store";
import { DAYS } from "@/data/clinics";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")}${h >= 12 ? "p" : "a"}`;
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DayKind = "leave" | "leave-pending" | "blocked" | "working" | "off";

export function AvailabilityCalendar() {
  const provider = PROVIDERS.find((p) => p.id === CURRENT_PROVIDER_ID)!;
  const store = useProviderAvailabilityStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const leaveRanges = useMemo(() => {
    const ranges: { start: string; end: string; pending: boolean }[] = [];
    for (const r of PROVIDER_LEAVE_REQUESTS) {
      if (r.providerId !== CURRENT_PROVIDER_ID || r.status === "rejected") continue;
      ranges.push({ start: r.startDate, end: r.endDate, pending: r.status === "pending" });
    }
    for (const r of store.requests) {
      if (r.providerId !== CURRENT_PROVIDER_ID || r.type !== "leave" || r.status === "rejected") continue;
      if (r.startDateTime && r.endDateTime) {
        ranges.push({ start: r.startDateTime.split("T")[0], end: r.endDateTime.split("T")[0], pending: r.status === "pending" });
      }
    }
    return ranges;
  }, [store.requests]);

  const blockDates = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of store.requests) {
      if (r.providerId !== CURRENT_PROVIDER_ID || r.type !== "block-time" || r.status === "rejected") continue;
      if (r.blockDate) m.set(r.blockDate, `${fmt12(r.blockStart ?? "")}–${fmt12(r.blockEnd ?? "")}`);
    }
    return m;
  }, [store.requests]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = (cursor.getDay() + 6) % 7; // Mon-start
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const todayYmd = ymd(new Date());

  const cells: ({ date: Date; kind: DayKind; hours?: string; block?: string; isToday: boolean } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    const key = ymd(date);
    const wd = DAYS[(date.getDay() + 6) % 7];
    const wh = provider.workingHours.find((w) => w.day === wd);
    const isOpen = wh?.isOpen ?? false;

    const leave = leaveRanges.find((r) => key >= r.start && key <= r.end);
    const block = blockDates.get(key);

    let kind: DayKind;
    if (leave) kind = leave.pending ? "leave-pending" : "leave";
    else if (block) kind = "blocked";
    else if (isOpen) kind = "working";
    else kind = "off";

    cells.push({
      date,
      kind,
      hours: isOpen && wh ? `${fmt12(wh.openTime!)}–${fmt12(wh.closeTime!)}` : undefined,
      block,
      isToday: key === todayYmd,
    });
  }

  const KIND_CFG: Record<DayKind, string> = {
    leave: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
    "leave-pending": "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 border-dashed",
    blocked: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
    working: "bg-brand-50/60 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900",
    off: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">This month</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => (
            <div key={i} className={cn("aspect-square rounded-lg border p-1.5 flex flex-col", cell ? KIND_CFG[cell.kind] : "border-transparent")}>
              {cell && (
                <>
                  <span className={cn("text-xs font-semibold", cell.isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-600 dark:text-slate-300")}>
                    {cell.date.getDate()}
                  </span>
                  <span className="mt-auto text-[8px] leading-tight text-slate-500 dark:text-slate-400 truncate">
                    {cell.kind === "leave" ? "Leave" : cell.kind === "leave-pending" ? "Leave (pending)" : cell.kind === "blocked" ? cell.block : cell.kind === "working" ? cell.hours : "Off"}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
          {[
            { l: "Working day", c: "bg-brand-200 dark:bg-brand-900" },
            { l: "Off", c: "bg-slate-200 dark:bg-slate-700" },
            { l: "Approved leave", c: "bg-rose-200 dark:bg-rose-900" },
            { l: "Pending leave", c: "bg-amber-300 dark:bg-amber-800" },
            { l: "Blocked time", c: "bg-amber-200 dark:bg-amber-900" },
          ].map((x) => (
            <span key={x.l} className="flex items-center gap-1.5"><span className={cn("w-2.5 h-2.5 rounded-sm", x.c)} />{x.l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

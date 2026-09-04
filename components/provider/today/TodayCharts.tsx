"use client";

// Hand-rolled SVG visuals for the Today dashboard — no chart library.

import { cn } from "@/lib/utils";

export function WeekBars({ data }: { data: { label: string; value: number; today?: boolean }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex-1 flex items-end">
            <div
              className={cn("w-full rounded-t-md transition-all", d.today ? "bg-brand-500" : "bg-brand-200 dark:bg-brand-900/60")}
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.value} appointments`}
            />
          </div>
          <span className={cn("text-[10px] font-medium", d.today ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>{d.label}</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 -mt-1">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SignedDonut({ signed, pending }: { signed: number; pending: number }) {
  const total = signed + pending;
  const pct = total === 0 ? 1 : signed / total;
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90 shrink-0">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="10" className="stroke-amber-200 dark:stroke-amber-950/60" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          className="stroke-emerald-500"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total === 0 ? "100%" : `${Math.round(pct * 100)}%`}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">notes signed</p>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{pending} awaiting signature</p>
      </div>
    </div>
  );
}

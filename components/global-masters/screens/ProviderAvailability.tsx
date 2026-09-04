"use client";

import { CalendarClock } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import {
  useProviderAvailabilityStore, updateToggle, APPROVAL_TARGETS, type ToggleConfig,
} from "@/lib/provider-availability-store";
import { cn } from "@/lib/utils";

const SECTIONS: { key: "leave" | "blockTime" | "hoursChange"; title: string; allowLabel: string; allowDesc: string }[] = [
  { key: "leave", title: "Leave Requests", allowLabel: "Allow providers to apply for leave", allowDesc: "Providers can submit a from/to date-time leave request with a reason from My Availability." },
  { key: "blockTime", title: "Block Time", allowLabel: "Allow providers to block time", allowDesc: "Providers can block a window on a specific date (e.g. admin time, CME) directly on their own schedule." },
  { key: "hoursChange", title: "Working Hours Change Requests", allowLabel: "Allow providers to request working hours changes", allowDesc: "Providers can propose new weekly working hours (and breaks) for admin review." },
];

function Section({ title, allowLabel, allowDesc, cfg, onChange }: {
  title: string; allowLabel: string; allowDesc: string; cfg: ToggleConfig; onChange: (changes: Partial<ToggleConfig>) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="pr-4">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{allowLabel}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{allowDesc}</p>
          </div>
          <Toggle checked={cfg.allow} onChange={(v) => onChange({ allow: v, ...(v ? {} : { approvalRequired: false }) })} />
        </div>

        {cfg.allow && (
          <div className={cn("flex items-center justify-between px-5 py-4")}>
            <div className="pr-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable approval process</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">When on, requests need approval before taking effect. When off, they&apos;re applied immediately.</p>
            </div>
            <Toggle checked={cfg.approvalRequired} onChange={(v) => onChange({ approvalRequired: v })} />
          </div>
        )}

        {cfg.allow && cfg.approvalRequired && (
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval target</label>
            <select value={cfg.approvalTarget ?? ""} onChange={(e) => onChange({ approvalTarget: e.target.value || null })}
              className="w-full max-w-sm px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select who approves these requests…</option>
              {APPROVAL_TARGETS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderAvailabilityScreen() {
  const store = useProviderAvailabilityStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Provider Availability</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control what providers can request against their own schedule, and whether it needs approval.</p>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <Section key={s.key} title={s.title} allowLabel={s.allowLabel} allowDesc={s.allowDesc}
          cfg={store[s.key]} onChange={(changes) => updateToggle(s.key, changes)} />
      ))}
    </div>
  );
}

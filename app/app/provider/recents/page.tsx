"use client";

import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { Clock, User, FileCheck2, MessageSquare, CalendarDays, CheckSquare, Trash2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecents, getRecents, clearRecents, type RecentKind } from "@/lib/provider-recents";
import { useProviderSession } from "@/lib/provider-session";
import { getPanelPatientIds } from "@/lib/provider-panel";

const CFG: Record<RecentKind, { icon: React.ElementType; cls: string }> = {
  patient: { icon: User, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  note: { icon: FileCheck2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  appointment: { icon: CalendarDays, cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" },
  thread: { icon: MessageSquare, cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  task: { icon: CheckSquare, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function bucket(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Earlier this week";
  return "Older";
}

export default function ProviderRecentsPage() {
  useRecents();
  const session = useProviderSession();
  const entries = getRecents();
  const panel = getPanelPatientIds(session.provider.id);

  const groups = ["Today", "Yesterday", "Earlier this week", "Older"].map((g) => ({
    g, items: entries.filter((e) => bucket(e.at) === g),
  })).filter((x) => x.items.length);

  return (
    <ProviderLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recents</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Records you&apos;ve opened — most recent first. Yours alone.</p>
            </div>
          </div>
          {entries.length > 0 && (
            <button onClick={clearRecents} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-12 text-center text-sm text-slate-400">
            Nothing opened yet — records you visit will appear here.
          </div>
        ) : (
          <div className="space-y-5" data-tour="recents-list">
            {groups.map(({ g, items }) => (
              <div key={g}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{g}</p>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
                  {items.map((e) => {
                    const cfg = CFG[e.kind];
                    const Icon = cfg.icon;
                    const unavailable = e.kind === "patient" && !panel.has(e.refId) && !session.capabilities.can_view_all_patients;
                    const inner = (
                      <div className={cn("flex items-center gap-3.5 px-4 py-3.5", !unavailable && "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", unavailable ? "bg-slate-100 text-slate-400 dark:bg-slate-800" : cfg.cls)}>
                          {unavailable ? <Ban className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", unavailable ? "text-slate-400" : "text-slate-800 dark:text-slate-200")}>{e.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{unavailable ? "No longer available to you" : e.subtitle ?? e.kind}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(e.at)}</span>
                      </div>
                    );
                    return unavailable ? <div key={`${e.kind}-${e.refId}`}>{inner}</div> : <Link key={`${e.kind}-${e.refId}`} href={e.href}>{inner}</Link>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}

"use client";

import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import {
  Clock, User, FileCheck2, MessageSquare, CheckSquare, CalendarDays, FlaskConical, Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

type ActivityType = "chart" | "note" | "message" | "task" | "appointment" | "result" | "refill";

interface RecentActivity {
  id: string;
  type: ActivityType;
  label: string;
  detail: string;
  href: string;
  timestamp: string;
}

const TYPE_CFG: Record<ActivityType, { icon: React.ElementType; cls: string }> = {
  chart: { icon: User, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  note: { icon: FileCheck2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  message: { icon: MessageSquare, cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  task: { icon: CheckSquare, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400" },
  appointment: { icon: CalendarDays, cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" },
  result: { icon: FlaskConical, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  refill: { icon: Pill, cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" },
};

const RECENT_ACTIVITY: RecentActivity[] = [
  { id: "r1", type: "note", label: "Signed a progress note", detail: "Elena Vasquez — Medication Check", href: "/provider/encounter-notes", timestamp: hoursAgo(0.5) },
  { id: "r2", type: "message", label: "Replied to a patient message", detail: "James Holloway — Nausea after starting Sertraline", href: "/provider/messages/patients?thread=msg01", timestamp: hoursAgo(1) },
  { id: "r3", type: "chart", label: "Viewed patient chart", detail: "Daniel Carter", href: "/provider/patients?q=Daniel%20Carter", timestamp: hoursAgo(1.5) },
  { id: "r4", type: "result", label: "Reviewed a lab result", detail: "Carmen Rivera — TSH Panel", href: "/provider/results?result=res04", timestamp: hoursAgo(3) },
  { id: "r5", type: "task", label: "Completed a task", detail: "Sign discharge summary — Carmen Rivera", href: "/provider/tasks?task=task06", timestamp: hoursAgo(5) },
  { id: "r6", type: "appointment", label: "Joined a telehealth visit", detail: "Carmen Rivera — Follow-Up", href: "/provider/appointments/list", timestamp: hoursAgo(6) },
  { id: "r7", type: "refill", label: "Approved a refill request", detail: "James Holloway — Sertraline 50mg", href: "/provider/refills", timestamp: hoursAgo(24) },
  { id: "r8", type: "chart", label: "Viewed patient chart", detail: "Robert Flynn", href: "/provider/patients?q=Robert%20Flynn", timestamp: hoursAgo(27) },
  { id: "r9", type: "note", label: "Signed a progress note", detail: "Robert Flynn — Follow-Up", href: "/provider/encounter-notes", timestamp: hoursAgo(30) },
  { id: "r10", type: "message", label: "Sent a message", detail: "Hannah Reyes — re: chart co-signature", href: "/provider/messages/internal?thread=msg04", timestamp: hoursAgo(48) },
];

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function ProviderRecentsPage() {
  return (
    <ProviderLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recents</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your recent activity — jump straight back to where you left off</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60" data-tour="recents-list">
          {RECENT_ACTIVITY.map((a) => {
            const cfg = TYPE_CFG[a.type];
            const Icon = cfg.icon;
            return (
              <Link key={a.id} href={a.href} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.cls)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(a.timestamp)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </ProviderLayout>
  );
}

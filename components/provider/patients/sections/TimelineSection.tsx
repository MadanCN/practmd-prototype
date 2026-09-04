"use client";

import { useMemo, useState } from "react";
import {
  UserPlus, Eye, CalendarDays, NotebookPen, ClipboardList, MessageSquare,
  ShieldCheck, StickyNote, FileText, ContactRound, Settings, Mail, History,
} from "lucide-react";
import { TIMELINE_BY_ID, type TimelineCategory } from "@/data/provider-patient-activity";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";

const CAT: Record<TimelineCategory, { icon: React.ElementType; cls: string; label: string }> = {
  signup: { icon: UserPlus, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400", label: "Sign-up" },
  view: { icon: Eye, cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", label: "Chart access" },
  appointment: { icon: CalendarDays, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", label: "Appointment" },
  note: { icon: NotebookPen, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", label: "Encounter note" },
  form: { icon: ClipboardList, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400", label: "Form" },
  message: { icon: MessageSquare, cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400", label: "Message" },
  insurance: { icon: ShieldCheck, cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400", label: "Insurance" },
  comment: { icon: StickyNote, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", label: "Care comment" },
  document: { icon: FileText, cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", label: "Document" },
  phr: { icon: ContactRound, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400", label: "PHR" },
  admin: { icon: Settings, cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", label: "Admin" },
  email: { icon: Mail, cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400", label: "Email" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function TimelineSection({ patient }: { patient: PatientProfile }) {
  const events = useMemo(() => TIMELINE_BY_ID[patient.id] ?? [], [patient.id]);
  const [cat, setCat] = useState<"all" | TimelineCategory>("all");

  const present = useMemo(() => {
    const set = new Set(events.map((e) => e.category));
    return (Object.keys(CAT) as TimelineCategory[]).filter((c) => set.has(c));
  }, [events]);

  const rows = cat === "all" ? events : events.filter((e) => e.category === cat);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <History className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <button onClick={() => setCat("all")} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", cat === "all" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>All</button>
        {present.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", cat === c ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            {CAT[c].label}
          </button>
        ))}
      </div>

      <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-5">
        {rows.map((e) => {
          const c = CAT[e.category];
          const Icon = c.icon;
          return (
            <li key={e.id} className="ml-6">
              <span className={cn("absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-950", c.cls)}>
                <Icon className="w-3 h-3" />
              </span>
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{e.action}</p>
                {e.detail && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.detail}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{e.actor} · {e.actorRole} · {fmt(e.at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

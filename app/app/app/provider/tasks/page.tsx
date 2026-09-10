"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Check, ClipboardCheck, ShieldQuestion, PhoneCall, FlaskConical, FileCog, Clock } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDER_TASKS, type ProviderTask, type TaskType } from "@/data/provider-today";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { cn } from "@/lib/utils";

const TYPE_CFG: Record<TaskType, { label: string; icon: React.ElementType; cls: string }> = {
  "chart-review": { label: "Chart Review", icon: ClipboardCheck, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  "prior-auth": { label: "Prior Auth", icon: ShieldQuestion, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400" },
  callback: { label: "Callback", icon: PhoneCall, cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" },
  "lab-followup": { label: "Lab Follow-up", icon: FlaskConical, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  admin: { label: "Admin", icon: FileCog, cls: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const PRIORITY_CFG = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function ProviderTasksPage() {
  const [tasks, setTasks] = useState<ProviderTask[]>(PROVIDER_TASKS);
  const [tab, setTab] = useState<"open" | "done">("open");
  const { highlightId, setRef } = useQueryHighlight("task");

  function complete(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
  }

  const filtered = tasks.filter((t) => t.status === tab).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chart reviews, prior auths, callbacks, and follow-ups assigned to you</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4" data-tour="tasks-filters">
          <button onClick={() => setTab("open")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "open" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Open {openCount > 0 && `(${openCount})`}
          </button>
          <button onClick={() => setTab("done")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "done" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Completed
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60" data-tour="tasks-list">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">{tab === "open" ? "No open tasks." : "No completed tasks yet."}</div>
          )}
          {filtered.map((t) => {
            const cfg = TYPE_CFG[t.type];
            const Icon = cfg.icon;
            return (
              <div key={t.id} ref={setRef<HTMLDivElement>(t.id)}
                className={cn("flex items-start gap-4 px-4 py-4 transition-colors", highlightId === t.id && "bg-brand-50 dark:bg-brand-950/20")}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.cls)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", cfg.cls)}>{cfg.label}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", PRIORITY_CFG[t.priority])}>{t.priority}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className={cn("flex items-center gap-1", t.overdue && "text-red-500 font-medium")}>
                      <Clock className="w-3 h-3" /> {t.dueLabel}
                    </span>
                    {t.patientId && (
                      <Link href={`/provider/patients?q=${encodeURIComponent(t.patientName ?? "")}`} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
                        {t.patientName}
                      </Link>
                    )}
                  </div>
                </div>
                {tab === "open" ? (
                  <button onClick={() => complete(t.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Mark complete
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Done</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ProviderLayout>
  );
}

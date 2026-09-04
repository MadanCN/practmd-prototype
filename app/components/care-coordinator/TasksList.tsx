"use client";

import { useMemo, useState } from "react";
import { CheckSquare, UserPlus, CalendarPlus, Check, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore, completeTask } from "@/lib/onboarding-store";

const TYPE_CONFIG = {
  "onboarding-prep": { label: "Onboarding Prep", icon: UserPlus, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  "book-appointment": { label: "Book Appointment", icon: CalendarPlus, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

export default function TasksList() {
  const store = useOnboardingStore();
  const [tab, setTab] = useState<"open" | "done">("open");

  const tasks = useMemo(
    () => store.tasks.filter((t) => t.status === tab).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [store.tasks, tab]
  );

  const openCount = store.tasks.filter((t) => t.status === "open").length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center shrink-0">
          <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Onboarding follow-ups and booking prompts assigned to you</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTab("open")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "open" ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
          Open {openCount > 0 && `(${openCount})`}
        </button>
        <button onClick={() => setTab("done")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "done" ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
          Completed
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
        {tasks.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            {tab === "open" ? "No open tasks." : "No completed tasks yet."}
          </div>
        )}
        {tasks.map((t) => {
          const cfg = TYPE_CONFIG[t.type];
          const Icon = cfg.icon;
          return (
            <div key={t.id} className="flex items-start gap-4 px-4 py-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", cfg.color)}>{cfg.label}</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.detail}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> {new Date(t.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · Assigned to {t.assignee}
                </p>
              </div>
              {tab === "open" ? (
                <button onClick={() => completeTask(t.id)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 transition-colors">
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
  );
}

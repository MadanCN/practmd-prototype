"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Check } from "lucide-react";
import { PROVIDER_TASKS, type ProviderTask, type TaskType } from "@/data/provider-today";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<TaskType, string> = {
  "chart-review": "Chart Review",
  "prior-auth": "Prior Auth",
  callback: "Callback",
  "lab-followup": "Lab Follow-up",
  admin: "Admin",
};

const PRIORITY_CFG: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function TasksSection({ patient }: { patient: PatientProfile }) {
  const patientTasks = useMemo(
    () => PROVIDER_TASKS.filter((t) => t.patientId === patient.id),
    [patient.id],
  );
  const [tasks, setTasks] = useState<ProviderTask[]>(patientTasks);
  const [tab, setTab] = useState<"open" | "done">("open");

  const rows = tasks
    .filter((t) => t.status === tab)
    .sort((a, b) => (a.overdue ? -1 : 0) - (b.overdue ? -1 : 0));
  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {(["open", "done"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
            )}
          >
            {t} {t === "open" && <span className="text-xs opacity-80">{openCount}</span>}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No {tab} tasks for {patient.firstName}.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((t) => (
            <div key={t.id} className="flex items-start gap-3 px-4 py-3.5">
              <button
                onClick={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: x.status === "open" ? "done" : "open" } : x)))}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  t.status === "done" ? "bg-brand-600 border-brand-600" : "border-slate-300 dark:border-slate-600 hover:border-brand-500",
                )}
              >
                {t.status === "done" && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", t.status === "done" ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200")}>{t.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{TYPE_LABEL[t.type]}</span>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", PRIORITY_CFG[t.priority])}>{t.priority}</span>
                  <span className={cn("text-[10px]", t.overdue ? "text-red-500 font-semibold" : "text-slate-400")}>{t.dueLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

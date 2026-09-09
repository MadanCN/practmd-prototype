"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, Check, Clock, Undo2, RotateCcw } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import {
  useProviderTasks, getTasks, completeTask, reopenTask, slaRemaining,
  TASK_KIND_LABEL, type ProviderTaskItem,
} from "@/lib/provider-tasks-store";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { cn } from "@/lib/utils";

type Lane = "mine" | "queues" | "rejections";

const KIND_CLS: Record<string, string> = {
  "sign-note": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "cosign-note": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "note-returned": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "unsigned-escalation": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  "credential-expiring": "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "coordinator-query": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  "follow-up-booking": "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400",
};

function TasksInner() {
  useProviderTasks();
  const all = getTasks();
  const [lane, setLane] = useState<Lane>("mine");
  const { highlightId, setRef } = useQueryHighlight("task");

  const lanes: { id: Lane; label: string; count: number }[] = [
    { id: "mine", label: "My tasks", count: all.filter((t) => t.lane === "mine" && t.status === "open").length },
    { id: "queues", label: "Queues", count: all.filter((t) => t.lane === "queue" && t.status === "open").length },
    { id: "rejections", label: "Rejections", count: all.filter((t) => t.status === "rejected").length },
  ];

  const rows = useMemo(() => {
    const list = lane === "rejections"
      ? all.filter((t) => t.status === "rejected")
      : all.filter((t) => t.lane === (lane === "mine" ? "mine" : "queue") && t.status !== "rejected");
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [all, lane]);

  return (
    <ProviderLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Assigned to you individually — never pulled from a shared pool. Completing the underlying action auto-closes the task.</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4" data-tour="tasks-filters">
          {lanes.map((l) => (
            <button key={l.id} onClick={() => setLane(l.id)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", lane === l.id ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
              {l.label} {l.count > 0 && `(${l.count})`}
            </button>
          ))}
        </div>

        {lane === "rejections" && (
          <p className="mb-3 text-xs text-slate-400">A task sent back is work already attempted once — the easiest of all to lose. Revise and it re-enters your queue.</p>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60" data-tour="tasks-list">
          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              {lane === "mine" ? "No open tasks." : lane === "queues" ? "Nothing distributed to you." : "No rejected tasks."}
            </div>
          )}
          {rows.map((t) => <TaskRow key={t.id} t={t} highlight={highlightId === t.id} setRef={setRef} />)}
        </div>
      </div>
    </ProviderLayout>
  );
}

function TaskRow({ t, highlight, setRef }: { t: ProviderTaskItem; highlight: boolean; setRef: <T extends HTMLElement>(id: string) => (el: T | null) => void }) {
  const sla = slaRemaining(t.dueAt);
  return (
    <div ref={setRef<HTMLDivElement>(t.id)} className={cn("flex items-start gap-4 px-4 py-4 transition-colors", highlight && "bg-brand-50 dark:bg-brand-950/20")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", KIND_CLS[t.kind] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
            {TASK_KIND_LABEL[t.kind]}
          </span>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.detail}</p>
        {t.rejectionReason && <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">Returned: {t.rejectionReason}</p>}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
          {t.status === "open" && (
            <span className={cn("flex items-center gap-1", sla.overdue && "text-red-500 font-medium")}>
              <Clock className="w-3 h-3" /> {sla.label}
            </span>
          )}
          {t.patientName && (
            <Link href={t.patientId ? `/provider/patients/${t.patientId}` : "#"} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              {t.patientName}
            </Link>
          )}
          {t.actionHref && <Link href={t.actionHref} className="text-brand-600 dark:text-brand-400 hover:underline">Open →</Link>}
        </div>
      </div>
      {t.status === "open" ? (
        <button onClick={() => completeTask(t.id)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 transition-colors">
          <Check className="w-3.5 h-3.5" /> Mark done
        </button>
      ) : t.status === "rejected" ? (
        <button onClick={() => reopenTask(t.id)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <RotateCcw className="w-3.5 h-3.5" /> Retry
        </button>
      ) : (
        <span className="shrink-0 text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Done</span>
      )}
    </div>
  );
}

export default function ProviderTasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksInner />
    </Suspense>
  );
}

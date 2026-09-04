"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NotebookPen, Plus, ChevronRight, FileCheck2, FileClock } from "lucide-react";
import type { PatientProfile } from "@/data/provider-patients";
import { useEncounterNotes, getNotesForPatient } from "@/lib/encounter-notes-store";
import { NewEncounterModal } from "../../encounters/NewEncounterModal";
import { cn } from "@/lib/utils";
import { fmtShortDate } from "./shared";

type Filter = "all" | "unsigned" | "signed";

export function EncountersSection({ patient }: { patient: PatientProfile }) {
  useEncounterNotes();
  const notes = getNotesForPatient(patient.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [range, setRange] = useState<"any" | "30" | "90" | "365">("any");
  const [creating, setCreating] = useState(false);
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => {
    const cutoff = range === "any" ? null : now - Number(range) * 86400000;
    return notes.filter((n) => {
      if (filter === "unsigned" && n.status === "signed") return false;
      if (filter === "signed" && n.status !== "signed") return false;
      if (cutoff && new Date(n.date + "T12:00:00").getTime() < cutoff) return false;
      return true;
    });
  }, [notes, filter, range, now]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          {(["all", "unsigned", "signed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors", filter === f ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>
              {f}
            </button>
          ))}
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
          <option value="any">All dates</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
        <button onClick={() => setCreating(true)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
          <Plus className="w-3.5 h-3.5" /> New Encounter
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <NotebookPen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No encounter notes match this filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((n) => (
            <Link key={n.id} href={`/provider/encounters/${n.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                n.status === "signed" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400")}>
                {n.status === "signed" ? <FileCheck2 className="w-4 h-4" /> : <FileClock className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.noteType} — {n.visitType}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {fmtShortDate(n.date)} · {n.providerName}{n.signedBy.length > 1 ? ` · co-signed by ${n.signedBy.slice(1).join(", ")}` : ""}
                </p>
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0",
                n.status === "signed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : n.status === "pending-cosign" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                {n.status === "pending-cosign" ? "Co-sign" : n.status}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {creating && <NewEncounterModal patientId={patient.id} patientName={patient.displayName} onClose={() => setCreating(false)} />}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search, NotebookPen, FileCheck2, ChevronRight } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { useEncounterNotes, getAllNotes, NOTE_TYPES, type NoteType } from "@/lib/encounter-notes-store";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { visitColor } from "@/lib/visit-types";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysSince(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  "pending-cosign": { label: "Awaiting co-sign", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  signed: { label: "Signed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

export default function ProviderEncounterNotesPage() {
  useEncounterNotes();
  const notes = getAllNotes();
  const [tab, setTab] = useState<"pending" | "historical">("pending");
  const [typeFilter, setTypeFilter] = useState<NoteType | "all">("all");
  const [query, setQuery] = useState("");
  const { highlightId, setRef } = useQueryHighlight("note");

  const rows = useMemo(() => {
    return notes
      .filter((n) => (tab === "pending" ? n.status !== "signed" : n.status === "signed"))
      .filter((n) => (typeFilter === "all" ? true : n.noteType === typeFilter))
      .filter((n) => (query.trim() ? n.patientName.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) =>
        tab === "pending"
          ? daysSince(b.date) - daysSince(a.date)
          : (b.signedAt ?? b.date).localeCompare(a.signedAt ?? a.date));
  }, [notes, tab, typeFilter, query]);

  const pendingCount = notes.filter((n) => n.status !== "signed").length;

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6" data-tour="notes-header">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Encounter Notes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Clinical documentation for your visits — an unsigned note is unbilled revenue.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4" data-tour="notes-tabs">
          <button onClick={() => setTab("pending")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "pending" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button onClick={() => setTab("historical")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "historical" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Signed
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as NoteType | "all")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <option value="all">All note types</option>
            {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto" data-tour="notes-table">
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              {tab === "pending" ? "No notes are waiting on you — nice work." : "No signed notes match these filters."}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5">Visit type</th>
                  <th className="px-4 py-2.5">Note type</th>
                  <th className="px-4 py-2.5">Date of service</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">{tab === "pending" ? "Age" : "Signed"}</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {rows.map((n) => {
                  const st = STATUS_CFG[n.status];
                  const age = daysSince(n.date);
                  return (
                    <tr key={n.id} ref={setRef<HTMLTableRowElement>(n.id)}
                      className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", highlightId === n.id && "bg-brand-50 dark:bg-brand-950/20")}>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{n.patientName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visitColor(n.visitType) }} />{n.visitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{n.noteType}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(n.date)}</td>
                      <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>{st.label}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tab === "pending" ? (
                          <span className={cn("text-xs font-medium", age > 7 ? "text-red-600 dark:text-red-400" : age > 2 ? "text-amber-600 dark:text-amber-400" : "text-slate-400")}>
                            {age === 0 ? "Today" : `${age}d`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{n.signedAt ? fmtDate(n.signedAt) : "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/provider/encounters/${n.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                          {n.status === "signed" ? <><FileCheck2 className="w-3.5 h-3.5" /> View</> : <><NotebookPen className="w-3.5 h-3.5" /> Open</>}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}

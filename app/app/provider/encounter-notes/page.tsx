"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Search, NotebookPen, FileCheck2, ChevronRight, Users, Undo2 } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { useEncounterNotes, getAllNotes, getNotesToCoSign, type EncounterNoteDoc } from "@/lib/encounter-notes-store";
import { syncUnsignedNoteEscalations } from "@/lib/provider-tasks-store";
import { useProviderSession } from "@/lib/provider-session";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { visitColor, visitTypeDef } from "@/lib/visit-types";
import { templateLabel } from "@/lib/note-templates";
import { cn } from "@/lib/utils";

type FilterId = "unsigned" | "awaiting-cosign" | "to-cosign" | "returned" | "signed" | "all";

function fmtDate(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysSince(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function unbilledValue(n: EncounterNoteDoc): { label: string; exact: boolean } | null {
  if (n.procedures.length && n.diagnoses.length) {
    const total = n.procedures.reduce((s, p) => s + (parseFloat(p.charge) || 0) * (parseFloat(p.quantity) || 1), 0);
    if (total > 0) return { label: `$${total.toFixed(0)}`, exact: true };
  }
  const vt = visitTypeDef(n.visitType);
  if (vt.typicalCharge) return { label: `~$${vt.typicalCharge}`, exact: false };
  return null;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  returned: { label: "Returned", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  "pending-cosign": { label: "Awaiting co-sign", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  signed: { label: "Signed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

function EncounterNotesInner() {
  useEncounterNotes();
  const session = useProviderSession();
  const params = useSearchParams();
  const notes = getAllNotes();
  const { highlightId, setRef } = useQueryHighlight("note");

  const mine = notes.filter((n) => n.providerId === session.provider.id);
  const toCoSign = getNotesToCoSign(session.provider.displayName);

  useEffect(() => { syncUnsignedNoteEscalations(session.provider.id); }, [session.provider.id]);

  const TABS: { id: FilterId; label: string; count: number; hidden?: boolean }[] = [
    { id: "unsigned", label: "Unsigned", count: mine.filter((n) => n.status === "draft").length },
    { id: "awaiting-cosign", label: "Awaiting co-signature", count: mine.filter((n) => n.status === "pending-cosign").length },
    { id: "to-cosign", label: "To co-sign", count: toCoSign.length, hidden: !session.capabilities.can_cosign },
    { id: "returned", label: "Returned for revision", count: mine.filter((n) => n.status === "returned").length },
    { id: "signed", label: "Signed", count: mine.filter((n) => n.status === "signed").length },
    { id: "all", label: "All", count: mine.length },
  ];

  const initial = (params.get("filter") as FilterId) || "unsigned";
  const [tab, setTab] = useState<FilterId>(TABS.some((t) => t.id === initial && !t.hidden) ? initial : "unsigned");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let list: EncounterNoteDoc[];
    if (tab === "to-cosign") list = toCoSign;
    else if (tab === "all") list = mine;
    else if (tab === "unsigned") list = mine.filter((n) => n.status === "draft");
    else if (tab === "awaiting-cosign") list = mine.filter((n) => n.status === "pending-cosign");
    else if (tab === "returned") list = mine.filter((n) => n.status === "returned");
    else list = mine.filter((n) => n.status === "signed");

    return list
      .filter((n) => (query.trim() ? n.patientName.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) =>
        tab === "signed"
          ? (b.signedAt ?? b.date).localeCompare(a.signedAt ?? a.date) // newest signed first
          : a.date.localeCompare(b.date)); // oldest-first everywhere else — a queue, not an archive
  }, [mine, toCoSign, tab, query]);

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6" data-tour="notes-header">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Clinical Notes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">A work queue, not an archive — an unsigned note is unbilled revenue. Oldest first.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4" data-tour="notes-tabs">
          {TABS.filter((t) => !t.hidden).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                tab === t.id ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
              {t.id === "to-cosign" && <Users className="w-3 h-3" />}
              {t.id === "returned" && <Undo2 className="w-3 h-3" />}
              {t.label} {t.count > 0 && <span className={cn("font-bold", tab === t.id ? "" : "text-slate-400")}>{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto" data-tour="notes-table">
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              {tab === "unsigned" ? "Nothing to sign — you're up to date."
                : tab === "awaiting-cosign" ? "No notes waiting on a co-signer."
                : tab === "to-cosign" ? "No supervisee notes are waiting on you."
                : tab === "returned" ? "Nothing has been sent back for revision."
                : "No notes match."}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5">Date of service</th>
                  <th className="px-4 py-2.5">Visit type</th>
                  <th className="px-4 py-2.5">Template</th>
                  <th className="px-4 py-2.5">Age</th>
                  <th className="px-4 py-2.5">Unbilled</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {rows.map((n) => {
                  const st = STATUS_CFG[n.status] ?? STATUS_CFG.draft;
                  const age = daysSince(n.date);
                  const val = n.status === "signed" ? null : unbilledValue(n);
                  return (
                    <tr key={n.id} ref={setRef<HTMLTableRowElement>(n.id)}
                      className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", highlightId === n.id && "bg-brand-50 dark:bg-brand-950/20")}>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{n.patientName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(n.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visitColor(n.visitType) }} />{n.visitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{templateLabel(n.templateId, n.templateVersion)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs font-medium", age > 7 ? "text-red-600 dark:text-red-400" : age > 2 ? "text-amber-600 dark:text-amber-400" : "text-slate-400")}>
                          {age === 0 ? "Today" : `${age}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {val ? <span className={val.exact ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-400"}>{val.label}{!val.exact && " est."}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>{st.label}</span></td>
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

export default function ProviderEncounterNotesPage() {
  return (
    <Suspense fallback={null}>
      <EncounterNotesInner />
    </Suspense>
  );
}

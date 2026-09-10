"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Check, AlertOctagon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDER_RESULTS, type LabResult, type ResultFlag } from "@/data/provider-today";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { cn } from "@/lib/utils";

const FLAG_CFG: Record<ResultFlag, { label: string; icon: React.ElementType; cls: string }> = {
  critical: { label: "Critical", icon: AlertOctagon, cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  abnormal: { label: "Abnormal", icon: AlertTriangle, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  normal: { label: "Normal", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

function timeAgo(iso: string) {
  const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function ProviderResultsPage() {
  const [results, setResults] = useState<LabResult[]>(PROVIDER_RESULTS);
  const [tab, setTab] = useState<"unreviewed" | "reviewed">("unreviewed");
  const { highlightId, setRef } = useQueryHighlight("result");

  function markReviewed(id: string) {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, reviewed: true } : r)));
  }

  const filtered = results.filter((r) => (tab === "unreviewed" ? !r.reviewed : r.reviewed));
  const unreviewedCount = results.filter((r) => !r.reviewed).length;

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Results Requiring Review</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Lab and diagnostic results awaiting your acknowledgement</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          <button onClick={() => setTab("unreviewed")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "unreviewed" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Unreviewed {unreviewedCount > 0 && `(${unreviewedCount})`}
          </button>
          <button onClick={() => setTab("reviewed")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "reviewed" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Reviewed
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">{tab === "unreviewed" ? "No results awaiting review." : "No reviewed results yet."}</div>
          )}
          {filtered.map((r) => {
            const cfg = FLAG_CFG[r.flag];
            const Icon = cfg.icon;
            return (
              <div key={r.id} ref={setRef<HTMLDivElement>(r.id)}
                className={cn("flex items-start gap-4 px-4 py-4 transition-colors", highlightId === r.id && "bg-amber-50 dark:bg-amber-950/20")}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.cls)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", cfg.cls)}>{cfg.label}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.testName}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.summary}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(r.resultedAt)}</span>
                    <Link href={`/provider/patients?q=${encodeURIComponent(r.patientName)}`} className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
                      {r.patientName}
                    </Link>
                  </div>
                </div>
                {tab === "unreviewed" ? (
                  <button onClick={() => markReviewed(r.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Mark reviewed
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Reviewed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ProviderLayout>
  );
}

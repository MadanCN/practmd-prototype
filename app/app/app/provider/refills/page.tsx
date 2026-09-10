"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, Check, X, AlertTriangle, Clock, Building2 } from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDER_REFILLS, type RefillRequest } from "@/data/provider-today";
import { useQueryHighlight } from "@/lib/useQueryHighlight";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const STATUS_CFG = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  denied: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

export default function ProviderRefillsPage() {
  const [refills, setRefills] = useState<RefillRequest[]>(PROVIDER_REFILLS);
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const { highlightId, setRef } = useQueryHighlight("refill");

  function decide(id: string, status: "approved" | "denied") {
    setRefills((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const filtered = refills.filter((r) => (tab === "pending" ? r.status === "pending" : r.status !== "pending"));
  const pendingCount = refills.filter((r) => r.status === "pending").length;

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Refill Requests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Medication refill requests from pharmacies and patients</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          <button onClick={() => setTab("pending")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "pending" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button onClick={() => setTab("resolved")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === "resolved" ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
            Resolved
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">{tab === "pending" ? "No pending refill requests." : "No resolved requests yet."}</div>
          )}
          {filtered.map((r) => (
            <div key={r.id} ref={setRef<HTMLDivElement>(r.id)}
              className={cn("flex items-start gap-4 px-4 py-4 transition-colors", highlightId === r.id && "bg-brand-50 dark:bg-brand-950/20")}>
              <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.medication} — {r.dosage}</p>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", STATUS_CFG[r.status])}>{r.status}</span>
                  {r.urgent && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400"><AlertTriangle className="w-3 h-3" /> Controlled substance</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {r.pharmacy}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(r.requestedAt)}</span>
                </div>
                <Link href={`/provider/patients?q=${encodeURIComponent(r.patientName)}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  {r.patientName}
                </Link>
              </div>
              {r.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => decide(r.id, "denied")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/30 transition-colors">
                    <X className="w-3.5 h-3.5" /> Deny
                  </button>
                  <button onClick={() => decide(r.id, "approved")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
}

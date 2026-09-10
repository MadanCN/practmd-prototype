"use client";

import { useMemo, useState } from "react";
import { Receipt, Search, ChevronRight, ArrowRight } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { useChargeStore, advanceChargeStatus, type Charge, type ChargeStatus } from "@/lib/charge-store";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<ChargeStatus, { label: string; cls: string }> = {
  ready: { label: "Ready to submit", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

const NEXT_LABEL: Record<ChargeStatus, string | null> = {
  ready: "Submit claim",
  submitted: "Mark paid",
  paid: null,
};

function fmtDate(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FILTERS: { id: string; label: string; match: (s: ChargeStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "ready", label: "Ready", match: (s) => s === "ready" },
  { id: "submitted", label: "Submitted", match: (s) => s === "submitted" },
  { id: "paid", label: "Paid", match: (s) => s === "paid" },
];

function ChargeDrawer({ charge, onClose }: { charge: Charge; onClose: () => void }) {
  const nextLabel = NEXT_LABEL[charge.status];
  return (
    <Drawer open onClose={onClose} title={charge.patientName} description={`${charge.visitType} · DOS ${fmtDate(charge.dateOfService)}`} width="w-[520px]"
      footer={nextLabel ? (
        <button onClick={() => { advanceChargeStatus(charge.id); onClose(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white">
          {nextLabel} <ArrowRight className="w-4 h-4" />
        </button>
      ) : undefined}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", STATUS_CFG[charge.status].cls)}>{STATUS_CFG[charge.status].label}</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">${charge.total.toFixed(2)}</span>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rendering provider</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{charge.providerName}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diagnoses</p>
          <div className="flex flex-wrap gap-1.5">
            {charge.diagnoses.map((d, i) => (
              <span key={d.code} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {i + 1}. {d.code} — {d.label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Charge lines</p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2">CPT</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Units</th><th className="px-3 py-2">POS</th><th className="px-3 py-2">Dx</th><th className="px-3 py-2 text-right">Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {charge.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{l.code}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{l.description}{l.modifiers ? ` · ${l.modifiers}` : ""}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{l.units}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{l.pos}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{l.dxPointers}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">${l.charge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">Auto-generated from the signed encounter note ({charge.noteId}).</p>
      </div>
    </Drawer>
  );
}

export default function ChargesList() {
  const { charges } = useChargeStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeFilter = FILTERS.find((f) => f.id === filter)!;
  const filtered = useMemo(() => charges.filter((c) =>
    activeFilter.match(c.status) && c.patientName.toLowerCase().includes(query.toLowerCase())
  ), [charges, activeFilter, query]);

  const counts = {
    ready: charges.filter((c) => c.status === "ready").length,
    submitted: charges.filter((c) => c.status === "submitted").length,
    paid: charges.filter((c) => c.status === "paid").length,
    value: charges.filter((c) => c.status !== "paid").reduce((s, c) => s + c.total, 0),
  };

  const openCharge = openId ? charges.find((c) => c.id === openId) ?? null : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Charges</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Superbills generated when providers sign encounter notes — ready for claim submission</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Ready to submit", value: counts.ready, color: "text-amber-600" },
          { label: "Submitted", value: counts.submitted, color: "text-blue-600" },
          { label: "Paid", value: counts.paid, color: "text-emerald-600" },
          { label: "Open A/R", value: `$${counts.value.toFixed(0)}`, color: "text-slate-700 dark:text-slate-200" },
        ].map((s) => (
          <div key={s.label} className="flex-1 min-w-[130px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === f.id ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">DOS</th>
                <th className="px-4 py-2.5">Visit type</th>
                <th className="px-4 py-2.5">CPT</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No charges match this filter.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.patientName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(c.dateOfService)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.visitType}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.lines.map((l) => l.code).join(", ")}</td>
                  <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_CFG[c.status].cls)}>{STATUS_CFG[c.status].label}</span></td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-200">${c.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openCharge && <ChargeDrawer charge={openCharge} onClose={() => setOpenId(null)} />}
    </div>
  );
}

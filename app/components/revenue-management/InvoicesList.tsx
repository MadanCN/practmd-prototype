"use client";

import { useMemo, useState } from "react";
import { Wallet, Search, ChevronRight } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";
import { useInvoiceStore, getInvoices, type Invoice, type InvoiceStatus } from "@/lib/invoice-store";
import CollectPaymentModal from "@/components/billing/CollectPaymentModal";

const STATUS_CFG: Record<InvoiceStatus, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  "partially-paid": { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  refunded: { label: "Refunded", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  void: { label: "Void", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

const FILTERS: { id: string; label: string; match: (s: InvoiceStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Open", match: (s) => s === "unpaid" || s === "partially-paid" },
  { id: "paid", label: "Paid", match: (s) => s === "paid" },
  { id: "closed", label: "Void / Refunded", match: (s) => s === "void" || s === "refunded" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function InvoiceDrawer({ invoice, onClose, onCollect }: { invoice: Invoice; onClose: () => void; onCollect: () => void }) {
  const sc = STATUS_CFG[invoice.status];
  return (
    <Drawer open onClose={onClose} title={invoice.patientName} description={`Invoice ${invoice.id} · ${fmtDate(invoice.createdAt)}`} width="w-[480px]"
      footer={invoice.amountDue > 0 && invoice.status !== "void" ? (
        <button onClick={onCollect} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white">
          Collect ${invoice.amountDue.toFixed(2)}
        </button>
      ) : undefined}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", sc.cls)}>{sc.label}</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Line items</p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {invoice.lineItems.map((l, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300">{l.description}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">${l.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        {invoice.payments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment history</p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.payments.map((p) => (
                <div key={p.id} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      {p.method === "saved-card" || p.method === "new-card" ? p.cardSummary ?? "Card" : p.method === "cash" ? "Cash" : p.method === "check" ? "Check" : "Other"}
                    </span>
                    <span className={cn("font-medium", p.amount < 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200")}>{p.amount < 0 ? "-" : ""}${Math.abs(p.amount).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(p.collectedAt)} · {p.collectedBy} · {p.collectionPoint.replace(/-/g, " ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Amount paid</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">${invoice.amountPaid.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Amount due</span><span className="font-semibold text-slate-800 dark:text-slate-200">${invoice.amountDue.toFixed(2)}</span>
        </div>
        {invoice.note && <p className="text-xs text-slate-400 italic">{invoice.note}</p>}
      </div>
    </Drawer>
  );
}

export default function InvoicesList() {
  useInvoiceStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const invoices = getInvoices();
  const activeFilter = FILTERS.find((f) => f.id === filter)!;
  const filtered = useMemo(() => invoices.filter((i) =>
    activeFilter.match(i.status) && i.patientName.toLowerCase().includes(query.toLowerCase())
  ), [invoices, activeFilter, query]);

  const stats = {
    outstanding: invoices.filter((i) => i.status !== "void" && i.status !== "refunded").reduce((s, i) => s + i.amountDue, 0),
    collected: invoices.reduce((s, i) => s + i.amountPaid, 0),
    open: invoices.filter((i) => i.status === "unpaid" || i.status === "partially-paid").length,
    selfPay: invoices.filter((i) => i.type === "self-pay").length,
  };

  const openInvoice = openId ? invoices.find((i) => i.id === openId) ?? null : null;
  const collectingInvoice = collectingId ? invoices.find((i) => i.id === collectingId) ?? null : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every dollar owed by a patient — copays, self-pay balances, and patient responsibility left after a payer adjudicates a claim</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Outstanding", value: `$${stats.outstanding.toFixed(0)}`, color: "text-amber-600" },
          { label: "Collected (all time)", value: `$${stats.collected.toFixed(0)}`, color: "text-emerald-600" },
          { label: "Open invoices", value: stats.open, color: "text-blue-600" },
          { label: "Self-pay invoices", value: stats.selfPay, color: "text-slate-700 dark:text-slate-200" },
        ].map((s) => (
          <div key={s.label} className="flex-1 min-w-[140px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">Due</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No invoices match this filter.</td></tr>
              )}
              {filtered.map((inv) => (
                <tr key={inv.id} onClick={() => setOpenId(inv.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{inv.patientName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{inv.type.replace(/-/g, " ")}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(inv.createdAt)}</td>
                  <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_CFG[inv.status].cls)}>{STATUS_CFG[inv.status].label}</span></td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-200">${inv.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">{inv.amountDue > 0 ? `$${inv.amountDue.toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openInvoice && (
        <InvoiceDrawer invoice={openInvoice} onClose={() => setOpenId(null)} onCollect={() => { setCollectingId(openInvoice.id); setOpenId(null); }} />
      )}
      {collectingInvoice && (
        <CollectPaymentModal
          patientId={collectingInvoice.patientId} patientName={collectingInvoice.patientName}
          collectionPoint="revenue-cycle" collectedBy="Revenue Cycle"
          existingInvoice={collectingInvoice}
          onClose={() => setCollectingId(null)}
          onDone={() => setCollectingId(null)}
        />
      )}
    </div>
  );
}

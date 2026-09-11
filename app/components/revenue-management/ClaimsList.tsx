"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileStack, Search, ChevronRight, ShieldCheck, AlertTriangle, XCircle, Send, Loader2,
  CheckCircle2, RotateCcw, Gavel, History,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";
import {
  useClaimStore, getClaims, runScrub, sendToPayer, simulatePayerResponse, appealClaim, resubmitClaim,
  buildCms1500, type Claim, type ClaimStatus,
} from "@/lib/claim-store";
import Cms1500Form from "./Cms1500Form";

const STATUS_CFG: Record<ClaimStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  "scrub-failed": { label: "Scrub Failed", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  "ready-to-send": { label: "Ready to Send", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  submitted: { label: "Submitted — Awaiting Payer", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  "partially-paid": { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  denied: { label: "Denied", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  appealed: { label: "Appealed", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  closed: { label: "Closed", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

const FILTERS: { id: string; label: string; match: (s: ClaimStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "action", label: "Needs Action", match: (s) => s === "draft" || s === "scrub-failed" || s === "ready-to-send" || s === "denied" },
  { id: "submitted", label: "With Payer", match: (s) => s === "submitted" },
  { id: "resolved", label: "Resolved", match: (s) => s === "paid" || s === "partially-paid" || s === "closed" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const actionBtn = (tone: "emerald" | "red" | "amber" | "slate" | "blue") => cn(
  "flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors",
  {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    slate: "bg-slate-600 hover:bg-slate-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
  }[tone],
);

function ClaimDrawer({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [appealNote, setAppealNote] = useState("");
  const [showAppealForm, setShowAppealForm] = useState(false);

  const { data } = buildCms1500(claim);
  const errors = claim.scrubIssues.filter((i) => i.severity === "error");
  const warnings = claim.scrubIssues.filter((i) => i.severity === "warning");

  async function handle(action: string, fn: () => unknown) {
    setBusy(action);
    try { await fn(); } finally { setBusy(null); }
  }

  return (
    <Drawer open onClose={onClose} title={claim.patientName} description={`Claim ${claim.id} · Created ${fmtDate(claim.createdAt)}`} width="w-[820px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_CFG[claim.status].cls)}>{STATUS_CFG[claim.status].label}</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">${claim.totalCharge.toFixed(2)}</span>
        </div>

        {/* Payer response */}
        {claim.payerResponse && (
          <div className={cn("rounded-xl border p-4",
            claim.payerResponse.outcome === "paid" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
              : claim.payerResponse.outcome === "partial" ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20")}>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {claim.payerResponse.outcome === "paid" ? "Payer paid in full" : claim.payerResponse.outcome === "partial" ? "Payer paid partially" : "Payer denied this claim"}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div><p className="text-slate-400">Allowed</p><p className="font-medium text-slate-800 dark:text-slate-200">${claim.payerResponse.allowedAmount.toFixed(2)}</p></div>
              <div><p className="text-slate-400">Paid</p><p className="font-medium text-emerald-700 dark:text-emerald-400">${claim.payerResponse.paidAmount.toFixed(2)}</p></div>
              <div><p className="text-slate-400">Patient responsibility</p><p className="font-medium text-amber-700 dark:text-amber-400">${claim.payerResponse.patientResponsibility.toFixed(2)}</p></div>
            </div>
            {claim.payerResponse.denialReason && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{claim.payerResponse.denialReason}</p>}
            {claim.invoiceId && claim.payerResponse.patientResponsibility > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">A patient-responsibility invoice was created — collect it from the patient&apos;s Billing tab or the Invoices worklist.</p>
            )}
          </div>
        )}

        {/* Scrub issues */}
        {claim.scrubIssues.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scrub results</p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {[...errors, ...warnings].map((issue, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 text-xs">
                  {issue.severity === "error" ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className={issue.severity === "error" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}>{issue.message}</p>
                    <p className="text-slate-400 mt-0.5">{issue.field}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</p>

          {(claim.status === "draft" || claim.status === "scrub-failed") && (
            <button onClick={() => handle("scrub", () => runScrub(claim.id))} disabled={busy === "scrub"} className={actionBtn("blue")}>
              {busy === "scrub" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Run scrub
            </button>
          )}

          {claim.status === "ready-to-send" && (
            <button onClick={() => handle("send", () => sendToPayer(claim.id, "Revenue Cycle"))} disabled={busy === "send"} className={actionBtn("emerald")}>
              {busy === "send" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {busy === "send" ? "Sending…" : "Send to payer"}
            </button>
          )}

          {claim.status === "submitted" && (
            <div>
              <p className="text-[11px] text-slate-400 mb-2">Demo control — record what the payer&apos;s ERA/835 response would say:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handle("paid", () => simulatePayerResponse({ claimId: claim.id, outcome: "paid", actor: "Revenue Cycle" }))} disabled={!!busy} className={actionBtn("emerald")}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simulate: Paid in full
                </button>
                <button onClick={() => handle("partial", () => simulatePayerResponse({ claimId: claim.id, outcome: "partial", actor: "Revenue Cycle" }))} disabled={!!busy} className={actionBtn("amber")}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulate: Partial payment
                </button>
                <button onClick={() => setShowDenyForm((v) => !v)} className={actionBtn("red")}>
                  <XCircle className="w-3.5 h-3.5" /> Simulate: Denied
                </button>
              </div>
              {showDenyForm && (
                <div className="mt-2 flex gap-2">
                  <input value={denialReason} onChange={(e) => setDenialReason(e.target.value)} placeholder="Denial reason (e.g. CO-16 — missing info)"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <button onClick={() => handle("deny", () => simulatePayerResponse({ claimId: claim.id, outcome: "denied", actor: "Revenue Cycle", denialReason: denialReason || undefined }))} className={actionBtn("red")}>Confirm denial</button>
                </div>
              )}
            </div>
          )}

          {claim.status === "denied" && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handle("resubmit", () => resubmitClaim(claim.id, "Revenue Cycle"))} disabled={!!busy} className={actionBtn("blue")}>
                <RotateCcw className="w-3.5 h-3.5" /> Resubmit (corrected)
              </button>
              <button onClick={() => setShowAppealForm((v) => !v)} className={actionBtn("slate")}>
                <Gavel className="w-3.5 h-3.5" /> File appeal
              </button>
              {showAppealForm && (
                <div className="w-full flex gap-2 mt-1">
                  <input value={appealNote} onChange={(e) => setAppealNote(e.target.value)} placeholder="Appeal note"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <button onClick={() => handle("appeal", () => appealClaim(claim.id, "Revenue Cycle", appealNote || "Filed with payer"))} className={actionBtn("slate")}>File</button>
                </div>
              )}
            </div>
          )}

          {claim.status === "appealed" && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handle("resubmit", () => resubmitClaim(claim.id, "Revenue Cycle"))} disabled={!!busy} className={actionBtn("blue")}>
                <RotateCcw className="w-3.5 h-3.5" /> Resubmit (corrected)
              </button>
            </div>
          )}

          {(claim.status === "paid" || claim.status === "closed") && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">No further action needed.</p>
          )}
          {claim.status === "partially-paid" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Resolved by payer — collect the remaining patient responsibility to close this out.</p>
          )}
        </div>

        {/* CMS-1500 */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CMS-1500</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <Cms1500Form data={data} printId={`cms1500-${claim.id}`} />
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Activity</p>
          <div className="space-y-2">
            {claim.activity.slice().reverse().map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0" />
                <div>
                  <span className="text-slate-600 dark:text-slate-300">{a.description}</span>
                  <span className="text-slate-400"> — {fmtDateTime(a.at)} · {a.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function ClaimsList() {
  useClaimStore();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("claim"));

  const claims = getClaims();
  const activeFilter = FILTERS.find((f) => f.id === filter)!;
  const filtered = useMemo(() => claims.filter((c) =>
    activeFilter.match(c.status) && c.patientName.toLowerCase().includes(query.toLowerCase())
  ), [claims, activeFilter, query]);

  const counts = {
    action: claims.filter((c) => ["draft", "scrub-failed", "ready-to-send", "denied"].includes(c.status)).length,
    submitted: claims.filter((c) => c.status === "submitted").length,
    paid: claims.filter((c) => c.status === "paid").length,
    denied: claims.filter((c) => c.status === "denied").length,
  };

  const openClaim = openId ? claims.find((c) => c.id === openId) ?? null : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
          <FileStack className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Claims</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Charges billed to a payer — scrub, send, and post the ERA/835 response</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[130px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-2xl font-bold text-amber-600">{counts.action}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Needs action</p></div>
        <div className="flex-1 min-w-[130px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-2xl font-bold text-blue-600">{counts.submitted}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">With payer</p></div>
        <div className="flex-1 min-w-[130px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-2xl font-bold text-emerald-600">{counts.paid}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Paid</p></div>
        <div className="flex-1 min-w-[130px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-2xl font-bold text-red-600">{counts.denied}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Denied</p></div>
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
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Charge</th>
                <th className="px-4 py-2.5 text-right">Paid</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No claims match this filter.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.patientName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_CFG[c.status].cls)}>{STATUS_CFG[c.status].label}</span></td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-200">${c.totalCharge.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{c.payerResponse ? `$${c.payerResponse.paidAmount.toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openClaim && <ClaimDrawer claim={openClaim} onClose={() => setOpenId(null)} />}
    </div>
  );
}

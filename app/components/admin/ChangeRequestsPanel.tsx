"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pencil, X } from "lucide-react";
import { providerDisplayName } from "@/data/provider-record";
import { markCorrectionForRevision, resolveCorrection, selectRecord, useProviderStore, type Correction } from "@/lib/provider-store";
import { fmtDateTime } from "@/components/provider-staff/InviteDialogs";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<Correction["source"], string> = {
  profile: "Profile change at activation",
  hours: "Working-hours change at activation",
};

/** Every provider's profile/working-hours corrections, across the organization —
 *  the Change Requests tab of Approval. Same exact field diffs the provider
 *  submitted and saw on their own screen; Approve / Revise / Deny per request. */
export default function ChangeRequestsPanel() {
  const store = useProviderStore();
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const all = [...store.corrections].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const pending = all.filter((c) => c.status === "pending");
  const resolved = all.filter((c) => c.status !== "pending");
  const shown = tab === "pending" ? pending : resolved;

  function act(id: string, action: "approve" | "deny") {
    setBusy(id);
    resolveCorrection(id, action);
    setBusy(null);
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Provider profile and working-hours changes made during account activation, awaiting your review.</p>

      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(["pending", "resolved"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              tab === t ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {t === "pending" ? `Pending${pending.length ? ` (${pending.length})` : ""}` : "Resolved"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-10 text-center text-sm text-slate-400">
            No {tab} change requests.
          </div>
        ) : shown.map((c) => {
          const rec = selectRecord(store, c.providerId);
          const name = rec ? providerDisplayName(rec) : c.providerId;
          return (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Link href={`/provider-staff/${c.providerId}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline">{name}</Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{SOURCE_LABEL[c.source]} · <span suppressHydrationWarning>{fmtDateTime(c.submittedAt)}</span></p>
                </div>
                {c.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => act(c.id, "approve")} disabled={busy === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <Link href={`/provider-staff/${c.providerId}/edit`} onClick={() => markCorrectionForRevision(c.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Pencil className="w-3.5 h-3.5" /> Revise
                    </Link>
                    <button onClick={() => act(c.id, "deny")} disabled={busy === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Deny
                    </button>
                  </div>
                ) : (
                  <span className={cn("text-xs font-semibold", c.status === "approved" ? "text-brand-700 dark:text-brand-400" : "text-rose-600 dark:text-rose-400")}>
                    {c.status === "approved" ? "Approved" : "Denied"} · {c.resolvedBy}
                  </span>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {c.fields.map((f) => (
                  <li key={f.field} className="text-sm flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{f.field}:</span>
                    <span className="text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600">{f.from}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-navy-800 dark:text-navy-300">{f.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

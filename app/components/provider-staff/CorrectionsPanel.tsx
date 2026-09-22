"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ClipboardEdit, Pencil, X } from "lucide-react";
import { markCorrectionForRevision, resolveCorrection, type Correction } from "@/lib/provider-store";
import { fmtDateTime } from "./InviteDialogs";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<Correction["source"], string> = {
  profile: "Confirmed profile at activation",
  hours: "Confirmed working hours at activation",
};

/** What the Clinic Admin sees when a provider changes a pre-filled value during account
 *  activation — the exact field diffs the provider submitted, with Approve / Deny / Revise. */
export function CorrectionsPanel({ providerName, editHref, corrections }: { providerName: string; editHref: string; corrections: Correction[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!corrections.length) return null;

  function act(id: string, action: "approve" | "deny") {
    setBusy(id);
    resolveCorrection(id, action);
    setBusy(null);
  }

  return (
    <div className="mb-5 rounded-2xl border border-navy-200 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardEdit className="w-4 h-4 text-navy-700 dark:text-navy-300" />
        <h2 className="text-sm font-semibold text-navy-900 dark:text-slate-100">
          {corrections.length} change{corrections.length === 1 ? "" : "s"} from the provider need{corrections.length === 1 ? "s" : ""} review
        </h2>
      </div>
      <div className="space-y-3">
        {corrections.map((c) => (
          <div key={c.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{SOURCE_LABEL[c.source]}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500" suppressHydrationWarning>{fmtDateTime(c.submittedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => act(c.id, "approve")} disabled={busy === c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <Link href={editHref} onClick={() => markCorrectionForRevision(c.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Pencil className="w-3.5 h-3.5" /> Revise
                </Link>
                <button onClick={() => act(c.id, "deny")} disabled={busy === c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50">
                  <X className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
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
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Already applied to {providerName}&apos;s record. <strong className="font-semibold">Approve</strong> to keep it,{" "}
        <strong className="font-semibold">Deny</strong> to restore what you originally entered, or{" "}
        <strong className="font-semibold">Revise</strong> to set your own value.
      </p>
    </div>
  );
}

const RESOLVED_TONE: Record<"approved" | "denied", string> = {
  approved: "text-brand-700 dark:text-brand-400",
  denied: "text-rose-600 dark:text-rose-400",
};

/** A quieter list of already-resolved corrections, for the record. */
export function ResolvedCorrectionsList({ corrections }: { corrections: Correction[] }) {
  const resolved = corrections.filter((c) => c.status !== "pending");
  if (!resolved.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Resolved provider corrections</p>
      <ul className="space-y-2">
        {resolved.map((c) => (
          <li key={c.id} className="text-sm text-slate-600 dark:text-slate-400">
            <span className={cn("font-semibold", RESOLVED_TONE[c.status as "approved" | "denied"])}>{c.status === "approved" ? "Approved" : "Denied"}</span>{" "}
            — {c.fields.map((f) => f.field).join(", ")} · {c.resolvedBy}{c.resolvedAt && <span suppressHydrationWarning> · {fmtDateTime(c.resolvedAt)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

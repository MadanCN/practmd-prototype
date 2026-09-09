"use client";

import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { CheckCircle2, Circle, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { useProviderSession } from "@/lib/provider-session";
import { useActivation, activationComplete } from "@/lib/provider-activation";
import { credentialStatus } from "@/data/provider-credentialing";
import { cn } from "@/lib/utils";

type RowState = "done" | "in-progress" | "blocked";

interface ReadinessRow {
  label: string;
  state: RowState;
  owner: string;
  blocks?: string;
  detail?: string;
  messageHref?: string;
}

export default function ReadinessPage() {
  const { profile } = useProviderSession();
  const activation = useActivation();

  const licenses = profile.credentials.filter((c) => c.type === "License");
  const anyLicenseExpired = licenses.some((c) => credentialStatus(c) === "expired");
  const npiOk = /^\d{10}$/.test(profile.npi);
  const enrolled = profile.payerEnrolment.filter((p) => p.status === "enrolled").length;
  const totalPayers = profile.payerEnrolment.length;

  const rows: ReadinessRow[] = [
    {
      label: "Profile confirmed",
      state: activation.activationStepsDone.includes("confirm-profile") ? "done" : "in-progress",
      owner: "You",
      detail: activation.corrections.length ? `${activation.corrections.length} correction${activation.corrections.length > 1 ? "s" : ""} sent to Credentialing` : undefined,
    },
    {
      label: "Working hours set",
      state: activation.activationStepsDone.includes("confirm-hours") ? "done" : "in-progress",
      owner: "You",
    },
    {
      label: "Licence verification",
      state: anyLicenseExpired ? "blocked" : profile.clinicalStatus === "clinically-active" || profile.clinicalStatus === "active-limited" ? "done" : "in-progress",
      owner: "Credentialing",
      blocks: "being booked",
      detail: activation.credentialsSubmittedAt
        ? `Submitted ${new Date(activation.credentialsSubmittedAt).toLocaleDateString()}`
        : anyLicenseExpired ? "A licence on file has expired — renew it to continue" : "With Credentialing",
      messageHref: "/provider/messages/internal",
    },
    {
      label: "NPI verification",
      state: npiOk ? (profile.clinicalStatus === "clinically-active" ? "done" : "in-progress") : "blocked",
      owner: "Credentialing",
      blocks: "billing",
      detail: npiOk ? `NPI ${profile.npi}` : "NPI missing or malformed",
      messageHref: "/provider/messages/internal",
    },
    {
      label: "Payer enrolment",
      state: enrolled === totalPayers ? "done" : "in-progress",
      owner: "Credentialing",
      detail: `${enrolled} of ${totalPayers} payers enrolled — does not block seeing patients`,
      messageHref: "/provider/messages/internal",
    },
  ];

  const done = rows.filter((r) => r.state === "done").length;
  const ready = activationComplete(activation) && rows.filter((r) => r.blocks === "being booked").every((r) => r.state === "done");

  return (
    <ProviderLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account readiness</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{done} of {rows.length} items complete · what&apos;s outstanding and what it blocks</p>
          </div>
        </div>

        <div className={cn("mt-5 rounded-xl border p-4 text-sm",
          ready ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300")}>
          {ready
            ? "Everything that blocks patient care is cleared. You'll move to Clinically Active shortly."
            : "You can use the limited portal now. The items below unlock the rest — nothing here is a dead end."}
        </div>

        <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 px-4 py-3.5">
              {r.state === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                : r.state === "blocked" ? <Circle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  : <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
                  {r.blocks && r.state !== "done" && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">blocks {r.blocks}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {r.owner === "You" ? "Owned by you" : `With ${r.owner}`}{r.detail ? ` · ${r.detail}` : ""}
                </p>
              </div>
              {r.messageHref && r.state !== "done" && (
                <Link href={r.messageHref} className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                  <MessageSquare className="w-3.5 h-3.5" /> Message {r.owner}
                </Link>
              )}
            </div>
          ))}
        </div>

        {activation.corrections.length > 0 && (
          <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Corrections sent to Credentialing</p>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              {activation.corrections.map((c) => (
                <li key={c.field} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium">{c.field}</span>
                  <span className="text-slate-400">“{c.from}” → “{c.to}”</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}

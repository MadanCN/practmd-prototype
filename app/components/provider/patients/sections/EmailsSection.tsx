"use client";

import { Mail, MailOpen, MousePointerClick, MailX } from "lucide-react";
import { EMAILS_BY_ID, type EmailStatus } from "@/data/provider-patient-activity";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";

const STATUS: Record<EmailStatus, { label: string; icon: React.ElementType; cls: string }> = {
  delivered: { label: "Delivered", icon: Mail, cls: "text-slate-500 dark:text-slate-400" },
  opened: { label: "Opened", icon: MailOpen, cls: "text-brand-700 dark:text-brand-400" },
  clicked: { label: "Clicked", icon: MousePointerClick, cls: "text-emerald-600 dark:text-emerald-400" },
  bounced: { label: "Bounced", icon: MailX, cls: "text-red-600 dark:text-red-400" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function EmailsSection({ patient }: { patient: PatientProfile }) {
  const emails = EMAILS_BY_ID[patient.id] ?? [];

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400">No emails have been sent to {patient.firstName}.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {emails.length} emails sent to <span className="font-medium text-slate-700 dark:text-slate-300">{patient.email}</span>
      </p>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left">
              {["Subject", "Type", "Sent", "Status", "Opens"].map((h) => <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {emails.map((e) => {
              const s = STATUS[e.status];
              const Icon = s.icon;
              return (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{e.subject}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.type}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmt(e.sentAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 font-medium", s.cls)}>
                      <Icon className="w-3.5 h-3.5" /> {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {e.opens > 0 ? <>{e.opens}{e.lastOpenedAt ? <span className="text-xs text-slate-400"> · last {fmt(e.lastOpenedAt)}</span> : null}</> : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

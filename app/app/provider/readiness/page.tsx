"use client";

import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { useProviderSession } from "@/lib/provider-session";
import { useActivation } from "@/lib/provider-activation";
import { cn } from "@/lib/utils";

interface ReadinessRow {
  label: string;
  done: boolean;
  detail: string;
}

export default function ReadinessPage() {
  const { clinicalStatus } = useProviderSession();
  const activation = useActivation();
  const verified = clinicalStatus === "clinically-active" || clinicalStatus === "active-limited";

  const rows: ReadinessRow[] = [
    {
      label: "Profile confirmed",
      done: activation.activationStepsDone.includes("confirm-profile"),
      detail: "Owned by you",
    },
    {
      label: "Working hours confirmed",
      done: activation.activationStepsDone.includes("confirm-hours"),
      detail: "Owned by you",
    },
    {
      label: "Pending verification",
      done: verified,
      detail: verified ? "Verified" : "Admin is verifying your credentials — once done you'll gain access to the full portal.",
    },
  ];

  const done = rows.filter((r) => r.done).length;

  return (
    <ProviderLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account readiness</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{done} of {rows.length} complete</p>
          </div>
        </div>

        <div className={cn("mt-5 rounded-xl border p-4 text-sm",
          verified ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300")}>
          {verified
            ? "You're verified. You now have full access to the portal."
            : "You can use this limited view while your admin finishes verifying you — nothing below is a dead end."}
        </div>

        <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 px-4 py-3.5">
              {r.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
}

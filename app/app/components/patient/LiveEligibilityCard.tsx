"use client";

import { useState } from "react";
import { Shield, ChevronDown, ChevronUp, Clock3, CheckCircle2, XCircle, HelpCircle, Wallet, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EligibilityWorklistItem, EligibilityState } from "@/lib/onboarding-store";

const STATUS_CONFIG: Record<EligibilityState, { label: string; badge: string; icon: React.ElementType; message: string }> = {
  "pending": {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    icon: Clock3,
    message: "We've received your insurance and it's in queue for eligibility verification.",
  },
  "in-progress": {
    label: "Under Review",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    icon: Clock3,
    message: "Our billing team is verifying your coverage now — this usually takes 1-2 business days.",
  },
  "on-hold": {
    label: "Action Needed",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
    icon: PauseCircle,
    message: "We need a bit more information from you before we can finish verifying your coverage. Our team will reach out.",
  },
  "verified-active": {
    label: "Active",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    icon: CheckCircle2,
    message: "Coverage verified and active. Your care coordinator has been notified to book your appointment.",
  },
  "verified-inactive": {
    label: "Inactive",
    badge: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    icon: XCircle,
    message: "This policy isn't currently active. Please update your insurance or contact our billing team.",
  },
  "verified-not-covered": {
    label: "Not Covered",
    badge: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    icon: XCircle,
    message: "Your plan is active but doesn't cover the requested service. Contact our billing team to discuss self-pay options.",
  },
  "unable-to-verify": {
    label: "Unable to Verify",
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: HelpCircle,
    message: "We couldn't reach your payer to verify coverage. Our team will follow up, or you can opt in to self-pay.",
  },
  "self-pay-confirmed": {
    label: "Self-Pay",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    icon: Wallet,
    message: "You've opted to self-pay. Your care coordinator has been notified to book your appointment.",
  },
  "expired": {
    label: "Expired",
    badge: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    icon: XCircle,
    message: "This coverage window has lapsed. We'll need to re-verify before your next visit.",
  },
};

export default function LiveEligibilityCard({ item }: { item: EligibilityWorklistItem }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = STATUS_CONFIG[item.state];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/40">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left">
        <div className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.payerName}</p>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", cfg.badge)}>{cfg.label}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submitted at onboarding · ID: {item.memberId}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className={cn("flex items-start gap-2.5 p-3 rounded-xl", cfg.badge)}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{cfg.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

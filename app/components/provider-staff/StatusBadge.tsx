import { STATUS_META, type ClinicalStatus, type StatusTone } from "@/data/provider-credentialing";
import { cn } from "@/lib/utils";

/** One color language for a clinical-status chip, shared by the list, the detail header and Change status —
 *  so "Active — Limited" (bookable, just scope-restricted) never reads as a generic pending/amber state. */
const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  pending: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  active: "bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-400 border-brand-200 dark:border-brand-900",
  limited: "bg-navy-50 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300 border-navy-200 dark:border-navy-800",
  negative: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900",
};

export function StatusBadge({ status, deactivated, className }: { status: ClinicalStatus; deactivated?: boolean; className?: string }) {
  if (deactivated) {
    return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", TONE_CLASSES.neutral, className)}>Deactivated</span>;
  }
  const meta = STATUS_META[status];
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap", TONE_CLASSES[meta.tone], className)}>{meta.label}</span>;
}

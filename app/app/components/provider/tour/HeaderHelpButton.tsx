"use client";

import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "./TourProvider";

/** The ? in the global header. Present on every page that has a tour / help
 *  entry (including sub-routes, which inherit the parent's help). */
export function HeaderHelpButton() {
  const tour = useTour();
  if (!tour?.def) return null;

  const active = tour.helpOpen || tour.onLastStep;

  return (
    <button
      data-tour="help"
      onClick={tour.toggleHelp}
      aria-label="Help for this page"
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400",
      )}
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  );
}

"use client";

import { FileText, ChevronRight, ClipboardList } from "lucide-react";
import { NOTE_TEMPLATES } from "@/lib/encounter-store";
import { cn } from "@/lib/utils";

export default function NoteTemplatePicker({
  onSelect, compact = false,
}: {
  onSelect: (templateId: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn(!compact && "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5")}>
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList className={cn("text-brand-600 dark:text-brand-400", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <p className={cn("font-semibold text-slate-800 dark:text-slate-200", compact ? "text-xs" : "text-sm")}>Select a Note Template</p>
      </div>
      <p className={cn("text-slate-500 dark:text-slate-400 mb-4", compact ? "text-[11px]" : "text-xs")}>
        Choose a template to start the encounter note. You can still edit every field afterward.
      </p>
      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        {NOTE_TEMPLATES.map((tpl) => (
          <button key={tpl.id} onClick={() => onSelect(tpl.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20",
              compact ? "px-3 py-2.5" : "px-4 py-3.5"
            )}>
            <div className={cn("rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0", compact ? "w-7 h-7" : "w-9 h-9")}>
              <FileText className={cn("text-brand-600 dark:text-brand-400", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold text-slate-800 dark:text-slate-200", compact ? "text-xs" : "text-sm")}>{tpl.label}</p>
              {!compact && <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>}
            </div>
            <ChevronRight className={cn("text-slate-300 shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          </button>
        ))}
      </div>
    </div>
  );
}

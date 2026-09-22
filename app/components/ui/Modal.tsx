"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** tailwind max-w class */
  width?: string;
  /** hide the ✕ (for forced-choice dialogs) */
  hideClose?: boolean;
}

/** Centered dialog with backdrop, Escape-to-close and a footer slot. */
export default function Modal({ open, onClose, title, description, children, footer, width = "max-w-md", hideClose }: ModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cn("relative w-full max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl", width)}>
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
          {!hideClose && (
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-5 pb-4 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
}

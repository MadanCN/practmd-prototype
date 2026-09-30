"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 2200);
    },
    [dismiss],
  );
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg",
              t.tone === "error"
                ? "border-pm-warning/40 bg-[#fdf1ee] text-[#7a2413] dark:bg-[#3a1710] dark:text-[#ffd9cf]"
                : "border-pm-border bg-pm-card text-pm-text",
            )}
          >
            {t.tone === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pm-accent" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-pm-muted hover:text-pm-text">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

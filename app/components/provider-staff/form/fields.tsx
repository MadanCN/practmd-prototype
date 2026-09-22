"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed";
export const INPUT_ERR = "border-rose-300 dark:border-rose-800 focus:ring-rose-400";
export const LABEL = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

interface FieldProps {
  label: string;
  required?: boolean;
  /** already filtered to "should be visible now" */
  error?: string;
  hint?: React.ReactNode;
  /** e.g. "12 / 35" live counter shown top-right of the label */
  counter?: string;
  counterWarn?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, hint, counter, counterWarn, htmlFor, className, children }: FieldProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={htmlFor} className={LABEL}>
          {label} {required && <span className="text-rose-500" aria-hidden>*</span>}
        </label>
        {counter && <span className={cn("text-[11px] tabular-nums", counterWarn ? "text-amber-600 dark:text-amber-400 font-medium" : "text-slate-400")}>{counter}</span>}
      </div>
      {children}
      {error ? <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOut(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOut, active]);
}

/** Multi-select dropdown with search + chips. Values not in `options` are still shown (so nothing is silently lost). */
export function MultiSelect({ options, value, onChange, placeholder = "Select…", id }: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const all = useMemo(() => [...options, ...value.filter((v) => !options.includes(v))], [options, value]);
  const shown = all.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);

  return (
    <div ref={ref} className="relative">
      <button type="button" id={id} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={cn(INPUT, "flex items-center gap-1.5 flex-wrap min-h-[38px] text-left cursor-pointer")}>
        {value.length === 0 && <span className="text-slate-400">{placeholder}</span>}
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {v}
            <span role="button" tabIndex={0} aria-label={`Remove ${v}`}
              onClick={(e) => { e.stopPropagation(); toggle(v); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggle(v); } }}
              className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900"><X className="w-3 h-3" /></span>
          </span>
        ))}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          {all.length > 8 && (
            <div className="relative p-2 border-b border-slate-100 dark:border-slate-800">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <ul role="listbox" aria-multiselectable className="max-h-56 overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">No matches</li>}
            {shown.map((o) => {
              const on = value.includes(o);
              return (
                <li key={o} role="option" aria-selected={on}>
                  <button type="button" onClick={() => toggle(o)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", on ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600")}>
                      {on && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{o}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Single-select dropdown that shows a colour swatch beside each option (Provider Color Code master). */
export function ColorSelect({ options, value, onChange, id }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const cur = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" id={id} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={cn(INPUT, "flex items-center gap-2 text-left cursor-pointer")}>
        {cur ? <><span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cur.value }} />{cur.label}</> : <span className="text-slate-400">Select a colour</span>}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
      </button>
      {open && (
        <ul role="listbox" className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: o.value }} />
                <span className="text-slate-700 dark:text-slate-300">{o.label}</span>
                {o.value === value && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Amber/blue call-out used for advisories and warnings inside the form. */
export function Callout({ tone, children, className }: { tone: "warn" | "info" | "error" | "ok"; children: React.ReactNode; className?: string }) {
  const cls = {
    warn: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300",
    error: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300",
    ok: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300",
  }[tone];
  return <div className={cn("rounded-lg border px-3 py-2 text-xs leading-relaxed", cls, className)}>{children}</div>;
}

export function SectionCard({ id, title, subtitle, children, muted }: { id: string; title: string; subtitle?: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section id={id} data-section={id} className={cn("scroll-mt-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800", muted && "opacity-60")}>
      <header className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

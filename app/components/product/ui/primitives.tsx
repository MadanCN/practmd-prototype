"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Small UI kit for the Product section, styled with the workshop brand tokens (pm-*).

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-accent";

export const inputClass = cn(
  "w-full rounded-lg border border-pm-border bg-pm-card px-3 py-2 text-sm text-pm-text placeholder:text-pm-muted/70",
  "focus:border-pm-accent focus:outline-none focus:ring-2 focus:ring-pm-accent/25 disabled:opacity-60",
);

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-pm-navy text-white hover:bg-pm-ink dark:bg-pm-teal dark:hover:bg-pm-ocean",
  secondary: "border border-pm-border bg-pm-card text-pm-text hover:bg-pm-subtle",
  ghost: "text-pm-text hover:bg-pm-subtle",
  danger: "bg-pm-warning text-white hover:opacity-90",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }
>(function Button({ variant = "secondary", size = "md", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        variants[variant],
        focusRing,
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-pm-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-pm-warning">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-pm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Chip({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

/** Coloured workstream / category chip: swatch plus name, so colour never stands alone. */
export function ColorChip({ color, label, className }: { color: string; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-pm-border bg-pm-card px-2 py-0.5 text-xs text-pm-text", className)}>
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/40" style={{ backgroundColor: color }} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Overlays render inside the Product wrapper so its theme tokens and font apply. */
function portalRoot(): HTMLElement {
  return document.getElementById("product-portal") ?? document.body;
}

function useEscape(open: boolean, onClose: () => void, panel?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // With a dialog stacked on a drawer, only the one holding focus closes.
      const target = e.target as Element | null;
      if (panel?.current && !panel.current.contains(target) && target?.closest?.('[role="dialog"]')) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, panel]);
}

/** Moves focus into the panel on open and restores it on close. */
function useFocusReturn(open: boolean, panel: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const el = panel.current;
      if (el && !el.contains(document.activeElement)) {
        (el.querySelector<HTMLElement>("[data-autofocus]") ?? el).focus();
      }
    }, 0);
    return () => {
      window.clearTimeout(t);
      previous?.focus?.();
    };
  }, [open, panel]);
}

/** Right-hand side panel (drawer / sheet). */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  footer,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEscape(open, onClose, panel);
  useFocusReturn(open, panel);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("relative flex h-full w-full flex-col border-l border-pm-border bg-pm-bg text-pm-text shadow-2xl outline-none", width)}
      >
        <header className="flex items-start gap-3 border-b border-pm-border bg-pm-card px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold leading-snug">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-sm text-pm-muted">{subtitle}</div>}
          </div>
          {actions}
          <button type="button" onClick={onClose} aria-label="Close" className={cn("rounded-lg p-1.5 text-pm-muted hover:bg-pm-subtle hover:text-pm-text", focusRing)}>
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-pm-border bg-pm-card px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    portalRoot(),
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEscape(open, onClose, panel);
  useFocusReturn(open, panel);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("relative flex max-h-[90vh] w-full flex-col rounded-2xl border border-pm-border bg-pm-card text-pm-text shadow-2xl outline-none", width)}
      >
        <header className="flex items-center gap-3 border-b border-pm-border px-5 py-3.5">
          <h2 id={titleId} className="flex-1 text-base font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className={cn("rounded-lg p-1.5 text-pm-muted hover:bg-pm-subtle", focusRing)}>
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-pm-border px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    portalRoot(),
  );
}

/** Click-to-open popover anchored under its trigger. */
export function Popover({
  trigger,
  children,
  label,
  align = "left",
  className,
  panelClassName,
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  label: string;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useEscape(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div ref={root} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn("inline-flex items-center rounded-lg", focusRing)}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full z-40 mt-1.5 min-w-56 rounded-xl border border-pm-border bg-pm-card p-3 text-sm text-pm-text shadow-xl",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

/** Multi-select dropdown of checkboxes. */
export function MultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; swatch?: string }[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const summary = value.length === 0 ? "All" : value.length === 1 ? options.find((o) => o.value === value[0])?.label : `${value.length} selected`;
  return (
    <Popover
      label={`${label} filter`}
      trigger={
        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-pm-border bg-pm-card px-3 text-sm">
          <span className="text-pm-muted">{label}:</span>
          <span className="max-w-32 truncate font-medium">{summary}</span>
          <ChevronDown className="h-3.5 w-3.5 text-pm-muted" />
        </span>
      }
    >
      <fieldset className="space-y-0.5">
        <legend className="sr-only">{label}</legend>
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-pm-subtle">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#02979D]"
                checked={checked}
                onChange={() => onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])}
              />
              {o.swatch && <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.swatch }} />}
              <span>{o.label}</span>
            </label>
          );
        })}
      </fieldset>
      {value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="mt-2 text-xs font-medium text-pm-link hover:underline">
          Clear
        </button>
      )}
    </Popover>
  );
}

export function ToggleChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
        pressed ? "border-pm-accent bg-pm-accent/10 text-pm-text" : "border-pm-border bg-pm-card text-pm-muted hover:text-pm-text",
        focusRing,
      )}
    >
      {pressed && <Check className="h-3.5 w-3.5 text-pm-accent" />}
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-pm-border bg-pm-card px-6 py-12 text-center">
      {icon && <div className="mb-3 text-pm-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-pm-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-pm-subtle", className)} />;
}

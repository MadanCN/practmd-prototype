"use client";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("flex items-center gap-2.5 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
        )}
      >
        <span className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )} />
      </button>
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      )}
    </label>
  );
}

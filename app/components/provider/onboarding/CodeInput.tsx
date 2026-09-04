"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Six single-character boxes for an authenticator code. Handles paste, arrow
 *  keys and backspace the way people expect from an OTP field. */
export function CodeInput({
  value,
  onChange,
  invalid,
  onComplete,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  onComplete?: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function setDigit(i: number, d: string) {
    const next = value.padEnd(6, " ").slice(0, 6).split("");
    next[i] = d || " ";
    const joined = next.join("").replace(/ /g, "");
    onChange(joined);
    if (d && i < 5) refs.current[i + 1]?.focus();
    if (joined.length === 6) onComplete?.(joined);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={i === 0}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => {
            const only = e.target.value.replace(/\D/g, "").slice(-1);
            if (only || e.target.value === "") setDigit(i, only);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d.trim() && i > 0) {
              refs.current[i - 1]?.focus();
              setDigit(i - 1, "");
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) {
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
              if (pasted.length === 6) onComplete?.(pasted);
            }
          }}
          className={cn(
            "w-11 h-14 sm:w-12 sm:h-16 rounded-xl border text-center text-2xl font-semibold tabular-nums",
            "bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition",
            invalid
              ? "border-red-400 dark:border-red-500 text-red-600 dark:text-red-400"
              : "border-slate-300 dark:border-navy-700",
          )}
        />
      ))}
    </div>
  );
}

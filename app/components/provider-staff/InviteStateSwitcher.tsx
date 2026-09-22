"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, X } from "lucide-react";

const STATES: { label: string; token: string; note: string }[] = [
  { label: "Live — account setup", token: "demo-live-p6", note: "Welcome → password → MFA → …" },
  { label: "Expired", token: "demo-expired-p7", note: "\"This invitation has expired.\"" },
  { label: "Deactivated before accepting", token: "demo-deactivated-p8", note: "Password saves, then \"not active\"" },
  { label: "Already used", token: "demo-used-p9", note: "Falls through to sign in" },
];

/** Prototype-only — jump between the different invite-link states without hunting
 *  for demo tokens. Same "flask" convention as the provider portal's dev switcher. */
export function InviteStateSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Prototype: preview a different link state"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-navy-900 text-amber-400 shadow-lg hover:bg-navy-800"
      >
        <FlaskConical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 right-0 z-50 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Preview a link state</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-1.5">
              {STATES.map((s) => (
                <button key={s.token} onClick={() => { setOpen(false); router.push(`/invite/${s.token}`); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                  <span className="block text-xs text-slate-400">{s.note}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

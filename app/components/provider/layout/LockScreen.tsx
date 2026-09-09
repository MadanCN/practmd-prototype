"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { PractMdLogo } from "@/components/brand/PractMdLogo";
import {
  useProviderSession, lockPortal, unlockPortal, noteActivity, getLastActivity,
} from "@/lib/provider-session";

const TIMEOUT_MS = 15 * 60 * 1000; // 15-minute inactivity timeout (PRD Security)
const WARN_MS = 60 * 1000;

/** Wraps the portal: tracks activity, auto-locks after 15 idle minutes, and
 *  renders the lock overlay. The header's lock button calls lockPortal(). */
export function LockScreen({ children }: { children: React.ReactNode }) {
  const { locked, provider } = useProviderSession();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [warn, setWarn] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = () => {
      noteActivity();
      setWarn(false);
    };
    const evts: (keyof WindowEventMap)[] = ["mousemove", "keydown", "pointerdown", "scroll"];
    evts.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    timer.current = setInterval(() => {
      if (locked) return;
      const idle = Date.now() - getLastActivity();
      if (idle >= TIMEOUT_MS) lockPortal();
      else setWarn(idle >= TIMEOUT_MS - WARN_MS);
    }, 5000);

    return () => {
      evts.forEach((e) => window.removeEventListener(e, handler));
      if (timer.current) clearInterval(timer.current);
    };
  }, [locked]);

  return (
    <>
      {children}
      {warn && !locked && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs shadow-2xl">
          <Lock className="w-3.5 h-3.5 text-amber-400" /> Locking soon for inactivity — move your mouse to stay signed in.
        </div>
      )}
      {locked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 text-center practmd-card-pop">
            <PractMdLogo className="h-6 mx-auto" />
            <div className="mt-6 w-14 h-14 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">Portal locked</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Signed in as {provider.displayName}. Enter your password to continue.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pw.length >= 4) { unlockPortal(); setPw(""); setErr(false); }
                else setErr(true);
              }}
              className="mt-5"
            >
              <input
                type="password"
                autoFocus
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(false); }}
                placeholder="Password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {err && <p className="mt-2 text-xs text-red-500">Enter your password to unlock.</p>}
              <button type="submit" className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold practmd-gradient text-white">
                <ShieldCheck className="w-4 h-4" /> Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

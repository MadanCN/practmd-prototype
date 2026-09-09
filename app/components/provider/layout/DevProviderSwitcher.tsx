"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import {
  CAPABILITY_KEYS, CAPABILITY_META, CLINICAL_STATUS_ORDER, PROVIDER_TYPE_LABEL, STATUS_META,
  type ClinicalStatus, type ProviderTypeKey,
} from "@/data/provider-credentialing";
import {
  useProviderSession, setSessionProvider, setSessionStatus, setSessionProviderType,
  setSessionCapability, resetSessionOverrides,
} from "@/lib/provider-session";
import { clearAllPersisted } from "@/lib/persist";
import { cn } from "@/lib/utils";

const TYPES: ProviderTypeKey[] = ["md-do", "np-pa", "therapist", "supervising"];

/** Prototype-only control — switch the signed-in provider, their type, clinical
 *  status and individual capabilities so every gated state can be demoed. */
export function DevProviderSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { provider, providerType, clinicalStatus, capabilities, raw } = useProviderSession();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Prototype: switch provider / status / capabilities"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Prototype controls</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
              <Field label="Signed in as">
                <select
                  value={provider.id}
                  onChange={(e) => setSessionProvider(e.target.value)}
                  className={selCls}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName} — {p.providerType}</option>
                  ))}
                </select>
              </Field>

              <Field label="Provider-type (re-seeds capabilities)">
                <select
                  value={raw.providerTypeOverride ?? providerType}
                  onChange={(e) => setSessionProviderType(e.target.value as ProviderTypeKey)}
                  className={selCls}
                >
                  {TYPES.map((t) => <option key={t} value={t}>{PROVIDER_TYPE_LABEL[t]}</option>)}
                </select>
              </Field>

              <Field label="Clinical status">
                <select
                  value={clinicalStatus}
                  onChange={(e) => setSessionStatus(e.target.value as ClinicalStatus)}
                  className={selCls}
                >
                  {CLINICAL_STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </Field>

              <Field label="Capabilities">
                <div className="space-y-1">
                  {CAPABILITY_KEYS.map((k) => (
                    <label key={k} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={capabilities[k]}
                        onChange={(e) => setSessionCapability(k, e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-brand-600"
                      />
                      <span className="font-mono">{k}</span>
                      {CAPABILITY_META[k].soon && <span className="text-[9px] font-bold text-slate-400">SOON</span>}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { resetSessionOverrides(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset overrides
                </button>
                <button
                  onClick={() => {
                    if (confirm("Wipe all prototype state (drafts, notes, onboarding, notifications)?")) {
                      clearAllPersisted();
                      router.refresh();
                      location.reload();
                    }
                  }}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Reset prototype
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const selCls = "w-full px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1")}>{label}</p>
      {children}
    </div>
  );
}

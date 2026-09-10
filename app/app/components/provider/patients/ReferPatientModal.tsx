"use client";

import { useEffect, useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

const REASONS = [
  "Second opinion",
  "Specialty care (out of scope)",
  "Therapy referral",
  "Psychological / neuropsych testing",
  "Higher level of care",
  "Patient relocating",
  "Other",
];

const CLINIC_PROVIDERS = PROVIDERS.filter(
  (p) => p.kind === "provider" && p.id !== "p1",
);

export function ReferPatientModal({
  patientName, onClose,
}: {
  patientName?: string;
  onClose: () => void;
}) {
  const [dest, setDest] = useState<"internal" | "external">("internal");
  const [providerId, setProviderId] = useState(CLINIC_PROVIDERS[0]?.id ?? "");
  const [externalClinic, setExternalClinic] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(onClose, 1400);
    return () => clearTimeout(t);
  }, [sent, onClose]);

  const canSend = dest === "internal" ? !!providerId : externalClinic.trim().length > 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">Referral sent</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {patientName ? `The care team has been notified about ${patientName}.` : "The care team has been notified."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {patientName ? "Refer patient" : "Refer a patient"}
                </h2>
                {patientName && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{patientName}</p>}
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <Label>Refer to</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["internal", "external"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDest(d)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                        dest === d
                          ? "border-brand-500 bg-brand-50/60 text-brand-800 dark:bg-brand-950/20 dark:text-brand-300 dark:border-brand-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300",
                      )}
                    >
                      {d === "internal" ? "Provider in this clinic" : "External clinic"}
                    </button>
                  ))}
                </div>
              </div>

              {dest === "internal" ? (
                <div>
                  <Label>Provider</Label>
                  <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={fieldClass}>
                    {CLINIC_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.displayName} — {p.providerType}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label>External clinic / provider</Label>
                  <input value={externalClinic} onChange={(e) => setExternalClinic(e.target.value)} placeholder="Clinic or provider name" className={fieldClass} />
                </div>
              )}

              <div>
                <Label>Reason</Label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass}>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <Label>Note (optional)</Label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Context for the receiving provider…"
                  className={cn(fieldClass, "resize-none")}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={() => setSent(true)}
                disabled={!canSend}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  canSend ? "practmd-gradient text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
                )}
              >
                <Send className="w-4 h-4" /> Send referral
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fieldClass =
  "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{children}</label>;
}

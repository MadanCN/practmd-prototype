"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Loader2, Bell, BellOff, CreditCard } from "lucide-react";
import WaitlistOfferPanel from "./WaitlistOfferPanel";
import { type CcAppointment } from "@/data/cc-appointments";
import { type CcPatient } from "@/data/cc-patients";
import { type Provider } from "@/data/providers";
import { CANCELLATION_REASONS, CLINIC_CONFIG } from "@/data/cc-masters";
import { cn } from "@/lib/utils";


function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function isWithin24Hrs(appt: CcAppointment): boolean {
  const now = new Date();
  const apptDt = new Date(`${appt.date}T${appt.startTime}:00`);
  const diffHrs = Math.abs((apptDt.getTime() - now.getTime()) / 3600000);
  return diffHrs < CLINIC_CONFIG.cancellationWindowHrs;
}


interface Props {
  appointment: CcAppointment;
  patient: CcPatient;
  provider: Provider;
  waitlistEntries: CcAppointment[];
  patientMap: Record<string, CcPatient>;
  onConfirm: (reason: string, notes: string, notifyPatient: boolean) => void;
  onClose: () => void;
}

type Phase = "form" | "processing" | "waitlist";

export default function CancelModal({ appointment, patient, provider, waitlistEntries, patientMap, onConfirm, onClose }: Props) {
  const within24h = isWithin24Hrs(appointment);

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [phase, setPhase] = useState<Phase>("form");
  const [feeAmount, setFeeAmount] = useState(CLINIC_CONFIG.lateCancellationFee);
  const [feePaymentMethod, setFeePaymentMethod] = useState("card-on-file");

  function handleSubmit() {
    if (!reason) return;
    setPhase("processing");
    setTimeout(() => {
      onConfirm(reason, notes, notifyPatient);
      setPhase("waitlist");
    }, 1600);
  }

  const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={phase === "form" ? onClose : undefined} />
      <div className="relative w-[520px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {phase === "waitlist" ? "Appointment Cancelled" : "Cancel Appointment"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient.displayName} · {fmtDate(appointment.date)} · {fmt12(appointment.startTime)}
            </p>
          </div>
          {phase !== "processing" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── FORM phase ── */}
          {phase === "form" && (
            <div className="space-y-4">
              {/* Late cancel warning */}
              {within24h && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Within 24-hour window</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">This cancellation will be flagged as a late cancellation in the audit log.</p>
                  </div>
                </div>
              )}

              {/* Cancellation fee */}
              <div className="rounded-xl border bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {within24h ? "Late Cancellation Fee" : "Cancellation Fee"}
                  </span>
                  {within24h && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Within 24hr window</span>}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 dark:text-slate-400 shrink-0">Amount (USD)</label>
                  <div className="flex items-center gap-1 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900">
                    <span className="text-sm text-slate-500">$</span>
                    <input type="number" min={0} max={500} step={5} value={feeAmount}
                      onChange={e => setFeeAmount(Number(e.target.value))}
                      className="w-16 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none" />
                  </div>
                  <button onClick={() => setFeeAmount(CLINIC_CONFIG.lateCancellationFee)} className="text-xs text-slate-400 hover:text-teal-600 transition-colors">
                    Reset to default
                  </button>
                </div>
                <div className="space-y-1.5">
                  {[
                    { value: "card-on-file", label: "Card on file (Visa •••• 4242)" },
                    { value: "invoice", label: "Invoice patient" },
                    { value: "waive", label: "Waive fee" },
                  ].map(pm => (
                    <label key={pm.value} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                      feePaymentMethod === pm.value
                        ? "bg-white dark:bg-slate-800 border-violet-300 dark:border-violet-700 text-slate-800 dark:text-slate-200"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60")}>
                      <input type="radio" name="lateCancelPayment" value={pm.value} checked={feePaymentMethod === pm.value}
                        onChange={() => setFeePaymentMethod(pm.value)} className="accent-violet-600 shrink-0" />
                      {pm.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <select className={INPUT} value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select a reason</option>
                  {CANCELLATION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Additional Notes</label>
                <textarea rows={3} className={cn(INPUT, "resize-none")} placeholder="Optional notes for staff record…"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {/* Notify patient toggle */}
              <div className={cn("p-4 rounded-xl border transition-colors", notifyPatient ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700")}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifyPatient} onChange={e => setNotifyPatient(e.target.checked)}
                    className="accent-teal-600 w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Send cancellation notification to patient</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Email: {patient.email}<br />
                      SMS: {patient.phone}
                    </p>
                  </div>
                  {notifyPatient ? <Bell className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /> : <BellOff className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                </label>
              </div>
            </div>
          )}

          {/* ── PROCESSING phase ── */}
          {phase === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Processing cancellation…</p>
                <p className="text-xs text-slate-500 mt-1">Updating status and checking waitlist</p>
              </div>
            </div>
          )}

          {/* ── WAITLIST phase ── */}
          {phase === "waitlist" && (
            <div className="space-y-4">
              {/* Confirmation badges */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Appointment status updated to Cancelled
                </div>
                {notifyPatient && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Patient notification queued (Email + SMS)
                  </div>
                )}
                {within24h && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    Late cancellation flagged in audit log
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-400">
                  <CreditCard className="w-4 h-4" />
                  {within24h ? "Late cancellation" : "Cancellation"} fee ${feeAmount} — {feePaymentMethod === "waive" ? "waived" : feePaymentMethod === "invoice" ? "invoiced to patient" : "charged to card on file"}
                </div>
              </div>

              {/* Waitlist section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Waitlist — Offer Freed Slot</p>
                <WaitlistOfferPanel
                  freedSlot={{ date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime }}
                  providerName={provider.displayName}
                  entries={waitlistEntries}
                  patientMap={patientMap}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {phase === "form" && (
            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Keep Appointment
              </button>
              <button onClick={handleSubmit} disabled={!reason}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
                Cancel Appointment
              </button>
            </div>
          )}
          {phase === "waitlist" && (
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

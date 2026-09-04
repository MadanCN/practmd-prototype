"use client";

import { useState } from "react";
import { X, UserX, AlertTriangle, CreditCard, FileText, Check } from "lucide-react";
import { type CcAppointment } from "@/data/cc-appointments";
import { type CcPatient } from "@/data/cc-patients";
import { type Provider } from "@/data/providers";
import { CLINIC_CONFIG } from "@/data/cc-masters";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const PAYMENT_METHODS = [
  { value: "card-on-file", label: "Card on file (Visa •••• 4242)" },
  { value: "invoice", label: "Invoice patient" },
  { value: "waive", label: "Waive fee" },
];

interface Props {
  appointment: CcAppointment;
  patient: CcPatient;
  provider: Provider;
  onConfirm: (chargeFee: boolean, feeAmount: number, paymentMethod: string) => void;
  onClose: () => void;
}

export default function NoShowModal({ appointment, patient, provider, onConfirm, onClose }: Props) {
  const [feeAmount, setFeeAmount] = useState(CLINIC_CONFIG.noShowFee);
  const [paymentMethod, setPaymentMethod] = useState("card-on-file");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[460px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Mark as No Show</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient.displayName} · {fmtDate(appointment.date)} · {fmt12(appointment.startTime)}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Impact summary */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">This action will:</p>
            <div className="flex items-center gap-2"><UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />Update appointment status to <strong>No Show</strong></div>
            <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />Add entry to patient&apos;s attendance record</div>
            <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />Release the slot for waitlist patients</div>
          </div>

          {/* Fee section */}
          <div className="rounded-xl border bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">No-Show Fee</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-400 shrink-0">Amount (USD)</label>
              <div className="flex items-center gap-1 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900">
                <span className="text-sm text-slate-500">$</span>
                <input type="number" min={0} max={500} step={5} value={feeAmount}
                  onChange={e => setFeeAmount(Number(e.target.value))}
                  className="w-16 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none" />
              </div>
              <button onClick={() => setFeeAmount(CLINIC_CONFIG.noShowFee)} className="text-xs text-slate-400 hover:text-brand-600 transition-colors">
                Reset to default
              </button>
            </div>
            <div className="space-y-1.5">
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.value} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                  paymentMethod === pm.value
                    ? "bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 text-slate-800 dark:text-slate-200"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60")}>
                  <input type="radio" name="paymentMethod" value={pm.value} checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)} className="accent-indigo-600 shrink-0" />
                  {pm.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={() => onConfirm(paymentMethod !== "waive", feeAmount, paymentMethod)}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <UserX className="w-4 h-4" />
            Confirm No Show
          </button>
        </div>
      </div>
    </div>
  );
}

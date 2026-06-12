"use client";

import { useState } from "react";
import { X, ShieldCheck, ShieldAlert, ShieldX, Loader2, CheckCircle2, AlertTriangle, User, CreditCard, Video } from "lucide-react";
import { type CcAppointment } from "@/data/cc-appointments";
import { type CcPatient } from "@/data/cc-patients";
import { type Provider } from "@/data/providers";
import { cn } from "@/lib/utils";

interface EligibilityResult {
  status: "eligible" | "issue" | "expired";
  message?: string;
  planName?: string;
  memberId?: string;
  copay?: number;
  deductibleMet?: number;
  deductibleTotal?: number;
}

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

async function runEligibilityCheck(patient: CcPatient): Promise<EligibilityResult> {
  await new Promise(r => setTimeout(r, 1600));
  if (patient.insuranceStatus === "inactive") {
    return { status: "issue", message: "Coverage inactive as of last verification. Confirm with patient before proceeding.", planName: patient.insuranceProvider, memberId: patient.insuranceMemberId };
  }
  if (patient.insuranceStatus === "pending") {
    return { status: "expired", message: "Coverage pending renewal. Prior authorization may be required.", planName: patient.insuranceProvider, memberId: patient.insuranceMemberId };
  }
  return { status: "eligible", planName: patient.insuranceProvider, memberId: patient.insuranceMemberId, copay: 30, deductibleMet: 850, deductibleTotal: 2000 };
}

interface Props {
  appointment: CcAppointment;
  patient: CcPatient;
  provider: Provider;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CheckInModal({ appointment, patient, provider, onConfirm, onClose }: Props) {
  const [idVerified, setIdVerified] = useState(false);
  const [insurancePresented, setInsurancePresented] = useState(false);
  const [eligibilityState, setEligibilityState] = useState<"idle" | "running" | "done">("idle");
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [proceedWithWarning, setProceedWithWarning] = useState(false);

  const isTelehealth = appointment.mode === "telehealth";
  const canRunEligibility = idVerified && insurancePresented;
  const eligibilityOk = eligibilityResult?.status === "eligible" || (eligibilityResult?.status !== null && proceedWithWarning);
  const canCheckIn = idVerified && insurancePresented && eligibilityOk;

  async function handleEligibility() {
    setEligibilityState("running");
    const result = await runEligibilityCheck(patient);
    setEligibilityResult(result);
    setEligibilityState("done");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[500px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isTelehealth ? "Telehealth Check-In" : "Patient Check-In"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient.displayName} · {fmt12(appointment.startTime)} · {provider.displayName}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Telehealth note */}
          {isTelehealth && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Telehealth Session</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Patient will join via video link. Check-in confirms they have connected and are in the waiting room.
                </p>
              </div>
            </div>
          )}

          {/* Identity Verification */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {isTelehealth ? "Identity Verification" : "1 · Identity Verification"}
            </p>
            <div className="space-y-2">
              <label className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                idVerified ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                <input type="checkbox" checked={idVerified} onChange={e => setIdVerified(e.target.checked)} className="accent-teal-600 w-4 h-4 shrink-0" />
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {isTelehealth ? "Patient confirmed name and date of birth via video" : "Patient confirmed name and date of birth"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {patient.displayName} · DOB: {new Date(patient.dob + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </label>

              {!isTelehealth && (
                <label className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  insurancePresented ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                  <input type="checkbox" checked={insurancePresented} onChange={e => setInsurancePresented(e.target.checked)} className="accent-teal-600 w-4 h-4 shrink-0" />
                  <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">Insurance card presented</p>
                    <p className="text-xs text-slate-400 mt-0.5">{patient.insuranceProvider} · #{patient.insuranceMemberId}</p>
                  </div>
                </label>
              )}

              {/* For telehealth auto-set insurance presented */}
              {isTelehealth && !insurancePresented && idVerified && (
                <button onClick={() => setInsurancePresented(true)} className="hidden" />
              )}
              {isTelehealth && idVerified && !insurancePresented && (() => { setInsurancePresented(true); return null; })()}
            </div>
          </div>

          {/* Insurance Eligibility */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {isTelehealth ? "Insurance Eligibility" : "2 · Insurance Eligibility"}
            </p>
            {eligibilityState === "idle" && (
              <button onClick={handleEligibility} disabled={!canRunEligibility}
                className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                  canRunEligibility
                    ? "border-teal-400 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/40"
                    : "border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed")}>
                <ShieldCheck className="w-4 h-4" />
                Run Eligibility Check
                {!canRunEligibility && <span className="text-xs font-normal">(complete verification first)</span>}
              </button>
            )}

            {eligibilityState === "running" && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Checking eligibility with {patient.insuranceProvider}…</p>
              </div>
            )}

            {eligibilityState === "done" && eligibilityResult && (
              <div>
                {/* Eligible */}
                {eligibilityResult.status === "eligible" && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Coverage Verified — Active</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-slate-500">Plan</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{eligibilityResult.planName}</p></div>
                      <div><p className="text-slate-500">Member ID</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">#{eligibilityResult.memberId}</p></div>
                      <div><p className="text-slate-500">Copay</p><p className="font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">${eligibilityResult.copay}</p></div>
                      <div><p className="text-slate-500">Deductible Met</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${eligibilityResult.deductibleMet} / ${eligibilityResult.deductibleTotal}</p></div>
                    </div>
                  </div>
                )}

                {/* Issue */}
                {eligibilityResult.status === "issue" && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Coverage Issue Detected</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{eligibilityResult.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{eligibilityResult.planName} · #{eligibilityResult.memberId}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input type="checkbox" checked={proceedWithWarning} onChange={e => setProceedWithWarning(e.target.checked)} className="accent-amber-600 w-4 h-4" />
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Proceed with audit log entry — staff override acknowledged</span>
                    </label>
                  </div>
                )}

                {/* Expired */}
                {eligibilityResult.status === "expired" && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <ShieldX className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-800 dark:text-red-300">Coverage Expired or Not Active</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">{eligibilityResult.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{eligibilityResult.planName} · #{eligibilityResult.memberId}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input type="checkbox" checked={proceedWithWarning} onChange={e => setProceedWithWarning(e.target.checked)} className="accent-red-600 w-4 h-4" />
                      <span className="text-xs text-red-700 dark:text-red-400 font-medium">Proceed anyway — self-pay or patient acknowledged. Audit log entry will be created.</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Encounter preview */}
          {canCheckIn && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">Ready to check in</p>
              </div>
              <p className="text-xs text-teal-700 dark:text-teal-400 ml-5">
                Checking in will: update status to <strong>Arrived</strong>, notify {provider.displayName}, and create a draft encounter document.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!canCheckIn}
            className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Complete Check-In
          </button>
        </div>
      </div>
    </div>
  );
}

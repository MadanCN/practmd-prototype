"use client";

import { useState } from "react";
import {
  Shield, Plus, CheckCircle2, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Camera, Upload, X, AlertCircle, DollarSign,
} from "lucide-react";
import { PATIENT_INSURANCES, type PatientInsurance } from "@/data/patient-portal";
import { useOnboardingStore } from "@/lib/onboarding-store";
import LiveEligibilityCard from "@/components/patient/LiveEligibilityCard";
import { cn } from "@/lib/utils";

function EligBadge({ status }: { status: PatientInsurance["eligibilityStatus"] }) {
  const cfg = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    inactive: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    pending: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    unknown: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", cfg[status])}>
      {status}
    </span>
  );
}

function InsuranceCard({ ins }: { ins: PatientInsurance }) {
  const [expanded, setExpanded] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  function runCheck() {
    setChecking(true);
    setTimeout(() => { setChecking(false); setChecked(true); }, 1800);
  }

  const deductPct = Math.round((ins.deductibleMet / ins.deductible) * 100);
  const oopPct = Math.round((ins.outOfPocketMet / ins.outOfPocketMax) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/40">
      {/* Card header */}
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
        <div className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ins.provider}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 uppercase">
                {ins.type}
              </span>
              <EligBadge status={ins.eligibilityStatus} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ins.planName} · ID: {ins.memberId}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 space-y-5">
          {/* Plan details */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { label: "Group Number", val: ins.groupNumber },
              { label: "Plan Type", val: ins.planType },
              { label: "Effective Date", val: new Date(ins.effectiveDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Co-pay", val: `$${ins.copay} per visit` },
              { label: "Subscriber", val: ins.subscriberName },
              { label: "Subscriber DOB", val: new Date(ins.subscriberDob + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Benefits usage */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Benefits Usage ({new Date().getFullYear()})</p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Deductible</span>
                <span className="text-slate-500">${ins.deductibleMet.toLocaleString()} / ${ins.deductible.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(deductPct, 100)}%` }} />
              </div>
              <p className="text-xs text-slate-400">{deductPct}% met</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Out-of-Pocket Max</span>
                <span className="text-slate-500">${ins.outOfPocketMet.toLocaleString()} / ${ins.outOfPocketMax.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.min(oopPct, 100)}%` }} />
              </div>
              <p className="text-xs text-slate-400">{oopPct}% met</p>
            </div>
          </div>

          {/* Insurance card images */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurance Card</p>
            <div className="grid grid-cols-2 gap-3">
              {["Front", "Back"].map((side, i) => {
                const uploaded = i === 0 ? ins.cardFrontUploaded : ins.cardBackUploaded;
                return (
                  <div key={side} className={cn("rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors",
                    uploaded
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/10"
                      : "border-slate-300 dark:border-slate-600 hover:border-emerald-400")}>
                    {uploaded ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Card {side} uploaded</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <p className="text-xs text-slate-500">Upload card {side.toLowerCase()}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eligibility check */}
          <div>
            <p className="text-[10px] text-slate-400 mb-2">
              Last checked: {new Date(ins.lastChecked).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            {checked ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Eligibility verified — coverage active</p>
              </div>
            ) : (
              <button onClick={runCheck} disabled={checking}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {checking ? "Checking eligibility…" : "Re-run Eligibility Check"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsurancePage() {
  const [showAdd, setShowAdd] = useState(false);
  const store = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Insurance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your insurance plans and coverage details</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Insurance
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add New Insurance</p>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Insurance Provider", "Member ID", "Group Number", "Plan Name"].map(f => (
              <div key={f}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{f}</label>
                <input placeholder={f} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">Save Insurance</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      {store.worklist.map((item) => <LiveEligibilityCard key={item.id} item={item} />)}

      {PATIENT_INSURANCES.map(ins => <InsuranceCard key={ins.id} ins={ins} />)}

      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Insurance information is verified at each visit. If your coverage has changed, please update it at least 48 hours before your appointment or contact our billing team.
        </p>
      </div>
    </div>
  );
}

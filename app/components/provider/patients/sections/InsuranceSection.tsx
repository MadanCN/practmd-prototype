"use client";

import { useState } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Loader2, ChevronRight, Building2,
  User, FileText, Clock, CheckCircle2, XCircle, HelpCircle, X,
} from "lucide-react";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import {
  useInsuranceStore, getPoliciesForPatient, getPriorAuthsForPatient, getEligibilityHistoryForPatient,
  runEligibilityCheck, isSelfPay,
} from "@/lib/insurance-store";
import type {
  InsurancePolicy, PriorAuthorization, EligibilityCheckReport, PolicyStatus, PriorAuthStatus, EligibilityStatus,
} from "@/data/insurance";

const POLICY_STATUS_CFG: Record<PolicyStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  inactive: { label: "Inactive", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  terminated: { label: "Terminated", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

const PA_STATUS_CFG: Record<PriorAuthStatus, { label: string; cls: string; icon: React.ElementType }> = {
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: Clock },
  denied: { label: "Denied", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", icon: XCircle },
  expired: { label: "Expired", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400", icon: HelpCircle },
};

const ELIG_STATUS_CFG: Record<EligibilityStatus, { label: string; cls: string; icon: React.ElementType }> = {
  eligible: { label: "Eligible", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: ShieldCheck },
  "coverage-issue": { label: "Coverage Issue", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: ShieldAlert },
  inactive: { label: "Inactive", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", icon: ShieldX },
  expired: { label: "Expired / Pending Renewal", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: ShieldQuestion },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function Bar({ met, total }: { met: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (met / total) * 100) : 0;
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function PolicyCard({ policy }: { policy: InsurancePolicy }) {
  const sc = POLICY_STATUS_CFG[policy.status];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{policy.payerName} <span className="text-slate-400 font-normal">· {policy.rank === "primary" ? "Primary" : "Secondary"}</span></p>
            <p className="text-xs text-slate-400">{policy.planName}</p>
          </div>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", sc.cls)}>{sc.label}</span>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div><p className="text-slate-400">Member ID</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.memberId}</p></div>
        {policy.groupNumber && <div><p className="text-slate-400">Group #</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.groupNumber}</p></div>}
        <div><p className="text-slate-400">Plan type</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.planType}</p></div>
        <div><p className="text-slate-400">Effective</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.effectiveDate}{policy.terminationDate ? ` – ${policy.terminationDate}` : ""}</p></div>
        <div><p className="text-slate-400">PCP / Specialist copay</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${policy.copayPCP} / ${policy.copaySpecialist}</p></div>
        <div><p className="text-slate-400">Coinsurance</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.coinsurance}%</p></div>
        {policy.deductibleIndividualTotal > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-slate-400">Deductible met</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${policy.deductibleIndividualMet} / ${policy.deductibleIndividualTotal}</p>
            <Bar met={policy.deductibleIndividualMet} total={policy.deductibleIndividualTotal} />
          </div>
        )}
        {policy.oopMaxIndividualTotal > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-slate-400">OOP max met</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${policy.oopMaxIndividualMet} / ${policy.oopMaxIndividualTotal}</p>
            <Bar met={policy.oopMaxIndividualMet} total={policy.oopMaxIndividualTotal} />
          </div>
        )}
        {policy.priorAuthRequired && (
          <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> This payer requires prior authorization for certain services.
          </div>
        )}
      </div>
      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><User className="w-3 h-3" /> Policy holder</p>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div><p className="text-slate-400">Name</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.policyHolder.firstName} {policy.policyHolder.lastName}</p></div>
          <div><p className="text-slate-400">Relationship</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{policy.policyHolder.relationshipToPatient}</p></div>
          <div><p className="text-slate-400">DOB</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.policyHolder.dob}</p></div>
          <div><p className="text-slate-400">Phone</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.policyHolder.phone}</p></div>
          <div className="col-span-2 sm:col-span-4"><p className="text-slate-400">Address</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.policyHolder.address.line1}, {policy.policyHolder.address.city}, {policy.policyHolder.address.state} {policy.policyHolder.address.zip}</p></div>
          {policy.policyHolder.employer && <div className="col-span-2"><p className="text-slate-400">Employer</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{policy.policyHolder.employer}</p></div>}
        </div>
      </div>
    </div>
  );
}

function PriorAuthRow({ auth }: { auth: PriorAuthorization }) {
  const sc = PA_STATUS_CFG[auth.status];
  const Icon = sc.icon;
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", sc.cls)}><Icon className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{auth.serviceDescription}</p>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", sc.cls)}>{sc.label}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">CPT {auth.cptCodes.join(", ")} · Requested {fmtDate(auth.requestedDate)} by {auth.requestedBy}</p>
        {auth.authNumber && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Auth # {auth.authNumber}{auth.validTo ? ` · valid through ${auth.validTo}` : ""}</p>}
        {auth.visitsApproved != null && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{auth.visitsUsed} of {auth.visitsApproved} visits used</p>}
        {auth.notes && <p className="text-xs text-slate-400 italic mt-1">{auth.notes}</p>}
      </div>
    </div>
  );
}

function EligibilityDetailModal({ report, onClose }: { report: EligibilityCheckReport; onClose: () => void }) {
  const sc = ELIG_STATUS_CFG[report.status];
  const Icon = sc.icon;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Icon className="w-4 h-4" /> Eligibility report</h2>
            <p className="text-xs text-slate-500 mt-0.5">{fmtDateTime(report.checkedAt)} · checked by {report.checkedBy}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", sc.cls)}><Icon className="w-3.5 h-3.5" /> {sc.label}</span>
          {report.message && <p className="text-sm text-slate-600 dark:text-slate-400">{report.message}</p>}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">Plan</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{report.planName}</p></div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">Member ID</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{report.memberId}</p></div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">Copay</p><p className="font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">${report.copay}</p></div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">Coinsurance</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{report.coinsurance}%</p></div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">Deductible</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${report.deductibleMet} / ${report.deductibleTotal}</p></div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-slate-400">OOP max</p><p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">${report.oopMaxMet} / ${report.oopMaxTotal}</p></div>
          </div>
          {report.benefitBreakdown.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Benefit breakdown</p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {report.benefitBreakdown.map((b, i) => (
                  <div key={i} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{b.serviceType}</p>
                      <p className="text-slate-400">{b.inNetwork ? "In-network" : "Out-of-network"}{b.priorAuthRequired ? " · prior auth required" : ""}</p>
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">{b.copay != null ? `$${b.copay} copay` : b.coinsurance != null ? `${b.coinsurance}% coinsurance` : "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-400">Source: {report.source === "check-in" ? "Front-desk check-in" : report.source === "pre-visit-batch" ? "Automated pre-visit batch" : "Manual check"}</p>
        </div>
      </div>
    </div>
  );
}

export function InsuranceSection({ patient }: { patient: PatientProfile }) {
  useInsuranceStore();
  const [checking, setChecking] = useState(false);
  const [viewingReport, setViewingReport] = useState<EligibilityCheckReport | null>(null);

  const policies = getPoliciesForPatient(patient.id);
  const priorAuths = getPriorAuthsForPatient(patient.id);
  const history = getEligibilityHistoryForPatient(patient.id);
  const latest = history[0];
  const selfPay = isSelfPay(patient.id);

  async function handleRunCheck() {
    setChecking(true);
    const report = await runEligibilityCheck(patient.id, { source: "manual", checkedBy: "Care Coordinator (manual check)" });
    setChecking(false);
    setViewingReport(report);
  }

  if (selfPay) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center">
          <ShieldQuestion className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No insurance on file — self-pay patient</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">This patient is billed directly for the full visit fee at check-in. Add a policy below if they obtain coverage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current status banner */}
      <div className={cn("rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap",
        latest?.status === "eligible" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20")}>
        <div className="flex items-center gap-3">
          {latest && (() => { const Icon = ELIG_STATUS_CFG[latest.status].icon; return <Icon className={cn("w-5 h-5", latest.status === "eligible" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")} />; })()}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {latest ? `Last checked ${fmtDateTime(latest.checkedAt)}` : "No eligibility check on record"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{latest ? `${ELIG_STATUS_CFG[latest.status].label} · ${latest.checkedBy}` : "Run a check to verify current coverage."}</p>
          </div>
        </div>
        <button onClick={handleRunCheck} disabled={checking}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold practmd-gradient text-white disabled:opacity-60">
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {checking ? "Checking…" : "Run eligibility check"}
        </button>
      </div>

      {/* Policies */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Insurance policies</p>
        <div className="space-y-4">
          {policies.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">No policies on file.</p>
          ) : policies.map((p) => <PolicyCard key={p.id} policy={p} />)}
        </div>
      </div>

      {/* Prior authorizations */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Prior authorizations</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {priorAuths.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No prior authorizations on file.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {priorAuths.map((a) => <PriorAuthRow key={a.id} auth={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* Eligibility history */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Eligibility check history</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {history.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No checks recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((r) => {
                const sc = ELIG_STATUS_CFG[r.status];
                const Icon = sc.icon;
                return (
                  <button key={r.id} onClick={() => setViewingReport(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", sc.cls)}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDateTime(r.checkedAt)}</p>
                      <p className="text-xs text-slate-400">{r.checkedBy} · {r.planName}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", sc.cls)}>{sc.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewingReport && <EligibilityDetailModal report={viewingReport} onClose={() => setViewingReport(null)} />}
    </div>
  );
}

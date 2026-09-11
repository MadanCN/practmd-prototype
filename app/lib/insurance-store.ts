"use client";

// Insurance policies / prior authorizations / eligibility-check history for
// the Patient 360 "Insurance" section. Seeded from data/insurance.ts, then
// mutable at runtime (edit policy, log a prior auth, run a new eligibility
// check) — same useSyncExternalStore + localStorage pattern as the other
// prototype stores.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import {
  ALL_INSURANCE_POLICIES, PRIOR_AUTHORIZATIONS, ELIGIBILITY_HISTORY, SELF_PAY_PATIENT_IDS,
  type InsurancePolicy, type PriorAuthorization, type EligibilityCheckReport,
  type EligibilityStatus, type EligibilitySource, type BenefitLine,
} from "@/data/insurance";

interface StoreState {
  policies: InsurancePolicy[];
  priorAuths: PriorAuthorization[];
  eligibilityChecks: EligibilityCheckReport[];
}

function now() {
  return new Date().toISOString();
}
function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const store = createPersistedStore<StoreState>({
  key: "insurance-store",
  initial: {
    policies: ALL_INSURANCE_POLICIES,
    priorAuths: PRIOR_AUTHORIZATIONS,
    eligibilityChecks: ELIGIBILITY_HISTORY,
  },
  revive: (raw, initial) => {
    const r = raw as Partial<StoreState> | null;
    const mergeById = <T extends { id: string }>(persisted: T[] | undefined, seed: T[]): T[] => {
      const p = persisted ?? [];
      const pIds = new Set(p.map((x) => x.id));
      return [...p, ...seed.filter((x) => !pIds.has(x.id))];
    };
    return {
      policies: mergeById(r?.policies, initial.policies),
      priorAuths: mergeById(r?.priorAuths, initial.priorAuths),
      eligibilityChecks: mergeById(r?.eligibilityChecks, initial.eligibilityChecks),
    };
  },
});

function set(updater: (s: StoreState) => StoreState) {
  store.set(updater);
}

export function useInsuranceStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function isSelfPay(patientId: string): boolean {
  return SELF_PAY_PATIENT_IDS.has(patientId) && !store.get().policies.some((p) => p.patientId === patientId && p.status !== "terminated");
}

export function getPoliciesForPatient(patientId: string): InsurancePolicy[] {
  return store.get().policies
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => (a.rank === "primary" ? -1 : 1) - (b.rank === "primary" ? -1 : 1));
}

export function getPrimaryPolicy(patientId: string): InsurancePolicy | undefined {
  return store.get().policies.find((p) => p.patientId === patientId && p.rank === "primary");
}

export function getPolicy(policyId: string): InsurancePolicy | undefined {
  return store.get().policies.find((p) => p.id === policyId);
}

export function updatePolicy(policyId: string, patch: Partial<InsurancePolicy>) {
  set((s) => ({ ...s, policies: s.policies.map((p) => (p.id === policyId ? { ...p, ...patch } : p)) }));
}

export function addPolicy(policy: Omit<InsurancePolicy, "id">): InsurancePolicy {
  const full: InsurancePolicy = { ...policy, id: genId("ins") };
  set((s) => ({ ...s, policies: [...s.policies, full] }));
  return full;
}

export function getPriorAuthsForPatient(patientId: string): PriorAuthorization[] {
  return store.get().priorAuths.filter((a) => a.patientId === patientId).sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
}

export function addPriorAuth(input: Omit<PriorAuthorization, "id" | "status" | "visitsUsed"> & { status?: PriorAuthorization["status"] }): PriorAuthorization {
  const pa: PriorAuthorization = { ...input, id: genId("pa"), status: input.status ?? "pending", visitsUsed: 0 };
  set((s) => ({ ...s, priorAuths: [pa, ...s.priorAuths] }));
  return pa;
}

export function decidePriorAuth(id: string, status: "approved" | "denied", opts?: { authNumber?: string; validFrom?: string; validTo?: string; visitsApproved?: number; notes?: string }) {
  set((s) => ({
    ...s,
    priorAuths: s.priorAuths.map((a) => a.id === id ? { ...a, status, decisionDate: now().split("T")[0], ...opts } : a),
  }));
}

export function getEligibilityHistoryForPatient(patientId: string): EligibilityCheckReport[] {
  return store.get().eligibilityChecks.filter((e) => e.patientId === patientId).sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
}

export function getLatestEligibility(patientId: string): EligibilityCheckReport | undefined {
  return getEligibilityHistoryForPatient(patientId)[0];
}

function benefitBreakdownFor(policy: InsurancePolicy): BenefitLine[] {
  return [
    { serviceType: "Office visit — behavioral health", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Psychiatric diagnostic evaluation", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Medication management", inNetwork: true, copay: policy.copayPCP, priorAuthRequired: false },
    { serviceType: "Telehealth — behavioral health", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Psychological testing", inNetwork: true, coinsurance: policy.coinsurance, priorAuthRequired: true, notes: "Requires prior authorization" },
  ];
}

/**
 * Simulated 270/271-style eligibility check. Used by the Insurance section's
 * "Run eligibility check" button, and shared with the check-in flow so a
 * check run at the front desk lands in the same persisted history.
 */
export async function runEligibilityCheck(patientId: string, opts?: { source?: EligibilitySource; checkedBy?: string }): Promise<EligibilityCheckReport> {
  const policy = getPrimaryPolicy(patientId);
  await new Promise((r) => setTimeout(r, 1500));

  let status: EligibilityStatus;
  let message: string | undefined;
  if (!policy) {
    status = "inactive";
    message = "No insurance on file — patient is self-pay.";
  } else if (policy.status === "inactive") {
    status = "inactive";
    message = "Coverage inactive as of last verification. Confirm with patient before proceeding.";
  } else if (policy.status === "pending") {
    status = "expired";
    message = "Coverage pending renewal. Prior authorization may be required.";
  } else {
    status = "eligible";
  }

  const report: EligibilityCheckReport = {
    id: genId("elig"),
    patientId,
    insurancePolicyId: policy?.id ?? "none",
    checkedAt: now(),
    checkedBy: opts?.checkedBy ?? "System (auto)",
    source: opts?.source ?? "manual",
    status,
    message,
    planName: policy?.planName ?? "Self-Pay",
    memberId: policy?.memberId ?? "—",
    planStatus: policy?.status ?? "terminated",
    copay: policy?.copaySpecialist ?? 0,
    coinsurance: policy?.coinsurance ?? 0,
    deductibleTotal: policy?.deductibleIndividualTotal ?? 0,
    deductibleMet: policy?.deductibleIndividualMet ?? 0,
    oopMaxTotal: policy?.oopMaxIndividualTotal ?? 0,
    oopMaxMet: policy?.oopMaxIndividualMet ?? 0,
    priorAuthRequired: policy?.priorAuthRequired ?? false,
    benefitBreakdown: policy ? benefitBreakdownFor(policy) : [],
  };

  set((s) => ({ ...s, eligibilityChecks: [report, ...s.eligibilityChecks] }));
  return report;
}

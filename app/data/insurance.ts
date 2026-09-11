// Insurance / policy-holder / prior-auth / eligibility-history seed data for the
// Patient 360 "Insurance" section. Layered over CC_PATIENTS the same way
// provider-patients.ts layers PatientProfile — prototype seed data only, no DB.

import { CC_PATIENTS } from "./cc-patients";

export type PolicyRank = "primary" | "secondary";
export type PolicyStatus = "active" | "inactive" | "pending" | "terminated";
export type SubscriberRelationship = "self" | "spouse" | "child" | "other";
export type PlanType = "PPO" | "HMO" | "EPO" | "POS" | "Medicare" | "Medicaid" | "Self-Pay";

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface PolicyHolder {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  relationshipToPatient: SubscriberRelationship;
  address: Address;
  phone: string;
  employer?: string;
}

export interface InsurancePolicy {
  id: string;
  patientId: string;
  rank: PolicyRank;
  status: PolicyStatus;
  payerName: string;
  payerId: string;
  payerPhone: string;
  payerAddress: Address;
  planName: string;
  planType: PlanType;
  memberId: string;
  groupNumber?: string;
  effectiveDate: string;
  terminationDate?: string;
  policyHolder: PolicyHolder;
  copayPCP: number;
  copaySpecialist: number;
  coinsurance: number;
  deductibleIndividualTotal: number;
  deductibleIndividualMet: number;
  oopMaxIndividualTotal: number;
  oopMaxIndividualMet: number;
  priorAuthRequired: boolean;
  acceptAssignment: boolean;
  notes?: string;
}

export type PriorAuthStatus = "pending" | "approved" | "denied" | "expired";

export interface PriorAuthorization {
  id: string;
  patientId: string;
  insurancePolicyId: string;
  authNumber?: string;
  serviceDescription: string;
  cptCodes: string[];
  status: PriorAuthStatus;
  requestedDate: string;
  decisionDate?: string;
  validFrom?: string;
  validTo?: string;
  visitsApproved?: number;
  visitsUsed: number;
  requestedBy: string;
  notes?: string;
}

export type EligibilityStatus = "eligible" | "coverage-issue" | "inactive" | "expired";
export type EligibilitySource = "check-in" | "manual" | "pre-visit-batch";

export interface BenefitLine {
  serviceType: string;
  inNetwork: boolean;
  copay?: number;
  coinsurance?: number;
  priorAuthRequired: boolean;
  notes?: string;
}

export interface EligibilityCheckReport {
  id: string;
  patientId: string;
  insurancePolicyId: string;
  checkedAt: string;
  checkedBy: string;
  source: EligibilitySource;
  status: EligibilityStatus;
  message?: string;
  planName: string;
  memberId: string;
  planStatus: PolicyStatus;
  copay: number;
  coinsurance: number;
  deductibleTotal: number;
  deductibleMet: number;
  oopMaxTotal: number;
  oopMaxMet: number;
  priorAuthRequired: boolean;
  benefitBreakdown: BenefitLine[];
}

/** Patients who carry no billable insurance — front desk collects self-pay in full. */
export const SELF_PAY_PATIENT_IDS = new Set(["pt05", "pt15"]);

const PAYER_DIRECTORY: Record<string, { payerId: string; phone: string; address: Address; planType: PlanType }> = {
  "Aetna": { payerId: "60054", phone: "+1 (800) 872-3862", address: { line1: "PO Box 981106", city: "El Paso", state: "TX", zip: "79998" }, planType: "PPO" },
  "Blue Cross": { payerId: "00590", phone: "+1 (800) 676-2583", address: { line1: "PO Box 80", city: "Buffalo", state: "NY", zip: "14240" }, planType: "PPO" },
  "UnitedHealth": { payerId: "87726", phone: "+1 (877) 842-3210", address: { line1: "PO Box 30555", city: "Salt Lake City", state: "UT", zip: "84130" }, planType: "HMO" },
  "Cigna": { payerId: "62308", phone: "+1 (800) 244-6224", address: { line1: "PO Box 182223", city: "Chattanooga", state: "TN", zip: "37422" }, planType: "EPO" },
  "Medicaid": { payerId: "NYMCD", phone: "+1 (800) 541-2831", address: { line1: "PO Box 4601", city: "Rensselaer", state: "NY", zip: "12144" }, planType: "Medicaid" },
  "Medicare": { payerId: "MEDNY", phone: "+1 (800) 633-4227", address: { line1: "PO Box 660156", city: "Dallas", state: "TX", zip: "75266" }, planType: "Medicare" },
};

const RELATIONSHIP_BY_IDX: SubscriberRelationship[] = ["self", "self", "self", "spouse", "self"];

function policyStatusFor(insuranceStatus: string | undefined): PolicyStatus {
  if (insuranceStatus === "inactive") return "inactive";
  if (insuranceStatus === "pending") return "pending";
  return "active";
}

function buildPolicy(i: number): InsurancePolicy | null {
  const p = CC_PATIENTS[i];
  if (SELF_PAY_PATIENT_IDS.has(p.id) || !p.insuranceProvider) return null;
  const dir = PAYER_DIRECTORY[p.insuranceProvider] ?? PAYER_DIRECTORY["Aetna"];
  const relationship = RELATIONSHIP_BY_IDX[i % RELATIONSHIP_BY_IDX.length];
  const isSelf = relationship === "self";
  const status = policyStatusFor(p.insuranceStatus);
  return {
    id: `ins_${p.id}`,
    patientId: p.id,
    rank: "primary",
    status,
    payerName: p.insuranceProvider,
    payerId: dir.payerId,
    payerPhone: dir.phone,
    payerAddress: dir.address,
    planName: `${p.insuranceProvider} ${dir.planType} ${dir.planType === "Medicare" ? "Part B" : dir.planType === "Medicaid" ? "Managed Care" : "Select"}`,
    planType: dir.planType,
    memberId: p.insuranceMemberId ?? "—",
    groupNumber: dir.planType === "Medicare" || dir.planType === "Medicaid" ? undefined : `GRP-${10000 + i * 37}`,
    effectiveDate: `${2023 + (i % 3)}-01-01`,
    terminationDate: status === "inactive" ? `${2024 + (i % 2)}-06-30` : undefined,
    policyHolder: isSelf
      ? {
          firstName: p.firstName, lastName: p.lastName, dob: p.dob, gender: p.gender,
          relationshipToPatient: "self",
          address: { line1: "142 Maple Ridge Drive", city: "Penfield", state: "NY", zip: "14526" },
          phone: p.phone,
        }
      : {
          firstName: p.firstName === "Priya" ? "Raj" : "Alex", lastName: p.lastName, dob: "1980-01-01", gender: p.gender === "Female" ? "Male" : "Female",
          relationshipToPatient: relationship,
          address: { line1: "142 Maple Ridge Drive", city: "Penfield", state: "NY", zip: "14526" },
          phone: p.phone, employer: "Ridgeline Manufacturing",
        },
    copayPCP: 20 + (i % 4) * 5,
    copaySpecialist: 30 + (i % 4) * 5,
    coinsurance: dir.planType === "Medicare" ? 20 : dir.planType === "Medicaid" ? 0 : 10 + (i % 3) * 5,
    deductibleIndividualTotal: dir.planType === "Medicaid" ? 0 : [1000, 1500, 2000, 2500][i % 4],
    deductibleIndividualMet: [200, 850, 400, 1200, 0][i % 5],
    oopMaxIndividualTotal: dir.planType === "Medicaid" ? 0 : 6000 + (i % 3) * 1000,
    oopMaxIndividualMet: [500, 1400, 2200, 300][i % 4],
    priorAuthRequired: ["UnitedHealth", "Cigna"].includes(p.insuranceProvider),
    acceptAssignment: true,
  };
}

export const INSURANCE_POLICIES: InsurancePolicy[] = CC_PATIENTS
  .map((_, i) => buildPolicy(i))
  .filter((x): x is InsurancePolicy => x !== null);

/** A couple of representative patients also carry a secondary policy. */
const SECONDARY_OVERRIDES: InsurancePolicy[] = [
  {
    id: "ins_pt07_sec", patientId: "pt07", rank: "secondary", status: "active",
    payerName: "Blue Cross", payerId: PAYER_DIRECTORY["Blue Cross"].payerId, payerPhone: PAYER_DIRECTORY["Blue Cross"].phone, payerAddress: PAYER_DIRECTORY["Blue Cross"].address,
    planName: "Blue Cross Medigap Supplement", planType: "PPO", memberId: "BC-SUP-7300707", groupNumber: undefined,
    effectiveDate: "2022-01-01",
    policyHolder: { firstName: "Robert", lastName: "Flynn", dob: "1974-12-01", gender: "Male", relationshipToPatient: "self", address: { line1: "142 Maple Ridge Drive", city: "Penfield", state: "NY", zip: "14526" }, phone: "+1 (585) 221-0707" },
    copayPCP: 0, copaySpecialist: 0, coinsurance: 0,
    deductibleIndividualTotal: 0, deductibleIndividualMet: 0, oopMaxIndividualTotal: 0, oopMaxIndividualMet: 0,
    priorAuthRequired: false, acceptAssignment: true, notes: "Medigap — covers Medicare Part B coinsurance",
  },
];

export const ALL_INSURANCE_POLICIES: InsurancePolicy[] = [...INSURANCE_POLICIES, ...SECONDARY_OVERRIDES];

export function getPoliciesForPatient(patientId: string): InsurancePolicy[] {
  return ALL_INSURANCE_POLICIES.filter((p) => p.patientId === patientId).sort((a, b) => (a.rank === "primary" ? -1 : 1) - (b.rank === "primary" ? -1 : 1));
}

export function getPrimaryPolicy(patientId: string): InsurancePolicy | undefined {
  return ALL_INSURANCE_POLICIES.find((p) => p.patientId === patientId && p.rank === "primary");
}

// ── Prior authorizations (seed) ────────────────────────────────────────────
export const PRIOR_AUTHORIZATIONS: PriorAuthorization[] = [
  {
    id: "pa01", patientId: "pt11", insurancePolicyId: "ins_pt11", authNumber: "PA-88213640",
    serviceDescription: "Esketamine (Spravato) treatment series", cptCodes: ["G2082", "J3490"],
    status: "approved", requestedDate: "2026-07-02", decisionDate: "2026-07-09",
    validFrom: "2026-07-09", validTo: "2027-01-09", visitsApproved: 12, visitsUsed: 4,
    requestedBy: "Dana Ruiz", notes: "Approved after documented failure of 2 prior antidepressant trials.",
  },
  {
    id: "pa02", patientId: "pt07", insurancePolicyId: "ins_pt07", authNumber: "PA-77104412",
    serviceDescription: "Transcranial Magnetic Stimulation (TMS) series", cptCodes: ["90867", "90868"],
    status: "approved", requestedDate: "2026-05-14", decisionDate: "2026-05-20",
    validFrom: "2026-05-20", validTo: "2026-11-20", visitsApproved: 36, visitsUsed: 14,
    requestedBy: "Jordan Lee",
  },
  {
    id: "pa03", patientId: "pt14", insurancePolicyId: "ins_pt14",
    serviceDescription: "Psychological testing — comprehensive battery", cptCodes: ["96130", "96131"],
    status: "pending", requestedDate: "2026-09-05", visitsUsed: 0,
    requestedBy: "Erin Walsh", notes: "Submitted to Cigna; awaiting clinical review.",
  },
  {
    id: "pa04", patientId: "pt03", insurancePolicyId: "ins_pt03",
    serviceDescription: "Extended telehealth follow-up series", cptCodes: ["99214"],
    status: "denied", requestedDate: "2026-08-01", decisionDate: "2026-08-10", visitsUsed: 0,
    requestedBy: "Priya Shah", notes: "Denied — not medically necessary per payer review. Appeal in progress.",
  },
];

export function getPriorAuthsForPatient(patientId: string): PriorAuthorization[] {
  return PRIOR_AUTHORIZATIONS.filter((a) => a.patientId === patientId).sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
}

// ── Eligibility check history (seed) ───────────────────────────────────────
function benefitBreakdownFor(policy: InsurancePolicy): BenefitLine[] {
  return [
    { serviceType: "Office visit — behavioral health", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Psychiatric diagnostic evaluation", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Medication management", inNetwork: true, copay: policy.copayPCP, priorAuthRequired: false },
    { serviceType: "Telehealth — behavioral health", inNetwork: true, copay: policy.copaySpecialist, priorAuthRequired: false },
    { serviceType: "Psychological testing", inNetwork: true, coinsurance: policy.coinsurance, priorAuthRequired: true, notes: "Requires prior authorization" },
  ];
}

function buildHistoryFor(policy: InsurancePolicy, patientId: string, idx: number): EligibilityCheckReport[] {
  const reports: EligibilityCheckReport[] = [];
  const current: EligibilityCheckReport = {
    id: `elig_${patientId}_cur`, patientId, insurancePolicyId: policy.id,
    checkedAt: new Date(Date.now() - (1 + idx % 3) * 86400000).toISOString(),
    checkedBy: "System (auto — pre-visit batch)", source: "pre-visit-batch",
    status: policy.status === "active" ? "eligible" : policy.status === "pending" ? "expired" : "inactive",
    message: policy.status === "active" ? undefined : policy.status === "pending" ? "Coverage pending renewal — prior authorization may be required." : "Coverage inactive as of last verification.",
    planName: policy.planName, memberId: policy.memberId, planStatus: policy.status,
    copay: policy.copaySpecialist, coinsurance: policy.coinsurance,
    deductibleTotal: policy.deductibleIndividualTotal, deductibleMet: policy.deductibleIndividualMet,
    oopMaxTotal: policy.oopMaxIndividualTotal, oopMaxMet: policy.oopMaxIndividualMet,
    priorAuthRequired: policy.priorAuthRequired,
    benefitBreakdown: benefitBreakdownFor(policy),
  };
  reports.push(current);

  // one older, always-eligible historical check so the timeline shows change over time
  reports.push({
    ...current,
    id: `elig_${patientId}_h1`,
    checkedAt: new Date(Date.now() - (35 + idx) * 86400000).toISOString(),
    checkedBy: idx % 2 === 0 ? "Jordan Lee" : "Priya Shah",
    source: "check-in",
    status: "eligible",
    message: undefined,
    planStatus: "active",
    deductibleMet: Math.max(0, policy.deductibleIndividualMet - 400),
    oopMaxMet: Math.max(0, policy.oopMaxIndividualMet - 800),
  });

  return reports;
}

export const ELIGIBILITY_HISTORY: EligibilityCheckReport[] = ALL_INSURANCE_POLICIES
  .filter((p) => p.rank === "primary")
  .flatMap((policy, idx) => buildHistoryFor(policy, policy.patientId, idx));

export function getEligibilityHistoryForPatient(patientId: string): EligibilityCheckReport[] {
  return ELIGIBILITY_HISTORY.filter((e) => e.patientId === patientId).sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
}

export function getLatestEligibility(patientId: string): EligibilityCheckReport | undefined {
  return getEligibilityHistoryForPatient(patientId)[0];
}

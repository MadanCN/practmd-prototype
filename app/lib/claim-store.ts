"use client";

// Claims — the payer-facing half of the revenue cycle. A Charge (superbill,
// created when a provider signs a note — see charge-store.ts) becomes a
// Claim here once Revenue Management converts it. From there: scrub → send
// → payer response (paid / partial / denied). A denied or partial response
// spins off a "patient-responsibility" Invoice (invoice-store.ts) so the
// balance can be collected the same way a copay is — one Collect Payment
// flow for every money-from-patient scenario.
//
// The CMS-1500 rendering pulls its fields live from whatever charge /
// patient / insurance / appointment data exists right now, rather than
// freezing a copy at claim-creation time — so editing a patient's insurance
// after a claim was created is reflected next time the form is viewed
// (matches how a real biller would re-pull before submission).

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { getCharges, type Charge } from "@/lib/charge-store";
import { getPatientProfile } from "@/data/provider-patients";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { PROVIDERS } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import { getPrimaryPolicy, getPriorAuthsForPatient } from "@/lib/insurance-store";
import { createInvoice, type Invoice } from "@/lib/invoice-store";

export type ClaimStatus =
  | "draft" | "scrub-failed" | "ready-to-send" | "submitted"
  | "paid" | "partially-paid" | "denied" | "appealed" | "closed";

export interface ScrubIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface PayerResponse {
  outcome: "paid" | "partial" | "denied";
  allowedAmount: number;
  paidAmount: number;
  patientResponsibility: number;
  denialReason?: string;
  eraDate: string;
  remark?: string;
}

export interface ClaimActivity {
  id: string;
  at: string;
  actor: string;
  description: string;
}

export interface Claim {
  id: string;
  chargeId: string;
  invoiceId?: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  policyId?: string;
  status: ClaimStatus;
  totalCharge: number;
  resubmissionCount: number;
  scrubIssues: ScrubIssue[];
  payerResponse?: PayerResponse;
  createdAt: string;
  createdBy: string;
  submittedAt?: string;
  activity: ClaimActivity[];
}

interface StoreState {
  claims: Claim[];
}

function now() { return new Date().toISOString(); }
function genId(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

const store = createPersistedStore<StoreState>({
  key: "claim-store",
  initial: { claims: [] },
  revive: (raw, initial) => ({ claims: (raw as StoreState)?.claims ?? initial.claims }),
});

function set(updater: (s: StoreState) => StoreState) {
  store.set(updater);
}

export function useClaimStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getClaims(): Claim[] {
  return store.get().claims;
}

export function getClaim(id: string): Claim | undefined {
  return store.get().claims.find((c) => c.id === id);
}

export function getClaimsForPatient(patientId: string): Claim[] {
  return store.get().claims.filter((c) => c.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getClaimForCharge(chargeId: string): Claim | undefined {
  return store.get().claims.find((c) => c.chargeId === chargeId);
}

function addActivity(claim: Claim, actor: string, description: string): Claim {
  return { ...claim, activity: [...claim.activity, { id: genId("act"), at: now(), actor, description }] };
}

/** Idempotent — converting the same charge twice returns the existing claim. */
export function createClaimFromCharge(charge: Charge, createdBy: string): Claim {
  const existing = getClaimForCharge(charge.id);
  if (existing) return existing;
  const policy = getPrimaryPolicy(charge.patientId);
  const claim: Claim = {
    id: genId("clm"),
    chargeId: charge.id,
    patientId: charge.patientId,
    patientName: charge.patientName,
    appointmentId: charge.appointmentId,
    policyId: policy?.id,
    status: "draft",
    totalCharge: charge.total,
    resubmissionCount: 0,
    scrubIssues: [],
    createdAt: now(),
    createdBy,
    activity: [{ id: genId("act"), at: now(), actor: createdBy, description: `Claim created from charge ${charge.id}` }],
  };
  set((s) => ({ claims: [claim, ...s.claims] }));
  return claim;
}

export function linkInvoiceToClaim(claimId: string, invoiceId: string) {
  set((s) => ({ claims: s.claims.map((c) => c.id === claimId ? { ...c, invoiceId } : c) }));
}

// ── CMS-1500 field mapping ──────────────────────────────────────────────────

export interface Cms1500Data {
  box1_insuranceType: string;
  box1a_insuredId: string;
  box2_patientName: string;
  box3_patientDob: string;
  box3_patientSex: string;
  box4_insuredName: string;
  box5_patientAddress: string;
  box6_relationshipToInsured: string;
  box7_insuredAddress: string;
  box9_otherInsuredName: string;
  box11_policyGroupNumber: string;
  box11a_insuredDob: string;
  box11a_insuredSex: string;
  box11c_planName: string;
  box11d_otherHealthPlan: boolean;
  box14_dateOfCurrentIllness: string;
  box17_referringProvider: string;
  box17b_referringNpi: string;
  box21_diagnoses: { letter: string; code: string; label: string }[];
  box21_icdIndicator: string;
  box22_resubmissionCode: string;
  box23_priorAuthNumber: string;
  box24_lines: {
    dateOfService: string;
    placeOfService: string;
    emg: string;
    cpt: string;
    modifiers: string;
    diagnosisPointer: string;
    charges: string;
    units: string;
    renderingProviderNpi: string;
  }[];
  box25_taxId: string;
  box26_patientAccountNo: string;
  box27_acceptAssignment: boolean;
  box28_totalCharge: string;
  box29_amountPaid: string;
  box30_balanceDue: string;
  box31_signature: string;
  box32_serviceFacility: string;
  box32a_facilityNpi: string;
  box33_billingProvider: string;
  box33a_billingNpi: string;
}

function fmtMoney(n: number) {
  return n.toFixed(2);
}

function fmtDateBox(iso: string | undefined) {
  if (!iso) return "";
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
}

const RELATIONSHIP_LABEL: Record<string, string> = { self: "Self", spouse: "Spouse", child: "Child", other: "Other" };

export function buildCms1500(claim: Claim): { data: Cms1500Data; charge?: Charge; warnings: string[] } {
  const warnings: string[] = [];
  const charge = getCharges().find((c) => c.id === claim.chargeId);
  const patient = getPatientProfile(claim.patientId);
  const policy = claim.policyId ? getPrimaryPolicy(claim.patientId) : undefined;
  const appt = claim.appointmentId ? CC_APPOINTMENTS.find((a) => a.id === claim.appointmentId) : undefined;
  const clinicId = appt?.clinicId ?? "penfield-psychiatry";
  const clinic = CLINICS.find((c) => c.id === clinicId) ?? CLINICS.find((c) => c.id === "penfield-psychiatry")!;
  const renderingProvider =
    (appt && PROVIDERS.find((p) => p.id === appt.providerId)) ??
    (charge && PROVIDERS.find((p) => p.displayName === charge.providerName)) ??
    PROVIDERS[0];
  const priorAuth = getPriorAuthsForPatient(claim.patientId).find((a) => a.status === "approved");

  if (!patient) warnings.push("Patient record not found.");
  if (!charge) warnings.push("Underlying charge not found.");

  const diagnoses = (charge?.diagnoses ?? []).map((d, i) => ({ letter: String.fromCharCode(65 + i), code: d.code, label: d.label }));
  const dxIndex = new Map(diagnoses.map((d, i) => [d.code, i]));

  const lines = (charge?.lines ?? []).map((l) => {
    const pointers = (l.dxPointers || "1").split(",").map((s) => s.trim()).filter(Boolean);
    const letters = pointers.map((p) => {
      const asIndex = parseInt(p, 10);
      if (!Number.isNaN(asIndex) && diagnoses[asIndex - 1]) return diagnoses[asIndex - 1].letter;
      const byCode = dxIndex.get(p);
      return byCode != null ? diagnoses[byCode].letter : "A";
    });
    return {
      dateOfService: fmtDateBox(charge?.dateOfService),
      placeOfService: l.pos || "11",
      emg: "",
      cpt: l.code,
      modifiers: l.modifiers,
      diagnosisPointer: letters.join(","),
      charges: fmtMoney(parseFloat(l.charge) || 0),
      units: l.units || "1",
      renderingProviderNpi: renderingProvider.npi,
    };
  });

  const data: Cms1500Data = {
    box1_insuranceType: policy?.planType === "Medicare" ? "Medicare" : policy?.planType === "Medicaid" ? "Medicaid" : "Group Health Plan",
    box1a_insuredId: policy?.memberId ?? "",
    box2_patientName: patient ? `${patient.lastName}, ${patient.firstName}` : "",
    box3_patientDob: fmtDateBox(patient?.dob),
    box3_patientSex: patient?.gender?.[0] ?? "",
    box4_insuredName: policy ? `${policy.policyHolder.lastName}, ${policy.policyHolder.firstName}` : (patient ? `${patient.lastName}, ${patient.firstName}` : ""),
    box5_patientAddress: patient ? `${patient.address.line1}, ${patient.address.city}, ${patient.address.state} ${patient.address.zip}` : "",
    box6_relationshipToInsured: policy ? RELATIONSHIP_LABEL[policy.policyHolder.relationshipToPatient] : "Self",
    box7_insuredAddress: policy ? `${policy.policyHolder.address.line1}, ${policy.policyHolder.address.city}, ${policy.policyHolder.address.state} ${policy.policyHolder.address.zip}` : "",
    box9_otherInsuredName: "",
    box11_policyGroupNumber: policy?.groupNumber ?? "",
    box11a_insuredDob: fmtDateBox(policy?.policyHolder.dob),
    box11a_insuredSex: policy?.policyHolder.gender?.[0] ?? "",
    box11c_planName: policy?.planName ?? "",
    box11d_otherHealthPlan: false,
    box14_dateOfCurrentIllness: fmtDateBox(charge?.dateOfService),
    box17_referringProvider: "",
    box17b_referringNpi: "",
    box21_diagnoses: diagnoses,
    box21_icdIndicator: "0",
    box22_resubmissionCode: claim.resubmissionCount > 0 ? "7" : "",
    box23_priorAuthNumber: priorAuth?.authNumber ?? "",
    box24_lines: lines,
    box25_taxId: clinic.tin || "—",
    box26_patientAccountNo: patient?.mrn ?? "",
    box27_acceptAssignment: policy?.acceptAssignment ?? true,
    box28_totalCharge: fmtMoney(claim.totalCharge),
    box29_amountPaid: fmtMoney(claim.payerResponse?.paidAmount ?? 0),
    box30_balanceDue: fmtMoney(Math.max(0, claim.totalCharge - (claim.payerResponse?.paidAmount ?? 0))),
    box31_signature: renderingProvider.displayName,
    box32_serviceFacility: `${clinic.name}, ${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.zip}`,
    box32a_facilityNpi: clinic.npi,
    box33_billingProvider: `${clinic.practice}, ${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.zip}, ${clinic.phone}`,
    box33a_billingNpi: clinic.npi,
  };

  return { data, charge, warnings };
}

// ── Scrubbing ────────────────────────────────────────────────────────────────

export function runScrub(claimId: string): ScrubIssue[] {
  const claim = getClaim(claimId);
  if (!claim) return [];
  const { data, charge, warnings } = buildCms1500(claim);
  const issues: ScrubIssue[] = warnings.map((w) => ({ field: "record", message: w, severity: "error" as const }));

  if (!charge) issues.push({ field: "charge", message: "No underlying charge to bill.", severity: "error" });
  if (!data.box2_patientName) issues.push({ field: "box2", message: "Patient name is missing.", severity: "error" });
  if (!data.box3_patientDob) issues.push({ field: "box3", message: "Patient date of birth is missing.", severity: "error" });
  if (!data.box5_patientAddress || data.box5_patientAddress.startsWith(",")) issues.push({ field: "box5", message: "Patient address is incomplete.", severity: "error" });
  if (!claim.policyId) issues.push({ field: "box1a", message: "No insurance policy on file — this patient should be billed self-pay instead of submitted as a claim.", severity: "error" });
  if (claim.policyId && !data.box1a_insuredId) issues.push({ field: "box1a", message: "Insured ID / member ID is missing.", severity: "error" });
  if (!data.box21_diagnoses.length) issues.push({ field: "box21", message: "At least one diagnosis code (ICD-10) is required.", severity: "error" });
  if (!data.box24_lines.length) issues.push({ field: "box24", message: "At least one service line (CPT) is required.", severity: "error" });
  data.box24_lines.forEach((l, i) => {
    if (!l.cpt || l.cpt === "—") issues.push({ field: `box24.${i + 1}`, message: `Line ${i + 1} is missing a valid CPT/HCPCS code.`, severity: "error" });
    if (!l.renderingProviderNpi) issues.push({ field: `box24.${i + 1}`, message: `Line ${i + 1} is missing the rendering provider NPI.`, severity: "error" });
    if (!l.diagnosisPointer) issues.push({ field: `box24.${i + 1}`, message: `Line ${i + 1} has no diagnosis pointer.`, severity: "warning" });
  });
  if (!data.box25_taxId || data.box25_taxId === "—") issues.push({ field: "box25", message: "Billing provider Tax ID is missing for this clinic.", severity: "warning" });
  if (!data.box33a_billingNpi) issues.push({ field: "box33", message: "Billing provider NPI is missing.", severity: "error" });

  const priorAuthRequired = claim.policyId ? getPrimaryPolicy(claim.patientId)?.priorAuthRequired : false;
  if (priorAuthRequired && !data.box23_priorAuthNumber) {
    issues.push({ field: "box23", message: "This payer requires prior authorization and no approved authorization number was found.", severity: "error" });
  }

  const hasError = issues.some((i) => i.severity === "error");
  set((s) => ({
    claims: s.claims.map((c) => {
      if (c.id !== claimId) return c;
      const next = addActivity(
        { ...c, scrubIssues: issues, status: hasError ? "scrub-failed" : "ready-to-send" },
        "System (scrubber)",
        hasError ? `Scrub failed — ${issues.filter((i) => i.severity === "error").length} error(s)` : "Scrub passed — ready to send",
      );
      return next;
    }),
  }));
  return issues;
}

// ── Send / payer response ───────────────────────────────────────────────────

export async function sendToPayer(claimId: string, sentBy: string): Promise<Claim> {
  await new Promise((r) => setTimeout(r, 1300)); // simulated clearinghouse round-trip
  let updated: Claim | undefined;
  set((s) => ({
    claims: s.claims.map((c) => {
      if (c.id !== claimId || c.status !== "ready-to-send") return c;
      const next = addActivity({ ...c, status: "submitted", submittedAt: now() }, sentBy, "Claim submitted to payer");
      updated = next;
      return next;
    }),
  }));
  if (!updated) throw new Error("Claim is not ready to send.");
  return updated;
}

export interface SimulatePayerResponseInput {
  claimId: string;
  outcome: "paid" | "partial" | "denied";
  denialReason?: string;
  actor: string;
}

/** Demo control: an RC specialist picks the payer outcome to explore every
 *  downstream scenario. A partial or denied outcome spins off a
 *  patient-responsibility invoice for the balance the payer didn't cover. */
export function simulatePayerResponse(input: SimulatePayerResponseInput): { claim: Claim; invoice?: Invoice } {
  const claim = getClaim(input.claimId);
  if (!claim || claim.status !== "submitted") throw new Error("Claim must be submitted before a payer response can be recorded.");

  const total = claim.totalCharge;
  let allowedAmount = total, paidAmount = total, patientResponsibility = 0, denialReason: string | undefined;
  if (input.outcome === "partial") {
    allowedAmount = Math.round(total * 0.72 * 100) / 100;
    paidAmount = Math.round(allowedAmount * 0.8 * 100) / 100;
    patientResponsibility = Math.round((total - paidAmount) * 100) / 100;
  } else if (input.outcome === "denied") {
    allowedAmount = 0; paidAmount = 0; patientResponsibility = total;
    denialReason = input.denialReason ?? "CO-16 — Claim lacks information needed for adjudication.";
  }

  const payerResponse: PayerResponse = {
    outcome: input.outcome, allowedAmount, paidAmount, patientResponsibility, denialReason,
    eraDate: now(), remark: input.outcome === "paid" ? "Paid in full per contracted rate." : undefined,
  };

  const nextStatus: ClaimStatus = input.outcome === "paid" ? "paid" : input.outcome === "partial" ? "partially-paid" : "denied";

  let invoice: Invoice | undefined;
  if (patientResponsibility > 0) {
    invoice = createInvoice({
      patientId: claim.patientId,
      patientName: claim.patientName,
      appointmentId: claim.appointmentId,
      chargeId: claim.chargeId,
      claimId: claim.id,
      type: "patient-responsibility",
      lineItems: [{
        description: input.outcome === "denied" ? "Balance due — claim denied by payer" : "Balance due after insurance payment",
        amount: patientResponsibility,
      }],
      createdBy: "System (payer response)",
      note: denialReason,
    });
  }

  let updated: Claim | undefined;
  set((s) => ({
    claims: s.claims.map((c) => {
      if (c.id !== input.claimId) return c;
      let next: Claim = { ...c, status: nextStatus, payerResponse, invoiceId: invoice?.id ?? c.invoiceId };
      next = addActivity(
        next, input.actor,
        input.outcome === "paid" ? `Payer paid in full — $${paidAmount.toFixed(2)}`
          : input.outcome === "partial" ? `Payer paid $${paidAmount.toFixed(2)} of $${total.toFixed(2)} — $${patientResponsibility.toFixed(2)} patient responsibility`
          : `Payer denied claim — ${denialReason}`,
      );
      updated = next;
      return next;
    }),
  }));
  if (!updated) throw new Error("Claim not found.");
  return { claim: updated, invoice };
}

export function appealClaim(claimId: string, actor: string, note: string) {
  set((s) => ({
    claims: s.claims.map((c) => c.id === claimId
      ? addActivity({ ...c, status: "appealed" }, actor, `Appeal filed — ${note}`)
      : c),
  }));
}

/** Denied or scrub-failed claims go back to draft for correction and resubmission. */
export function resubmitClaim(claimId: string, actor: string) {
  set((s) => ({
    claims: s.claims.map((c) => c.id === claimId
      ? addActivity({ ...c, status: "draft", resubmissionCount: c.resubmissionCount + 1, scrubIssues: [] }, actor, "Claim reopened for correction and resubmission")
      : c),
  }));
}

export function closeClaim(claimId: string, actor: string) {
  set((s) => ({
    claims: s.claims.map((c) => c.id === claimId ? addActivity({ ...c, status: "closed" }, actor, "Claim closed") : c),
  }));
}

// The clinical / credentialing dimension of the provider record: provider-type,
// capability flags, clinical-status lifecycle, credentials table, licensure and
// payer-enrolment. Kept separate from data/providers.ts (which the Care
// Coordinator + Admin portals also consume) and joined by provider id.
//
// Source: "Provider Portal" PRD — Persona, Capabilities, Clinical status
// lifecycle, Provider record, Milestone gates.

import { PROVIDERS } from "./providers";

/* ── Provider-type — one role, four capability profiles ─────────────────── */

export type ProviderTypeKey = "md-do" | "np-pa" | "therapist" | "supervising";

export const PROVIDER_TYPE_LABEL: Record<ProviderTypeKey, string> = {
  "md-do": "MD / DO (Psychiatrist)",
  "np-pa": "Nurse Practitioner / PA",
  therapist: "Therapist / Counsellor",
  supervising: "Supervising Provider",
};

/** Map the free-text providerType on data/providers.ts onto a PRD key. */
export function providerTypeKey(providerType: string): ProviderTypeKey {
  const t = providerType.toLowerCase();
  if (t.includes("psychiatr") || t.includes("md") || t.includes("physician")) return "md-do";
  if (t.includes("nurse") || t.includes("np") || t.includes("assistant") || t.includes("pa")) return "np-pa";
  return "therapist";
}

/* ── Capabilities — the third permission dimension ──────────────────────── */

export interface ProviderCapabilities {
  can_prescribe: boolean; // [SOON]
  can_diagnose: boolean;
  can_book: boolean;
  can_sign_notes: boolean;
  requires_cosign: boolean;
  can_cosign: boolean;
  can_order_labs: boolean; // [SOON]
  can_telehealth: boolean;
  can_bill: boolean;
  can_view_all_patients: boolean;
  can_view_full_note: boolean;
}

export const CAPABILITY_KEYS: (keyof ProviderCapabilities)[] = [
  "can_prescribe", "can_diagnose", "can_book", "can_sign_notes", "requires_cosign",
  "can_cosign", "can_order_labs", "can_telehealth", "can_bill",
  "can_view_all_patients", "can_view_full_note",
];

export const CAPABILITY_META: Record<keyof ProviderCapabilities, { label: string; gates: string; soon?: boolean }> = {
  can_prescribe: { label: "Prescribe", gates: "Prescribing actions", soon: true },
  can_diagnose: { label: "Diagnose", gates: "Entering diagnosis codes on a note" },
  can_book: { label: "Self-book", gates: "Book their own appointments" },
  can_sign_notes: { label: "Sign notes", gates: "Signing without co-signature" },
  requires_cosign: { label: "Requires co-signature", gates: "This provider's notes must be co-signed" },
  can_cosign: { label: "Co-sign", gates: "Co-signing a supervisee's note" },
  can_order_labs: { label: "Order labs", gates: "Lab ordering", soon: true },
  can_telehealth: { label: "Telehealth", gates: "Being bookable for video visits" },
  can_bill: { label: "Bill", gates: "Claims submitted under their NPI" },
  can_view_all_patients: { label: "View all patients", gates: "Record access beyond own panel" },
  can_view_full_note: { label: "View full note", gates: "Full narrative rather than coding summary" },
};

/** Capability defaults seeded from provider-type (PRD "Capability defaults by provider-type"). */
export function defaultCapabilities(type: ProviderTypeKey): ProviderCapabilities {
  const base: ProviderCapabilities = {
    can_prescribe: false, can_diagnose: true, can_book: false, can_sign_notes: false,
    requires_cosign: false, can_cosign: false, can_order_labs: false, can_telehealth: true,
    can_bill: true, can_view_all_patients: false, can_view_full_note: true,
  };
  switch (type) {
    case "md-do":
      return { ...base, can_prescribe: true, can_sign_notes: true, can_order_labs: true };
    case "np-pa":
      return { ...base, can_prescribe: true, can_sign_notes: true, can_order_labs: true };
    case "therapist":
      return { ...base, can_sign_notes: true };
    case "supervising":
      return { ...base, can_prescribe: true, can_sign_notes: true, can_cosign: true, can_order_labs: true };
  }
}

/* ── Clinical status lifecycle ─────────────────────────────────────────── */

export type ClinicalStatus =
  | "invited"
  | "account-setup"
  | "under-verification"
  | "pending-review"
  | "clinically-active"
  | "active-limited"
  | "suspended"
  | "offboarding"
  | "offboarded";

export interface StatusPermits {
  login: boolean;
  bookable: boolean | "telehealth-only";
  openEncounter: boolean;
  signNotes: boolean | "drafts-only";
  portal: "none" | "activation-wizard" | "limited" | "full" | "read-only";
}

export const STATUS_META: Record<ClinicalStatus, { label: string; permits: StatusPermits; banner?: string }> = {
  invited: {
    label: "Invited",
    permits: { login: false, bookable: false, openEncounter: false, signNotes: false, portal: "none" },
  },
  "account-setup": {
    label: "Account Setup",
    permits: { login: true, bookable: false, openEncounter: false, signNotes: false, portal: "activation-wizard" },
    banner: "Finish setting up your account to continue.",
  },
  "under-verification": {
    label: "Under Verification",
    permits: { login: true, bookable: false, openEncounter: false, signNotes: false, portal: "limited" },
    banner: "Your credentials are with the Credentialing team. You'll have full access once verification completes.",
  },
  "pending-review": {
    label: "Pending Review",
    permits: { login: true, bookable: false, openEncounter: false, signNotes: false, portal: "limited" },
    banner: "Your account is in final review. A few items still need to clear before you can see patients.",
  },
  "clinically-active": {
    label: "Clinically Active",
    permits: { login: true, bookable: true, openEncounter: true, signNotes: true, portal: "full" },
  },
  "active-limited": {
    label: "Active — Limited",
    permits: { login: true, bookable: "telehealth-only", openEncounter: true, signNotes: true, portal: "full" },
    banner: "In-person visit types are hidden while your in-person credentialing completes. Telehealth is fully available.",
  },
  suspended: {
    label: "Suspended",
    permits: { login: true, bookable: false, openEncounter: false, signNotes: "drafts-only", portal: "read-only" },
    banner: "Your clinical access is suspended. You can review existing drafts but cannot see patients or sign notes. Contact your Clinic Admin.",
  },
  offboarding: {
    label: "Offboarding",
    permits: { login: true, bookable: false, openEncounter: true, signNotes: true, portal: "full" },
    banner: "You are offboarding. No new appointments will be booked — please resolve your open encounters, unsigned notes and future appointments.",
  },
  offboarded: {
    label: "Offboarded",
    permits: { login: false, bookable: false, openEncounter: false, signNotes: false, portal: "none" },
  },
};

export const CLINICAL_STATUS_ORDER: ClinicalStatus[] = [
  "invited", "account-setup", "under-verification", "pending-review",
  "clinically-active", "active-limited", "suspended", "offboarding", "offboarded",
];

/* ── Credentials table ─────────────────────────────────────────────────── */

export type CredentialType = "License" | "DEA" | "Board Certification" | "Malpractice" | "Other";

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  issuingBody: string;
  number: string;
  issueDate?: string;
  expiryDate: string; // ISO date
}

export type CredentialStatus = "valid" | "expiring" | "expired";

export function credentialStatus(c: Credential, now = Date.now()): CredentialStatus {
  const exp = new Date(c.expiryDate + "T00:00:00").getTime();
  const days = (exp - now) / 86400000;
  if (days < 0) return "expired";
  if (days <= 60) return "expiring";
  return "valid";
}

/* ── Payer enrolment ──────────────────────────────────────────────────── */

export interface PayerEnrolment {
  payer: string;
  location: string;
  status: "enrolled" | "pending" | "not-started";
  submittedOn?: string;
}

/* ── The joined clinical profile ──────────────────────────────────────── */

export interface ProviderClinicalProfile {
  providerId: string;
  providerType: ProviderTypeKey;
  isSupervising: boolean;
  clinicalStatus: ClinicalStatus;
  capabilities: ProviderCapabilities;
  /** capability keys the admin has overridden away from the type default */
  capabilityOverrides: (keyof ProviderCapabilities)[];
  npi: string;
  taxonomyCode: string;
  caqhId?: string;
  dea?: string;
  employmentType: "Employed" | "Contractor" | "Locum";
  startDate: string;
  endDate?: string;
  licensedStates: string[];
  supervisorId?: string;
  superviseeIds: string[];
  credentials: Credential[];
  payerEnrolment: PayerEnrolment[];
}

function daysFromNow(d: number) {
  return new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
}

const RAW: Record<string, Omit<ProviderClinicalProfile, "capabilities" | "providerType" | "capabilityOverrides"> & {
  providerType: ProviderTypeKey;
  capabilityOverrides?: Partial<ProviderCapabilities>;
}> = {
  p1: {
    providerId: "p1", providerType: "md-do", isSupervising: true,
    clinicalStatus: "clinically-active",
    npi: "1234500001", taxonomyCode: "2084P0800X", caqhId: "12345678", dea: "BM1234563",
    employmentType: "Employed", startDate: "2019-03-04",
    licensedStates: ["New York", "New Jersey"],
    superviseeIds: ["p3", "p5"], supervisorId: undefined,
    capabilityOverrides: { can_cosign: true, can_view_all_patients: true },
    credentials: [
      { id: "cr1", name: "NY Medical License", type: "License", issuingBody: "New York", number: "PN-12345", issueDate: "2009-06-01", expiryDate: daysFromNow(420) },
      { id: "cr2", name: "NJ Medical License", type: "License", issuingBody: "New Jersey", number: "NJ-88771", issueDate: "2016-02-01", expiryDate: daysFromNow(240) },
      { id: "cr3", name: "DEA Registration", type: "DEA", issuingBody: "US DEA", number: "BM1234563", issueDate: "2021-05-01", expiryDate: daysFromNow(52) },
      { id: "cr4", name: "ABPN — Psychiatry", type: "Board Certification", issuingBody: "ABPN", number: "BC-55021", expiryDate: daysFromNow(900) },
      { id: "cr5", name: "Malpractice — Occurrence", type: "Malpractice", issuingBody: "MedPro Group", number: "MP-2024-771", expiryDate: daysFromNow(150) },
    ],
    payerEnrolment: [
      { payer: "Aetna", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "Blue Cross Blue Shield", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "Cigna", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "UnitedHealthcare", location: "Penfield Psychiatry", status: "pending", submittedOn: daysFromNow(-40) },
      { payer: "Medicare", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "Optum Behavioral Health", location: "Penfield Psychiatry", status: "pending", submittedOn: daysFromNow(-18) },
      { payer: "Aetna", location: "New Hartford", status: "pending", submittedOn: daysFromNow(-70) },
      { payer: "Fidelis Care", location: "New Hartford", status: "not-started" },
    ],
  },
  p2: {
    providerId: "p2", providerType: "therapist", isSupervising: true,
    clinicalStatus: "clinically-active",
    npi: "1234500002", taxonomyCode: "103T00000X", caqhId: "22222222",
    employmentType: "Employed", startDate: "2017-08-14",
    licensedStates: ["New York"], superviseeIds: ["p3"],
    capabilityOverrides: { can_cosign: true },
    credentials: [
      { id: "cr21", name: "NY Psychologist License", type: "License", issuingBody: "New York", number: "PY-67890", expiryDate: daysFromNow(310) },
      { id: "cr22", name: "Malpractice", type: "Malpractice", issuingBody: "The Trust", number: "T-99120", expiryDate: daysFromNow(200) },
    ],
    payerEnrolment: [
      { payer: "Aetna", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "Cigna", location: "Penfield Psychiatry", status: "enrolled" },
      { payer: "UnitedHealthcare", location: "Penfield Psychiatry", status: "enrolled" },
    ],
  },
  p3: {
    providerId: "p3", providerType: "therapist", isSupervising: false,
    clinicalStatus: "clinically-active",
    npi: "1234500003", taxonomyCode: "1041C0700X",
    employmentType: "Employed", startDate: "2023-01-09",
    licensedStates: ["New York"], superviseeIds: [], supervisorId: "p1",
    capabilityOverrides: { requires_cosign: true },
    credentials: [
      { id: "cr31", name: "NY LCSW License", type: "License", issuingBody: "New York", number: "SW-11223", expiryDate: daysFromNow(500) },
      { id: "cr32", name: "Malpractice", type: "Malpractice", issuingBody: "CPH & Associates", number: "CPH-4471", expiryDate: daysFromNow(95) },
    ],
    payerEnrolment: [
      { payer: "Blue Cross Blue Shield", location: "New Hartford", status: "enrolled" },
      { payer: "Excellus", location: "New Hartford", status: "pending", submittedOn: daysFromNow(-25) },
      { payer: "Medicaid", location: "New Hartford", status: "pending", submittedOn: daysFromNow(-55) },
    ],
  },
  p4: {
    providerId: "p4", providerType: "md-do", isSupervising: false,
    clinicalStatus: "active-limited",
    npi: "1234500004", taxonomyCode: "2084P0804X", dea: "BR9988771",
    employmentType: "Contractor", startDate: "2022-06-01",
    licensedStates: ["New Jersey"], superviseeIds: [],
    credentials: [
      { id: "cr41", name: "NJ Medical License", type: "License", issuingBody: "New Jersey", number: "PN-44556", expiryDate: daysFromNow(280) },
      { id: "cr42", name: "DEA Registration", type: "DEA", issuingBody: "US DEA", number: "BR9988771", expiryDate: daysFromNow(600) },
    ],
    payerEnrolment: [
      { payer: "Horizon NJ Health", location: "Shore Counseling", status: "pending", submittedOn: daysFromNow(-90) },
      { payer: "Aetna", location: "Shore Counseling", status: "enrolled" },
    ],
  },
  p5: {
    providerId: "p5", providerType: "therapist", isSupervising: false,
    clinicalStatus: "under-verification",
    npi: "1234500005", taxonomyCode: "101YM0800X",
    employmentType: "Employed", startDate: daysFromNow(-12),
    licensedStates: ["New York"], superviseeIds: [], supervisorId: "p1",
    capabilityOverrides: { requires_cosign: true },
    credentials: [
      { id: "cr51", name: "NY LPC License", type: "License", issuingBody: "New York", number: "LPC-77889", expiryDate: daysFromNow(700) },
      { id: "cr52", name: "CADC", type: "Other", issuingBody: "NAADAC", number: "CADC-2231", expiryDate: daysFromNow(-8) },
    ],
    payerEnrolment: [
      { payer: "Cigna", location: "Penfield Psychiatry", status: "pending", submittedOn: daysFromNow(-20) },
      { payer: "Medicaid", location: "Penfield Psychiatry", status: "not-started" },
    ],
  },
};

export function buildClinicalProfile(providerId: string): ProviderClinicalProfile {
  const raw = RAW[providerId] ?? RAW.p1;
  const type: ProviderTypeKey = raw.isSupervising && raw.providerType === "md-do" ? "md-do" : raw.providerType;
  const defaults = defaultCapabilities(raw.isSupervising ? "supervising" : type);
  const overrides = raw.capabilityOverrides ?? {};
  const capabilities = { ...defaults, ...overrides };
  const capabilityOverrides = (Object.keys(overrides) as (keyof ProviderCapabilities)[])
    .filter((k) => overrides[k] !== defaults[k]);
  return {
    ...raw,
    providerType: type,
    capabilities,
    capabilityOverrides,
  };
}

export const CLINICAL_PROFILES: Record<string, ProviderClinicalProfile> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, buildClinicalProfile(p.id)]),
);

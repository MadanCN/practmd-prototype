// The Provider record as specified by the "Invite provider to organization"
// requirements (PRM-105): Identity & Credentials, Access & Services, Schedule,
// Profile & Bio. Enrollment is deliberately NOT part of this schema (future
// consideration).
//
// data/providers.ts (the legacy `Provider` shape) is still what the Care
// Coordinator and Provider portals read; lib/provider-store.ts keeps the two
// in sync. Seed providers are lifted into this shape by `seedProviderRecord`.

import { PROVIDERS, type Provider, type WorkingHour } from "./providers";
import { CLINICS } from "./clinics";
import { buildClinicalProfile, defaultCapabilities, providerTypeKey, type ClinicalStatus } from "./provider-credentialing";
import { DEFAULT_COUNTRY } from "./geo";
import { onlyDigits, addDaysIso, todayIso } from "@/lib/provider-validation";

/* ── Credential ID qualifiers ─────────────────────────────────────────────
 * The first ten are NUCC CMS-1500 "Other ID" qualifiers; the last four are
 * PractMD additions (DEA/CTP/NADEAN are needed for e-prescribing, CAQH for
 * payer enrolment, "Service Provider Number" for payer-specific ids). */

export const NPI_QUALIFIER = "NPI";

export const ID_QUALIFIERS: { key: string; label: string }[] = [
  { key: "0B", label: "(0B) State License Number" },
  { key: "1B", label: "(1B) Blue Shield Provider Number" },
  { key: "1C", label: "(1C) Medicare Provider Number" },
  { key: "1D", label: "(1D) Medicaid Provider Number" },
  { key: "1G", label: "(1G) Provider UPIN Number" },
  { key: "1H", label: "(1H) CHAMPUS Identification Number" },
  { key: "EI", label: "(EI) Employer's Identification Number" },
  { key: "G2", label: "(G2) Provider Commercial Number" },
  { key: "LU", label: "(LU) Location Number" },
  { key: "N5", label: "(N5) Provider Plan Network ID Number" },
  { key: "SY", label: "(SY) Social Security Number" },
  { key: "X5", label: "(X5) State Industrial Accident Provider Number" },
  { key: "ZZ", label: "(ZZ) Provider Taxonomy" },
  { key: "SERVICE_PROVIDER", label: "Service Provider Number" },
  { key: "DEA", label: "DEA Number" },
  { key: "CTP", label: "CTP Number" },
  { key: "NADEAN", label: "Narcotics Addiction DEA Number (NADEAN)" },
  { key: "CAQH", label: "CAQH ID" },
];

export const qualifierLabel = (key: string) =>
  key === NPI_QUALIFIER ? "NPI" : ID_QUALIFIERS.find((q) => q.key === key)?.label ?? key;

export interface CredentialRow {
  id: string;
  qualifier: string; // NPI_QUALIFIER for the fixed first row, else an ID_QUALIFIERS key
  value: string;
  expiry: string; // ISO date or ""
}

/* ── Capabilities ─────────────────────────────────────────────────────────
 * Individually togglable privileges layered on the core "Provider" role.
 * (Not to be confused with the older clinical `ProviderCapabilities` in
 * data/provider-credentialing.ts, which the Provider portal's permission
 * gates still use. Configurable capability overrides are the next piece of
 * work.) */

export interface AccessCapabilities {
  telehealth_license: boolean;
  e_prescribing: boolean;
  can_book: boolean;
  can_sign_notes: boolean;
  requires_cosign: boolean;
  can_cosign: boolean;
  can_order_labs: boolean;
  can_be_billed: boolean;
  can_view_all_patients: boolean;
  can_see_reports: boolean;
  include_for_self_scheduling: boolean;
}
export type CapabilityKey = keyof AccessCapabilities;

export const CAPABILITY_ORDER: CapabilityKey[] = [
  "telehealth_license", "e_prescribing", "can_book", "can_sign_notes", "can_view_all_patients",
  "requires_cosign", "can_cosign", "can_order_labs", "can_be_billed",
  "can_see_reports", "include_for_self_scheduling",
];

export const ACCESS_CAPABILITY_META: Record<CapabilityKey, { label: string; description: string; soon?: boolean }> = {
  telehealth_license: {
    label: "Telehealth License",
    description: "Lets the provider be booked for video visits and run sessions in PractMD Telehealth. Uses one of the organization's purchased licences.",
  },
  e_prescribing: {
    label: "E-Prescribing License",
    description: "Electronic prescribing from the encounter note.",
    soon: true,
  },
  can_book: {
    label: "Can Book",
    description: "Lets the provider book their own appointments — + New Appointment appears for them, always pre-filled with their own name.",
  },
  can_sign_notes: {
    label: "Can Sign Notes",
    description: "Signs their own notes without a co-signature. Off by default for a provider who Requires Co-sign — that's a separate flag, not the absence of this one.",
  },
  can_view_all_patients: {
    label: "Can View All Patients",
    description: "Record access beyond their own panel — every patient at the clinics they have access to.",
  },
  requires_cosign: {
    label: "Requires Co-sign",
    description: "This provider's notes must be co-signed: \"Sign\" is replaced by \"Sign and Request Co-sign\".",
  },
  can_cosign: {
    label: "Can Co-sign",
    description: "Appears in other providers' co-sign list and gives this provider a Co-sign task queue.",
  },
  can_order_labs: {
    label: "Can Order Labs",
    description: "Lab ordering from the encounter.",
    soon: true,
  },
  can_be_billed: {
    label: "Can Be Billed",
    description: "Claims can be submitted under this provider's NPI.",
  },
  can_see_reports: {
    label: "Can See Reports",
    description: "Shows the Reports area (not the dashboard) to this provider.",
  },
  include_for_self_scheduling: {
    label: "Include for Self-Scheduling",
    description: "Shows this provider to patients during self-scheduling. Unlocks the Profile & Bio section.",
  },
};

/* ── Consultation modes (Schedule) ──────────────────────────────────────── */

export type ConsultMode = "in-person" | "video" | "phone";
export const CONSULT_MODES: { key: ConsultMode; label: string }[] = [
  { key: "in-person", label: "Walk-in / In-person Consultation" },
  { key: "video", label: "Video Consultation" },
  { key: "phone", label: "Phone Consultation" },
];

/* ── Profile & Bio ─────────────────────────────────────────────────────── */

export interface EducationRow { id: string; degree: string; institution: string; year: string }

/* ── The record ────────────────────────────────────────────────────────── */

export interface PendingHoursChange {
  effectiveFrom: string; // ISO date
  hours: WorkingHour[];
  scheduledAt: string;
  scheduledBy: string;
}

export interface ProviderRecord {
  id: string;
  // Identity & Credentials
  lastName: string;
  firstName: string;
  middleName: string;
  credentialsSuffix: string;
  email: string;
  phone: string;
  status: ClinicalStatus;
  ein: string; // 9 bare digits
  fax: string; // 10 bare digits or ""
  taxonomyCode: string;
  dob: string;
  photo: string; // data: URL or ""
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  credentials: CredentialRow[];
  // Access & Services
  clinicAccess: string[];
  visitTypes: string[];
  specializations: string[];
  providerType: string;
  color: string;
  capabilities: AccessCapabilities;
  // Schedule
  availableFor: ConsultMode[];
  workingHours: WorkingHour[];
  pendingWorkingHours?: PendingHoursChange;
  // Profile & Bio
  aboutProvider: string;
  education: EducationRow[];
  yearsExperience: string;
  experienceSummary: string;
  servicesProvided: string[];
  // Lifecycle / meta
  isActive: boolean;
  /** false after the login email is changed on an accepted account, until re-verified */
  emailVerified: boolean;
  createdAt: string;
  createdBy: string;
  /** set when "Mark the provider Clinically Active" bypassed the status lifecycle */
  verificationBypass?: { by: string; at: string };
}

export const providerDisplayName = (r: Pick<ProviderRecord, "firstName" | "lastName" | "credentialsSuffix">) =>
  `${r.firstName} ${r.lastName}${r.credentialsSuffix ? `, ${r.credentialsSuffix}` : ""}`.trim();

export const providerInitials = (r: Pick<ProviderRecord, "firstName" | "lastName">) =>
  `${r.firstName[0] ?? ""}${r.lastName[0] ?? ""}`.toUpperCase();

/** Statuses at which the provider has (or is past) accepting the invitation. */
export const PRE_ACCEPTANCE_STATUSES: ClinicalStatus[] = ["invited"];
/** DOB is optional at invite, required once verification can begin. */
export const DOB_OPTIONAL_STATUSES: ClinicalStatus[] = ["invited", "account-setup"];

/* ── Org-level constants (prototype stand-ins for tenant config) ────────── */

/** The signed-in Clinic Admin, for audit trails. */
export const CURRENT_ADMIN = { id: "a3", name: "Sarah Kowalski", role: "Clinic Admin" };

const seedTelehealthUsed = PROVIDERS.filter((p) => p.telehealthEnabled && !p.isDeleted).length;
/** Telehealth licences the organization has purchased (demo: a little headroom over the seed). */
export const TELEHEALTH_LICENSES_PURCHASED = Math.ceil((seedTelehealthUsed + 3) / 10) * 10;

/* ── Blank record for Add ──────────────────────────────────────────────── */

export function newCredentialId() {
  return `cr_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyCapabilities(): AccessCapabilities {
  return {
    telehealth_license: false, e_prescribing: false, can_book: false, can_sign_notes: true, requires_cosign: false,
    can_cosign: false, can_order_labs: false, can_be_billed: true, can_view_all_patients: false,
    can_see_reports: false, include_for_self_scheduling: false,
  };
}

/* ── Lifting the legacy seed into the record shape ─────────────────────── */

const CORE_SEED_IDS = ["p1", "p2", "p3", "p4", "p5"];

/** Demo lifecycle states so the invite / resend / expiry / deactivated paths
 *  can be walked through against real rows. See lib/provider-store.ts for the
 *  matching invitation records. */
export const DEMO_INVITED: Record<string, { status: ClinicalStatus; isActive?: boolean }> = {
  p6: { status: "invited" },            // live invitation
  p7: { status: "invited" },            // expired invitation
  p8: { status: "invited", isActive: false }, // deactivated before accepting
  p9: { status: "account-setup" },      // invitation accepted, still setting up
};

function daysFromNowIso(d: number) {
  return addDaysIso(todayIso(), d);
}

function primaryClinic(p: Provider) {
  return CLINICS.find((c) => c.id === p.clinicAccess[0]);
}

function stripCountry(v: string) {
  const d = onlyDigits(v);
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

function parseEducation(list: string[] | undefined, idPrefix: string): EducationRow[] {
  return (list ?? []).map((raw, i) => {
    const m = raw.match(/^(.*?) — (.*?)(?: \((\d{4})[^)]*\))?$/);
    return { id: `${idPrefix}_ed${i}`, degree: m?.[1] ?? raw, institution: m?.[2] ?? "", year: m?.[3] ?? "" };
  });
}

export function seedProviderRecord(p: Provider): ProviderRecord {
  const core = CORE_SEED_IDS.includes(p.id);
  const profile = core ? buildClinicalProfile(p.id) : null;
  const demo = DEMO_INVITED[p.id];
  const clinic = primaryClinic(p);
  const n = Number(p.id.slice(1)) || 0;

  const credentials: CredentialRow[] = [{ id: `${p.id}_npi`, qualifier: NPI_QUALIFIER, value: p.npi, expiry: "" }];
  if (profile) {
    profile.credentials.forEach((c, i) => {
      if (c.type === "License") credentials.push({ id: `${p.id}_c${i}`, qualifier: "0B", value: c.number, expiry: c.expiryDate });
      else if (c.type === "DEA") credentials.push({ id: `${p.id}_c${i}`, qualifier: "DEA", value: c.number, expiry: c.expiryDate });
    });
    if (profile.caqhId) credentials.push({ id: `${p.id}_caqh`, qualifier: "CAQH", value: profile.caqhId, expiry: "" });
  } else {
    // n=12 → an already-expired licence, n=13 → one inside the 60-day window
    const days = n === 12 ? -20 : n === 13 ? 30 : 200 + ((n * 37) % 500);
    credentials.push({ id: `${p.id}_lic`, qualifier: "0B", value: p.licenseNumber, expiry: daysFromNowIso(days) });
  }

  const caps = (() => {
    const base = emptyCapabilities();
    if (profile) {
      const c = profile.capabilities;
      return {
        ...base,
        telehealth_license: p.telehealthEnabled, e_prescribing: c.can_prescribe, can_book: c.can_book,
        can_sign_notes: c.can_sign_notes,
        requires_cosign: c.requires_cosign, can_cosign: c.can_cosign, can_order_labs: c.can_order_labs,
        can_be_billed: c.can_bill, can_view_all_patients: c.can_view_all_patients, can_see_reports: true,
        include_for_self_scheduling: p.acceptingNewPatients ?? true,
      };
    }
    const c = defaultCapabilities(providerTypeKey(p.providerType));
    return {
      ...base,
      telehealth_license: p.telehealthEnabled, e_prescribing: c.can_prescribe, can_order_labs: c.can_order_labs,
      can_sign_notes: c.can_sign_notes,
      can_be_billed: c.can_bill, can_see_reports: true, include_for_self_scheduling: p.acceptingNewPatients ?? true,
    };
  })();

  const modes: ConsultMode[] = ["in-person", ...(p.telehealthEnabled ? (["video"] as ConsultMode[]) : [])];

  return {
    id: p.id,
    lastName: p.lastName, firstName: p.firstName, middleName: "",
    credentialsSuffix: p.credentials,
    email: p.email, phone: p.phone,
    status: demo?.status ?? profile?.clinicalStatus ?? "clinically-active",
    ein: clinic ? onlyDigits(clinic.tin) : "",
    fax: clinic ? stripCountry(clinic.fax) : "",
    taxonomyCode: profile?.taxonomyCode ?? "",
    dob: p.dob, photo: "",
    addressLine1: p.street.slice(0, 35), addressLine2: "",
    country: DEFAULT_COUNTRY, state: p.state, city: p.city, zip: p.zip,
    credentials,
    clinicAccess: [...p.clinicAccess], visitTypes: [...p.visitTypes], specializations: [...p.specializations],
    providerType: p.providerType, color: p.color, capabilities: caps,
    availableFor: modes, workingHours: p.workingHours,
    aboutProvider: p.bio, education: parseEducation(p.education, p.id),
    yearsExperience: p.yearsExperience != null ? String(p.yearsExperience) : "",
    experienceSummary: "", servicesProvided: [...p.services],
    isActive: demo?.isActive ?? p.isActive,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z", createdBy: "Data import",
  };
}

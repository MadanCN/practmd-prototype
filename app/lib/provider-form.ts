// Form model for the shared Add / Edit Provider screen: state shape, mapping to
// and from the record, clinic-hours defaults, and the validation +
// Edit-guardrail engine. Pure — no React.

import { CLINICS, DAYS, locationsForClinics } from "@/data/clinics";
import type { WorkingHour, WorkingHourSegment } from "@/data/providers";
import { DEFAULT_COUNTRY, citiesOf, statesOf } from "@/data/geo";
import {
  DOB_OPTIONAL_STATUSES, NPI_QUALIFIER, TELEHEALTH_LICENSES_PURCHASED,
  emptyCapabilities, providerDisplayName,
  type CredentialRow, type ProviderRecord,
} from "@/data/provider-record";
import {
  appointmentsStrandedByHours, confirmedAtClinic, confirmedVideo, pendingCosignCount,
} from "@/lib/provider-impact";
import {
  findEmailConflict, emailConflictMessage, telehealthLicensesUsed, type ProviderStoreState,
} from "@/lib/provider-store";
import {
  isValidEin, isValidEmail, isValidFax, isValidPhone, isValidZip, npiError, onlyDigits, todayIso,
} from "@/lib/provider-validation";

export type SectionId = "identity" | "access" | "schedule" | "profile";
export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "identity", label: "Identity & Credentials" },
  { id: "access", label: "Access & Services" },
  { id: "schedule", label: "Schedule" },
  { id: "profile", label: "Profile & Bio" },
];

export const NPI_ROW_ID = "npi-row";
export const ADDRESS_MAX = 35;

export type ProviderForm = Omit<ProviderRecord, "id" | "createdAt" | "createdBy" | "status" | "isActive" | "emailVerified" | "pendingWorkingHours" | "verificationBypass"> & {
  /** Add-only */
  sendInvite: boolean;
  markActive: boolean;
  /** Edit-only: date a working-hours change takes effect */
  applyFrom: string;
};

/* ── Working-hours helpers ───────────────────────────────────────────── */

/** Clinic business hours → provider hours at the clinic's primary location. */
export function defaultHoursFromClinics(clinicIds: string[]): WorkingHour[] {
  const clinic = CLINICS.filter((c) => c.isActive).find((c) => clinicIds.includes(c.id));
  if (!clinic) return DAYS.map((day) => ({ day, isWorking: false, segments: [] }));
  const loc = (clinic.locations.find((l) => l.isPrimary) ?? clinic.locations[0])?.id ?? "";
  return DAYS.map((day) => {
    const bh = clinic.businessHours.find((b) => b.day === day);
    if (!bh || !bh.isOpen || !loc) return { day, isWorking: false, segments: [] };
    const segments: WorkingHourSegment[] = bh.breakStart && bh.breakEnd
      ? [{ locationId: loc, startTime: bh.openTime, endTime: bh.breakStart }, { locationId: loc, startTime: bh.breakEnd, endTime: bh.closeTime }]
      : [{ locationId: loc, startTime: bh.openTime, endTime: bh.closeTime }];
    return { day, isWorking: true, segments };
  });
}

const norm = (hours: WorkingHour[]) =>
  DAYS.map((d) => {
    const h = hours.find((x) => x.day === d);
    return { d, w: !!h?.isWorking, s: (h?.segments ?? []).map((s) => `${s.locationId}|${s.startTime}|${s.endTime}`).sort() };
  });
export const hoursEqual = (a: WorkingHour[], b: WorkingHour[]) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

const mins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Per-segment problems for a day, keyed by segment index. */
export function segmentIssues(day: WorkingHour, allowedLocationIds: string[]): Record<number, string> {
  const out: Record<number, string> = {};
  day.segments.forEach((s, i) => {
    if (!s.locationId) out[i] = "Choose a location";
    else if (!allowedLocationIds.includes(s.locationId)) out[i] = "This location belongs to a clinic that is no longer ticked in Clinic Access";
    else if (!s.startTime || !s.endTime) out[i] = "Set a start and end time";
    else if (mins(s.endTime) <= mins(s.startTime)) out[i] = "End time must be after start time";
  });
  day.segments.forEach((a, i) => {
    if (out[i]) return;
    day.segments.forEach((b, j) => {
      if (j <= i || out[j] || !b.startTime || !b.endTime) return;
      if (mins(a.startTime) < mins(b.endTime) && mins(b.startTime) < mins(a.endTime)) out[j] = "Overlaps another row on this day";
    });
  });
  return out;
}

/* ── Defaults / mapping ──────────────────────────────────────────────── */

export function emptyForm(): ProviderForm {
  return {
    lastName: "", firstName: "", middleName: "", credentialsSuffix: "", email: "", phone: "",
    ein: "", fax: "", taxonomyCode: "", dob: "", photo: "",
    addressLine1: "", addressLine2: "", country: DEFAULT_COUNTRY, state: "", city: "", zip: "",
    credentials: [{ id: NPI_ROW_ID, qualifier: NPI_QUALIFIER, value: "", expiry: "" }],
    clinicAccess: [], visitTypes: [], specializations: [], providerType: "", color: "",
    capabilities: { ...emptyCapabilities(), can_be_billed: true },
    availableFor: ["in-person"], workingHours: defaultHoursFromClinics([]),
    aboutProvider: "", education: [], yearsExperience: "", experienceSummary: "", servicesProvided: [],
    sendInvite: true, markActive: false, applyFrom: "",
  };
}

export function formFromRecord(r: ProviderRecord): ProviderForm {
  const creds: CredentialRow[] = r.credentials.some((c) => c.qualifier === NPI_QUALIFIER)
    ? [...r.credentials].sort((a, b) => Number(b.qualifier === NPI_QUALIFIER) - Number(a.qualifier === NPI_QUALIFIER))
    : [{ id: NPI_ROW_ID, qualifier: NPI_QUALIFIER, value: "", expiry: "" }, ...r.credentials];
  return {
    lastName: r.lastName, firstName: r.firstName, middleName: r.middleName, credentialsSuffix: r.credentialsSuffix,
    email: r.email, phone: r.phone, ein: r.ein, fax: r.fax, taxonomyCode: r.taxonomyCode, dob: r.dob, photo: r.photo,
    addressLine1: r.addressLine1, addressLine2: r.addressLine2, country: r.country, state: r.state, city: r.city, zip: r.zip,
    credentials: creds,
    clinicAccess: [...r.clinicAccess], visitTypes: [...r.visitTypes], specializations: [...r.specializations],
    providerType: r.providerType, color: r.color, capabilities: { ...r.capabilities },
    availableFor: [...r.availableFor], workingHours: r.workingHours.map((h) => ({ ...h, segments: h.segments.map((s) => ({ ...s })) })),
    aboutProvider: r.aboutProvider, education: r.education.map((e) => ({ ...e })),
    yearsExperience: r.yearsExperience, experienceSummary: r.experienceSummary, servicesProvided: [...r.servicesProvided],
    sendInvite: false, markActive: false, applyFrom: "",
  };
}

export type FormFields = Omit<ProviderForm, "sendInvite" | "markActive" | "applyFrom">;
export function stripFormMeta(f: ProviderForm): FormFields {
  const { sendInvite: _a, markActive: _b, applyFrom: _c, ...rest } = f;
  void _a; void _b; void _c;
  return {
    ...rest,
    email: rest.email.trim(),
    firstName: rest.firstName.trim(), lastName: rest.lastName.trim(), middleName: rest.middleName.trim(),
    credentialsSuffix: rest.credentialsSuffix.trim(),
    ein: onlyDigits(rest.ein), fax: onlyDigits(rest.fax),
  };
}

/* ── Validation ──────────────────────────────────────────────────────── */

export interface FieldIssue {
  msg: string;
  /** "required" = not filled yet (shown once touched); "invalid" = wrong / blocked (always shown) */
  kind: "required" | "invalid";
  section: SectionId;
}

export interface Advisory { section: SectionId; tone: "warn" | "info"; msg: string }

export interface ValidationCtx {
  mode: "add" | "edit";
  original?: ProviderRecord;
  store: ProviderStoreState;
}

export interface ValidationResult {
  issues: Record<string, FieldIssue>;
  advisories: Record<string, Advisory>;
  /** confirmed future appointments the admin must resolve first */
  clinicBlockers: Record<string, ReturnType<typeof confirmedAtClinic>>;
  hoursStranded: ReturnType<typeof appointmentsStrandedByHours>;
  hoursChanged: boolean;
  pendingLock: boolean;
  counts: Record<SectionId, { required: number; invalid: number }>;
  valid: boolean;
}

export function validateForm(f: ProviderForm, ctx: ValidationCtx): ValidationResult {
  const issues: Record<string, FieldIssue> = {};
  const advisories: Record<string, Advisory> = {};
  const req = (key: string, section: SectionId, msg = "Required") => { issues[key] = { msg, kind: "required", section }; };
  const bad = (key: string, section: SectionId, msg: string) => { issues[key] = { msg, kind: "invalid", section }; };
  const editing = ctx.mode === "edit";
  const status = ctx.original?.status ?? "invited";
  const verificationNeeded = f.markActive || (editing && !DOB_OPTIONAL_STATUSES.includes(status));

  /* Identity & Credentials */
  if (!f.lastName.trim()) req("lastName", "identity");
  if (!f.firstName.trim()) req("firstName", "identity");
  if (!f.credentialsSuffix.trim()) req("credentialsSuffix", "identity");

  if (!f.email.trim()) req("email", "identity");
  else if (!isValidEmail(f.email)) bad("email", "identity", "Enter a valid email address");
  else {
    const conflict = findEmailConflict(ctx.store, f.email, ctx.original?.id);
    if (conflict) bad("email", "identity", emailConflictMessage(conflict));
  }

  if (!f.phone.trim()) req("phone", "identity");
  else if (!isValidPhone(f.phone)) bad("phone", "identity", "Enter a 10-digit phone number");

  if (!onlyDigits(f.ein)) req("ein", "identity");
  else if (!isValidEin(f.ein)) bad("ein", "identity", "EIN is 9 digits (XX-XXXXXXX)");

  if (f.fax && !isValidFax(f.fax)) bad("fax", "identity", "Fax is 10 digits");
  if (f.taxonomyCode && !/^[A-Za-z0-9]{1,15}$/.test(f.taxonomyCode)) bad("taxonomyCode", "identity", "Up to 15 letters or digits");

  if (!f.dob) { if (verificationNeeded) req("dob", "identity", f.markActive ? "Required when marking Clinically Active" : "Required before verification"); }
  else if (f.dob > todayIso()) bad("dob", "identity", "Date of birth can't be in the future");

  if (!f.addressLine1.trim()) req("addressLine1", "identity");
  if (!f.country) req("country", "identity");
  if (!f.state) req("state", "identity");
  if (!f.city) req("city", "identity");
  if (!f.zip) req("zip", "identity");
  else if (!isValidZip(f.zip, f.country)) bad("zip", "identity", f.country === "Canada" ? "Postal code looks like A1A 1A1" : "ZIP is 5 digits, or 5+4");

  const seen = new Set<string>();
  f.credentials.forEach((c, i) => {
    const isNpi = c.qualifier === NPI_QUALIFIER;
    const kq = `cred.${c.id}.qualifier`, kv = `cred.${c.id}.value`;
    if (!c.qualifier) req(kq, "identity");
    if (isNpi) {
      if (c.value) { const e = npiError(c.value); if (e) bad(kv, "identity", e); }
      else if (verificationNeeded) req(kv, "identity", f.markActive ? "Required when marking Clinically Active" : "Required before verification");
    } else {
      if (!c.value.trim()) req(kv, "identity");
      else if (c.value.length > 30) bad(kv, "identity", "Up to 30 characters");
    }
    if (c.qualifier && c.value.trim()) {
      const sig = `${c.qualifier}|${c.value.trim().toLowerCase()}`;
      if (seen.has(sig)) bad(kv, "identity", "This exact ID (qualifier + value) is already listed");
      seen.add(sig);
    }
    void i;
  });

  /* Access & Services */
  if (!f.clinicAccess.length) req("clinicAccess", "access", "Select at least one clinic");
  if (!f.providerType) req("providerType", "access");

  const clinicBlockers: Record<string, ReturnType<typeof confirmedAtClinic>> = {};
  if (editing && ctx.original) {
    for (const cid of ctx.original.clinicAccess.filter((c) => !f.clinicAccess.includes(c))) {
      const appts = confirmedAtClinic(ctx.original.id, cid);
      if (appts.length) {
        clinicBlockers[cid] = appts;
        const name = CLINICS.find((c) => c.id === cid)?.name ?? cid;
        bad("clinicAccess", "access", `${appts.length} confirmed future appointment${appts.length === 1 ? "" : "s"} at ${name} — resolve them before removing access`);
      }
    }
  }

  const c = f.capabilities;
  if (c.requires_cosign && c.can_cosign) bad("cosign", "access", "Requires Co-sign and Can Co-sign can't both be on");
  if (c.telehealth_license && !ctx.original?.capabilities.telehealth_license) {
    if (telehealthLicensesUsed(ctx.store, ctx.original?.id) >= TELEHEALTH_LICENSES_PURCHASED) bad("telehealth_license", "access", "No Telehealth licences remain");
  }

  if (editing && ctx.original) {
    const o = ctx.original.capabilities;
    if (o.telehealth_license && !c.telehealth_license) {
      const n = confirmedVideo(ctx.original.id).length;
      advisories.telehealthOff = {
        section: "access", tone: "warn",
        msg: `Turning this off removes ${ctx.original.firstName}'s access to PractMD Telehealth.${n ? ` ${n} confirmed video consult${n === 1 ? "" : "s"} will have their links inaccessible.` : " Any video consults confirmed with them will have their links inaccessible."} Assign the licence again and access — including those appointment links — is restored.`,
      };
    }
    if (o.can_cosign && !c.can_cosign) {
      const n = pendingCosignCount(providerDisplayName(ctx.original)) + pendingCosignCount(ctx.original.firstName + " " + ctx.original.lastName);
      advisories.cosignOff = {
        section: "access", tone: "warn",
        msg: `${n} co-sign request${n === 1 ? " is" : "s are"} waiting on this provider. Make sure they have signed all co-sign requests before turning this off.`,
      };
    }
    if (!o.requires_cosign && c.requires_cosign) {
      advisories.cosignOn = { section: "access", tone: "info", msg: "Applies to new notes only — notes already signed are unaffected." };
    }
  }

  /* Schedule */
  const locationIds = locationsForClinics(f.clinicAccess).map((l) => l.id);
  const pendingLock = !!ctx.original?.pendingWorkingHours;
  const workingDays = f.workingHours.filter((h) => h.isWorking);
  if (!f.clinicAccess.length) req("hours", "schedule", "Select Clinic Access first");
  else if (!workingDays.length) req("hours", "schedule", "Set at least one working day");
  for (const day of f.workingHours) {
    if (!day.isWorking) continue;
    if (!day.segments.length) { req(`hours.${day.day}`, "schedule", "Add working hours or untick the day"); continue; }
    const seg = segmentIssues(day, locationIds);
    for (const [idx, msg] of Object.entries(seg)) bad(`hours.${day.day}.${idx}`, "schedule", msg);
  }
  if (f.availableFor.includes("video") && !c.telehealth_license) {
    advisories.videoNoLicense = { section: "schedule", tone: "warn", msg: "Video Consultation is ticked but this provider has no Telehealth License — they won't have access to PractMD Telehealth." };
  }

  let hoursChanged = false;
  let hoursStranded: ReturnType<typeof appointmentsStrandedByHours> = [];
  if (editing && ctx.original) {
    hoursChanged = !hoursEqual(f.workingHours, ctx.original.workingHours);
    if (hoursChanged) {
      if (pendingLock) bad("hours.apply", "schedule", "A working-hours change is already scheduled — no further changes until it takes effect");
      else if (!f.applyFrom) req("hours.apply", "schedule", "Choose the date these hours apply from");
      else if (f.applyFrom < todayIso()) bad("hours.apply", "schedule", "Choose today or a later date");
      else {
        hoursStranded = appointmentsStrandedByHours(ctx.original.id, ctx.original.workingHours, f.workingHours, f.applyFrom);
        if (hoursStranded.length) bad("hours.apply", "schedule", `${hoursStranded.length} confirmed appointment${hoursStranded.length === 1 ? "" : "s"} fall outside the new hours from ${f.applyFrom} — resolve them first`);
      }
    }
  }

  /* Profile & Bio — only enforced when Include for self-scheduling is on */
  if (c.include_for_self_scheduling) {
    if (!f.aboutProvider.trim()) req("aboutProvider", "profile");
    if (f.yearsExperience !== "" && (!/^\d{1,2}$/.test(f.yearsExperience) || Number(f.yearsExperience) > 70)) bad("yearsExperience", "profile", "Enter a whole number of years (0–70)");
    f.education.forEach((e) => { if (!e.degree.trim()) req(`edu.${e.id}.degree`, "profile", "Degree is required"); });
  }

  /* Geography sanity: a child value that no longer belongs to its parent */
  if (f.state && f.country && !statesOf(f.country).some((s) => s.name === f.state) && statesOf(f.country).length) bad("state", "identity", "Choose a state for this country");
  if (f.city && f.state && citiesOf(f.country, f.state).length && !citiesOf(f.country, f.state).includes(f.city)) bad("city", "identity", "Choose a city for this state");

  const counts = { identity: { required: 0, invalid: 0 }, access: { required: 0, invalid: 0 }, schedule: { required: 0, invalid: 0 }, profile: { required: 0, invalid: 0 } };
  for (const i of Object.values(issues)) counts[i.section][i.kind === "required" ? "required" : "invalid"]++;
  if (!c.include_for_self_scheduling) counts.profile = { required: 0, invalid: 0 };

  return {
    issues, advisories, clinicBlockers, hoursStranded, hoursChanged, pendingLock, counts,
    valid: Object.keys(issues).length === 0,
  };
}


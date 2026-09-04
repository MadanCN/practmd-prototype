// Rich patient-profile model for the provider portal's Patients area, layered
// over the thin shared CC_PATIENTS records. Prototype seed data only.

import { CC_PATIENTS, type CcPatient } from "./cc-patients";
import { CC_APPOINTMENTS } from "./cc-appointments";

export const CURRENT_PROVIDER_ID = "p1";

// ── Care coordinators ────────────────────────────────────────────────────────
export interface CareCoordinator {
  id: string;
  name: string;
  initials: string;
  email: string;
}

export const CARE_COORDINATORS: CareCoordinator[] = [
  { id: "cc1", name: "Jordan Lee", initials: "JL", email: "j.lee@penfieldpsych.com" },
  { id: "cc2", name: "Priya Shah", initials: "PS", email: "p.shah@penfieldpsych.com" },
  { id: "cc3", name: "Dana Ruiz", initials: "DR", email: "d.ruiz@penfieldpsych.com" },
  { id: "cc4", name: "Erin Walsh", initials: "EW", email: "e.walsh@penfieldpsych.com" },
];

export function getCareCoordinator(id: string | undefined): CareCoordinator | undefined {
  return CARE_COORDINATORS.find((c) => c.id === id);
}

// ── Profile model ───────────────────────────────────────────────────────────
export type PhrStatus = "active" | "inactive" | "pending-verification";

export interface CommsPreferences {
  email: boolean;
  text: boolean;
  voice: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Caregiver {
  name: string;
  relationship: "Legal Guardian" | "POA" | "Parent" | "Guardian";
  phone?: string;
  /** set when the caregiver is themselves a patient in the system */
  linkedPatientId?: string;
}

export interface SecondaryAccount {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  accountCreated: boolean;
}

export interface PatientProfile extends CcPatient {
  middleName?: string;
  preferredName?: string;
  pronouns?: string;
  status: "active" | "inactive";
  clinicId: string;
  clinicName: string;
  patientType: string;
  /** another patient this record is linked to (family / household) */
  linkedPatientId?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  homePhone?: string;
  emergencyContact: EmergencyContact;
  caregiver?: Caregiver;
  preferences: CommsPreferences;
  phr: {
    status: PhrStatus;
    accountEmail: string;
    secondaryAccounts: SecondaryAccount[];
  };
  referral: {
    source: string;
    specificSource?: string;
  };
  careCoordinatorId: string;
}

// ── Age helper ──────────────────────────────────────────────────────────────
export function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Seed construction ───────────────────────────────────────────────────────
const PATIENT_TYPES = ["Established Patient", "New Patient", "Telehealth Only", "Self-Pay"];
const REFERRAL_SOURCES = [
  "Primary Care Referral",
  "Insurance Directory",
  "Psychology Today",
  "Web Search",
  "Friend / Family",
  "Employer EAP",
  "Returning Patient",
];
const STREETS = [
  "142 Maple Ridge Drive", "88 Lakeview Terrace", "2307 Genesee Street",
  "17 Cobblestone Court", "540 Winton Road", "9 Birchwood Lane",
  "1120 Fairport Nine Mile Pt Rd", "76 Harvest Circle", "331 Linden Avenue",
];
const CITIES = ["Penfield", "Rochester", "Fairport", "Pittsford", "Webster", "Brighton"];

function base(p: CcPatient, i: number): PatientProfile {
  const first = p.firstName;
  const homeArea = p.phone.slice(0, 8);
  return {
    ...p,
    status: p.insuranceStatus === "inactive" ? "inactive" : "active",
    pronouns: p.gender === "Female" ? "She / Her" : p.gender === "Male" ? "He / Him" : "They / Them",
    clinicId: "penfield-psychiatry",
    clinicName: "Penfield Psychiatry",
    patientType: PATIENT_TYPES[i % PATIENT_TYPES.length],
    address: {
      line1: STREETS[i % STREETS.length],
      city: CITIES[i % CITIES.length],
      state: "NY",
      country: "United States",
      zip: `145${(20 + i).toString().padStart(2, "0")}`,
    },
    homePhone: `${homeArea} ${(100 + i).toString()}-0${(10 + i).toString()}0`,
    emergencyContact: {
      name: `${["Sarah", "Michael", "Grace", "Daniel", "Rosa", "Kevin"][i % 6]} ${p.lastName}`,
      relationship: ["Spouse", "Parent", "Sibling", "Partner", "Friend"][i % 5],
      phone: `${homeArea} ${(200 + i).toString()}-0${(20 + i).toString()}0`,
    },
    preferences: {
      email: true,
      text: i % 3 !== 0,
      voice: i % 4 === 0,
    },
    phr: {
      status:
        p.insuranceStatus === "pending"
          ? "pending-verification"
          : p.insuranceStatus === "inactive"
            ? "inactive"
            : "active",
      accountEmail: p.email,
      secondaryAccounts: [],
    },
    referral: {
      source: REFERRAL_SOURCES[i % REFERRAL_SOURCES.length],
      specificSource:
        REFERRAL_SOURCES[i % REFERRAL_SOURCES.length] === "Primary Care Referral"
          ? "Dr. Rachel Moore — Penfield Family Medicine"
          : REFERRAL_SOURCES[i % REFERRAL_SOURCES.length] === "Friend / Family"
            ? `Referred by ${first}'s cousin`
            : undefined,
    },
    careCoordinatorId: CARE_COORDINATORS[i % CARE_COORDINATORS.length].id,
  };
}

/** Hand-authored detail for a few representative charts. */
const OVERRIDES: Record<string, Partial<PatientProfile>> = {
  pt01: {
    middleName: "Andrew",
    preferredName: "Jim",
    pronouns: "He / Him",
    patientType: "Established Patient",
    address: { line1: "142 Maple Ridge Drive", city: "Penfield", state: "NY", country: "United States", zip: "14526" },
    homePhone: "+1 (585) 412-0100",
    emergencyContact: { name: "Sarah Holloway", relationship: "Spouse", phone: "+1 (585) 412-0102" },
    caregiver: undefined,
    preferences: { email: true, text: true, voice: false },
    phr: {
      status: "active",
      accountEmail: "james.holloway@email.com",
      secondaryAccounts: [
        { id: "sa01", name: "Ethan Holloway", relationship: "Child", email: undefined, accountCreated: false },
      ],
    },
    referral: { source: "Primary Care Referral", specificSource: "Dr. Rachel Moore — Penfield Family Medicine" },
    careCoordinatorId: "cc1",
  },
  pt03: {
    middleName: "T.",
    pronouns: "He / Him",
    patientType: "Established Patient",
    emergencyContact: { name: "Angela Webb", relationship: "Spouse", phone: "+1 (585) 512-0304" },
    preferences: { email: true, text: false, voice: true },
    phr: { status: "active", accountEmail: "mwebb@email.com", secondaryAccounts: [] },
    referral: { source: "Insurance Directory" },
    careCoordinatorId: "cc2",
  },
  pt08: {
    preferredName: "Ash",
    pronouns: "She / Her",
    patientType: "New Patient",
    caregiver: { name: "Diane Thompson", relationship: "Parent", phone: "+1 (315) 850-0810" },
    preferences: { email: true, text: true, voice: false },
    phr: { status: "pending-verification", accountEmail: "aisha.t@email.com", secondaryAccounts: [] },
    referral: { source: "Web Search" },
    careCoordinatorId: "cc3",
  },
  pt11: {
    middleName: "Ray",
    pronouns: "He / Him",
    patientType: "Established Patient",
    emergencyContact: { name: "Helen Carter", relationship: "Sister", phone: "+1 (315) 533-1113" },
    preferences: { email: false, text: true, voice: true },
    phr: { status: "active", accountEmail: "d.carter@email.com", secondaryAccounts: [] },
    referral: { source: "Returning Patient" },
    careCoordinatorId: "cc1",
  },
  pt14: {
    preferredName: "Carmen",
    pronouns: "She / Her",
    patientType: "Telehealth Only",
    emergencyContact: { name: "Luis Rivera", relationship: "Spouse", phone: "+1 (315) 888-1416" },
    preferences: { email: true, text: true, voice: true },
    phr: { status: "active", accountEmail: "c.rivera@email.com", secondaryAccounts: [] },
    referral: { source: "Psychology Today" },
    careCoordinatorId: "cc4",
  },
};

export const PATIENT_PROFILES: Record<string, PatientProfile> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const merged = { ...base(p, i), ...OVERRIDES[p.id] };
    return [p.id, merged];
  }),
);

export function getPatientProfile(id: string): PatientProfile | undefined {
  return PATIENT_PROFILES[id];
}

// ── This provider's panel ───────────────────────────────────────────────────
/** Patient ids with any appointment (past, present or requested) with p1. */
export const MY_PATIENT_IDS: string[] = [
  ...new Set(
    CC_APPOINTMENTS.filter((a) => a.providerId === CURRENT_PROVIDER_ID).map((a) => a.patientId),
  ),
];

export function getMyPatients(): PatientProfile[] {
  return MY_PATIENT_IDS.map((id) => PATIENT_PROFILES[id]).filter(Boolean);
}

// ── Visit helpers ───────────────────────────────────────────────────────────
const PAST_STATUSES = ["completed", "no-show"];
const UPCOMING_STATUSES = ["confirmed", "arrived", "in-session"];

export interface VisitRef {
  id: string;
  date: string;
  startTime: string;
  visitType: string;
  mode: string;
}

function toVisitRef(a: (typeof CC_APPOINTMENTS)[number]): VisitRef {
  return { id: a.id, date: a.date, startTime: a.startTime, visitType: a.visitType, mode: a.mode };
}

export function getLastVisit(patientId: string, providerId = CURRENT_PROVIDER_ID): VisitRef | null {
  const today = new Date().toISOString().split("T")[0];
  const past = CC_APPOINTMENTS
    .filter((a) => a.patientId === patientId && a.providerId === providerId && a.date <= today && PAST_STATUSES.includes(a.status))
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  return past[0] ? toVisitRef(past[0]) : null;
}

export function getNextVisit(patientId: string, providerId = CURRENT_PROVIDER_ID): VisitRef | null {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = CC_APPOINTMENTS
    .filter((a) => a.patientId === patientId && a.providerId === providerId && a.date >= today && UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  return upcoming[0] ? toVisitRef(upcoming[0]) : null;
}

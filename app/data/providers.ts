import { DAYS, type BusinessHour, type DayName } from "./clinics";

export { type BusinessHour };

export type WorkingHour = BusinessHour;

function wh(
  day: DayName, isOpen: boolean,
  openTime = "09:00", closeTime = "17:00",
  breakStart = "12:00", breakEnd = "13:00"
): WorkingHour {
  return { day, isOpen, openTime, closeTime, breakStart, breakEnd };
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  email: string;
  phone: string;
  dob: string;
  providerType: string;
  npi: string;
  licenseNumber: string;
  licenseState: string;
  specializations: string[];
  clinicAccess: string[];
  color: string;
  credentials: string;
  bio: string;
  languages: string[];
  street: string;
  city: string;
  state: string;
  zip: string;
  visitTypes: string[];
  services: string[];
  telehealthEnabled: boolean;
  permissionRole: string;
  isActive: boolean;
  isDeleted: boolean;
  workingHours: WorkingHour[];
  kind: "provider";
  // ── optional enriched-profile fields (populated for p1) ──
  yearsExperience?: number;
  education?: string[];
  boardCertifications?: string[];
  insuranceAccepted?: string[];
  acceptingNewPatients?: boolean;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  staffType: string;
  clinicAccess: string[];
  role: string;
  isActive: boolean;
  isDeleted: boolean;
  kind: "staff";
}

export type TeamMember = Provider | StaffMember;

const defaultWH: WorkingHour[] = [
  wh("Monday", true), wh("Tuesday", true), wh("Wednesday", true),
  wh("Thursday", true), wh("Friday", true),
  wh("Saturday", false), wh("Sunday", false),
];

/** Hand-authored, richly-detailed providers — used across demo flows. */
const HAND_AUTHORED_PROVIDERS: Provider[] = [
  {
    id: "p1", kind: "provider",
    firstName: "Sarah", lastName: "Mitchell", displayName: "Dr. Sarah Mitchell",
    gender: "Female", email: "s.mitchell@penfieldpsych.com", phone: "+1 (585) 388-6101",
    dob: "1978-04-15", providerType: "Psychiatrist", npi: "1234500001",
    licenseNumber: "PN-12345", licenseState: "New York",
    specializations: ["Adult Psychiatry", "Mood Disorders", "Anxiety"],
    clinicAccess: ["penfield-psychiatry", "new-hartford"],
    color: "#3b82f6", credentials: "MD, FAPA", bio: "Dr. Mitchell is a board-certified psychiatrist with over 15 years of experience specializing in adult mood disorders and anxiety.",
    languages: ["English", "Spanish"], street: "120 Oak Lane", city: "Penfield", state: "New York", zip: "14526",
    visitTypes: ["Initial Consultation", "Follow-Up", "Medication Check"],
    services: ["Psychiatry", "Psychopharmacology", "Telehealth Consultation"],
    telehealthEnabled: true, permissionRole: "Attending Physician",
    isActive: true, isDeleted: false,
    workingHours: [
      wh("Monday", true, "09:00", "17:00", "12:00", "13:00"),
      wh("Tuesday", true, "09:00", "17:00", "12:00", "13:00"),
      wh("Wednesday", false),
      wh("Thursday", true, "09:00", "17:00", "12:00", "13:00"),
      wh("Friday", true, "09:00", "15:00", "", ""),
      wh("Saturday", false), wh("Sunday", false),
    ],
    yearsExperience: 15,
    education: [
      "MD — University of Rochester School of Medicine (2004)",
      "Residency, Psychiatry — Massachusetts General Hospital (2008)",
      "Fellowship, Mood & Anxiety Disorders — McLean Hospital (2009)",
    ],
    boardCertifications: [
      "American Board of Psychiatry & Neurology — Psychiatry (2009, recertified 2019)",
      "Fellow, American Psychiatric Association (FAPA)",
    ],
    insuranceAccepted: ["Aetna", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Medicare", "Optum Behavioral Health"],
    acceptingNewPatients: true,
  },
  {
    id: "p2", kind: "provider",
    firstName: "James", lastName: "O'Brien", displayName: "Dr. James O'Brien",
    gender: "Male", email: "j.obrien@penfieldpsych.com", phone: "+1 (585) 388-6102",
    dob: "1975-09-22", providerType: "Psychologist", npi: "1234500002",
    licenseNumber: "PY-67890", licenseState: "New York",
    specializations: ["Cognitive Behavioral Therapy", "Trauma", "ADHD"],
    clinicAccess: ["penfield-psychiatry"],
    color: "#8b5cf6", credentials: "PhD", bio: "Dr. O'Brien specializes in evidence-based treatments for trauma, ADHD, and complex psychological conditions.",
    languages: ["English"], street: "45 Maple Ave", city: "Rochester", state: "New York", zip: "14620",
    visitTypes: ["Initial Consultation", "Therapy Session"],
    services: ["Individual Therapy", "Psychological Testing"],
    telehealthEnabled: true, permissionRole: "Licensed Psychologist",
    insuranceAccepted: ["Aetna", "Cigna", "UnitedHealthcare", "Optum Behavioral Health"],
    acceptingNewPatients: true,
    isActive: true, isDeleted: false,
    workingHours: [
      wh("Monday", true, "10:00", "18:00", "13:00", "14:00"),
      wh("Tuesday", false),
      wh("Wednesday", true, "10:00", "18:00", "13:00", "14:00"),
      wh("Thursday", false),
      wh("Friday", true, "10:00", "16:00", "", ""),
      wh("Saturday", false), wh("Sunday", false),
    ],
  },
  {
    id: "p3", kind: "provider",
    firstName: "Lisa", lastName: "Nguyen", displayName: "Lisa Nguyen, LCSW",
    gender: "Female", email: "l.nguyen@newhartfordpsych.com", phone: "+1 (315) 555-0120",
    dob: "1985-02-08", providerType: "Licensed Clinical Social Worker", npi: "1234500003",
    licenseNumber: "SW-11223", licenseState: "New York",
    specializations: ["Depression", "Grief & Loss", "Family Therapy"],
    clinicAccess: ["new-hartford"],
    color: "#10b981", credentials: "LCSW", bio: "Lisa Nguyen is a licensed clinical social worker dedicated to helping individuals and families navigate life transitions.",
    languages: ["English", "Vietnamese"], street: "22 River Road", city: "Utica", state: "New York", zip: "13501",
    visitTypes: ["Initial Consultation", "Therapy Session", "Group Session"],
    services: ["Individual Therapy", "Family Therapy", "Group Therapy"],
    telehealthEnabled: false, permissionRole: "Licensed Therapist",
    insuranceAccepted: ["Blue Cross Blue Shield", "Excellus", "Fidelis Care", "Medicaid"],
    acceptingNewPatients: true,
    isActive: true, isDeleted: false,
    workingHours: [
      wh("Monday", false),
      wh("Tuesday", true, "08:00", "16:00", "12:00", "13:00"),
      wh("Wednesday", true, "08:00", "16:00", "12:00", "13:00"),
      wh("Thursday", true, "08:00", "16:00", "12:00", "13:00"),
      wh("Friday", true, "08:00", "14:00", "", ""),
      wh("Saturday", false), wh("Sunday", false),
    ],
  },
  {
    id: "p4", kind: "provider",
    firstName: "Marcus", lastName: "Reid", displayName: "Dr. Marcus Reid",
    gender: "Male", email: "m.reid@shorecounseling.com", phone: "+1 (609) 555-0220",
    dob: "1980-11-30", providerType: "Psychiatrist", npi: "1234500004",
    licenseNumber: "PN-44556", licenseState: "New Jersey",
    specializations: ["Child & Adolescent Psychiatry", "Autism Spectrum", "ADHD"],
    clinicAccess: ["shore-counseling"],
    color: "#f59e0b", credentials: "MD", bio: "Dr. Reid is a child and adolescent psychiatrist with expertise in neurodevelopmental conditions.",
    languages: ["English"], street: "88 Shore Drive", city: "Ocean City", state: "New Jersey", zip: "08226",
    visitTypes: ["Initial Consultation", "Follow-Up", "Medication Check"],
    services: ["Child Psychiatry", "Adolescent Psychiatry"],
    telehealthEnabled: true, permissionRole: "Attending Physician",
    insuranceAccepted: ["Aetna", "Blue Cross Blue Shield", "Cigna", "Horizon NJ Health", "Medicaid"],
    acceptingNewPatients: false,
    isActive: true, isDeleted: false,
    workingHours: defaultWH,
  },
  {
    id: "p5", kind: "provider",
    firstName: "Amara", lastName: "Johnson", displayName: "Amara Johnson, LPC",
    gender: "Female", email: "a.johnson@penfieldpsych.com", phone: "+1 (585) 388-6103",
    dob: "1990-06-14", providerType: "Licensed Professional Counselor", npi: "1234500005",
    licenseNumber: "LPC-77889", licenseState: "New York",
    specializations: ["Substance Use", "Motivational Interviewing", "CBT"],
    clinicAccess: ["penfield-psychiatry", "shore-counseling"],
    color: "#ec4899", credentials: "LPC, CADC", bio: "Amara Johnson specializes in substance use recovery and motivational approaches to behavioral change.",
    languages: ["English"], street: "310 Elmwood Ave", city: "Rochester", state: "New York", zip: "14610",
    visitTypes: ["Therapy Session", "Group Session"],
    services: ["Individual Therapy", "Group Therapy", "Substance Use Counseling"],
    telehealthEnabled: true, permissionRole: "Licensed Therapist",
    insuranceAccepted: ["Cigna", "UnitedHealthcare", "Medicaid", "Medicare"],
    acceptingNewPatients: true,
    isActive: true, isDeleted: false,
    workingHours: [
      wh("Monday", true, "11:00", "19:00", "14:00", "15:00"),
      wh("Tuesday", true, "11:00", "19:00", "14:00", "15:00"),
      wh("Wednesday", true, "11:00", "19:00", "14:00", "15:00"),
      wh("Thursday", false),
      wh("Friday", false),
      wh("Saturday", true, "09:00", "13:00", "", ""),
      wh("Sunday", false),
    ],
  },
];

export const STAFF: StaffMember[] = [
  { id: "s1", kind: "staff", firstName: "Aelxa", lastName: "Chatmon", displayName: "Aelxa Chatmon", email: "achatmon@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s2", kind: "staff", firstName: "Archana", lastName: "Ganesh", displayName: "Archana Ganesh", email: "archana.ganesh@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s3", kind: "staff", firstName: "Bianca", lastName: "Ramos", displayName: "Bianca Ramos", email: "bramos@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s4", kind: "staff", firstName: "Brian", lastName: "McIntyre", displayName: "Brian McIntyre", email: "bmcintyre@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s5", kind: "staff", firstName: "Clara", lastName: "Sukshitha", displayName: "Clara S", email: "sukshitha@accession.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s6", kind: "staff", firstName: "Ebony", lastName: "Earley", displayName: "Ebony Earley", email: "eearley@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s7", kind: "staff", firstName: "Flora", lastName: "Preethu", displayName: "Flora P", email: "preethu.ig@accession.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s8", kind: "staff", firstName: "Mohammed", lastName: "Azaruddin", displayName: "Mohammed Azaruddin", email: "mohammed.azaru@accession.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s9", kind: "staff", firstName: "Nagendra", lastName: "B", displayName: "Nagendra B", email: "nagendra.b@accession.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry"], role: "Operations", isActive: true, isDeleted: false },
  { id: "s10", kind: "staff", firstName: "Priya", lastName: "Nair", displayName: "Priya Nair", email: "p.nair@newhartfordpsych.com", phone: "—", staffType: "admin", clinicAccess: ["new-hartford"], role: "Administration", isActive: true, isDeleted: false },
  { id: "s11", kind: "staff", firstName: "Derek", lastName: "Owens", displayName: "Derek Owens", email: "d.owens@shorecounseling.com", phone: "—", staffType: "billing", clinicAccess: ["shore-counseling"], role: "Billing", isActive: true, isDeleted: false },
  { id: "s12", kind: "staff", firstName: "Hannah", lastName: "Reyes", displayName: "Hannah Reyes", email: "h.reyes@penfieldpsych.com", phone: "—", staffType: "ops", clinicAccess: ["penfield-psychiatry", "new-hartford"], role: "Operations", isActive: false, isDeleted: false },
];

// ── Insurance network ───────────────────────────────────────────────────────
const INSURER_ALIASES: Record<string, string> = {
  "blue cross": "blue cross blue shield",
  "bluecross blueshield": "blue cross blue shield",
  "bcbs": "blue cross blue shield",
  "unitedhealth": "unitedhealthcare",
  "united healthcare": "unitedhealthcare",
  "uhc": "unitedhealthcare",
};
function normInsurer(s: string) {
  const k = s.toLowerCase().replace(/\s+/g, " ").trim();
  return INSURER_ALIASES[k] ?? k;
}

export type NetworkStatus = "in-network" | "out-of-network" | "unknown";

/** Is `providerId` in-network for a patient carrying `patientInsurer`? */
export function providerNetworkStatus(providerId: string, patientInsurer?: string | null): NetworkStatus {
  const p = PROVIDERS.find((x) => x.id === providerId);
  if (!p || !p.insuranceAccepted || !patientInsurer) return "unknown";
  const target = normInsurer(patientInsurer);
  return p.insuranceAccepted.map(normInsurer).includes(target) ? "in-network" : "out-of-network";
}

export const PROVIDER_TYPES = [
  "Psychiatrist", "Psychologist", "Licensed Clinical Social Worker",
  "Licensed Professional Counselor", "Nurse Practitioner",
  "Physician Assistant", "Marriage & Family Therapist", "Licensed Mental Health Counselor",
];

export const SPECIALIZATIONS_LIST = [
  "Adult Psychiatry", "Child & Adolescent Psychiatry", "Geriatric Psychiatry",
  "Addiction Psychiatry", "Forensic Psychiatry", "Cognitive Behavioral Therapy",
  "Dialectical Behavior Therapy", "EMDR", "Trauma", "ADHD", "Autism Spectrum",
  "Mood Disorders", "Anxiety", "Depression", "Grief & Loss", "Family Therapy",
  "Group Therapy", "Substance Use", "Eating Disorders", "OCD",
];

export const VISIT_TYPES_LIST = [
  "Initial Consultation", "Follow-Up", "Therapy Session",
  "Medication Check", "Group Session", "Crisis Visit", "Telehealth Visit",
];

export const SERVICES_LIST = [
  "Psychiatry", "Psychopharmacology", "Individual Therapy", "Group Therapy",
  "Family Therapy", "Psychological Testing", "Substance Use Counseling",
  "Crisis Intervention", "Telehealth Consultation",
];

export const PERMISSION_ROLES = [
  "Attending Physician", "Licensed Psychologist", "Licensed Therapist",
  "Consulting Provider", "Supervised Provider",
];

export const PROVIDER_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Pink", value: "#ec4899" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Orange", value: "#f97316" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Slate", value: "#64748b" },
  { label: "Indigo", value: "#6366f1" },
];

// ── Bulk provider roster ─────────────────────────────────────────────────────
// A real multi-site behavioral health group runs 60+ clinicians. The five
// above are hand-authored for demo depth (profile pages, tour, etc.); the
// rest are generated deterministically (no Math.random — this file is read
// during SSR, and non-deterministic seed data causes hydration mismatches)
// so the roster is large enough to exercise the CC calendar's provider
// search/filter at real scale.

const CREDENTIALS_BY_TYPE: Record<string, string> = {
  "Psychiatrist": "MD",
  "Psychologist": "PhD",
  "Licensed Clinical Social Worker": "LCSW",
  "Licensed Professional Counselor": "LPC",
  "Nurse Practitioner": "PMHNP-BC",
  "Physician Assistant": "PA-C",
  "Marriage & Family Therapist": "LMFT",
  "Licensed Mental Health Counselor": "LMHC",
};

const GEN_FIRST_NAMES = [
  "Olivia", "Ethan", "Maya", "Noah", "Isabella", "Liam", "Zoe", "Mason", "Ava", "Lucas",
  "Chloe", "Jackson", "Nora", "Elijah", "Layla", "Aiden", "Grace", "Caleb", "Harper", "Owen",
  "Ruby", "Wyatt", "Leah", "Julian", "Stella", "Gabriel", "Naomi", "Hudson", "Violet", "Ezra",
  "Willow", "Nathaniel", "Aria", "Dominic", "Ivy", "Theo", "Elena", "Felix", "Sadie", "Miles",
  "Priyanka", "Rohan", "Yara", "Amir", "Keiko", "Diego", "Fatima", "Kwame", "Anaya", "Sanjay",
  "Camila", "Xavier", "Mei", "Tobias", "Soraya", "Bennett", "Nadia", "Cyrus", "Delphine", "Malik",
];
const GEN_LAST_NAMES = [
  "Bennett", "Alvarez", "Foster", "Reyes", "Coleman", "Bishop", "Whitfield", "Navarro", "Sterling", "Osei",
  "Delgado", "Whitmore", "Hutchinson", "Marchetti", "Kowalczyk", "Abernathy", "Castellano", "Fairweather", "Lindqvist", "Okafor",
  "Villanueva", "Ashworth", "Dunmore", "Rosales", "Blackwood", "Tanaka", "Haverford", "Quintana", "Sokolov", "Merriweather",
  "Chowdhury", "Larkspur", "Winslow", "Abara", "Castellanos", "Fenwick", "Amador", "Whitaker", "Sandoval", "Pemberton",
];
const GEN_LANGUAGE_SETS = [["English"], ["English", "Spanish"], ["English", "Mandarin"], ["English", "French"], ["English", "Portuguese"], ["English", "Hindi"], ["English", "Vietnamese"], ["English", "Arabic"]];
const GEN_STREETS = ["14 Cobblestone Way", "220 Harborview Ln", "77 Aspen Grove Rd", "5 Lakeshore Dr", "312 Chestnut St", "89 Wintergreen Ave", "460 Birchcrest Blvd", "18 Foxglove Ct"];
const GEN_CITIES: Record<string, { city: string; state: string; zip: string }[]> = {
  "penfield-psychiatry": [{ city: "Penfield", state: "New York", zip: "14526" }, { city: "Rochester", state: "New York", zip: "14618" }, { city: "Pittsford", state: "New York", zip: "14534" }],
  "new-hartford": [{ city: "Utica", state: "New York", zip: "13501" }, { city: "New Hartford", state: "New York", zip: "13413" }],
  "shore-counseling": [{ city: "Ocean City", state: "New Jersey", zip: "08226" }, { city: "Somers Point", state: "New Jersey", zip: "08244" }],
};
const GEN_INSURERS = ["Aetna", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Medicare", "Medicaid", "Optum Behavioral Health", "Excellus", "Fidelis Care", "Horizon NJ Health"];

function generateAdditionalProviders(count: number): Provider[] {
  const clinicIds = Object.keys(GEN_CITIES);
  const out: Provider[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + HAND_AUTHORED_PROVIDERS.length + 1; // continues p6, p7, ...
    const first = GEN_FIRST_NAMES[i % GEN_FIRST_NAMES.length];
    // *7 +3 spreads the last-name pairing so adjacent providers don't repeat combos
    const last = GEN_LAST_NAMES[(i * 7 + 3) % GEN_LAST_NAMES.length];
    const providerType = PROVIDER_TYPES[i % PROVIDER_TYPES.length];
    const credentials = CREDENTIALS_BY_TYPE[providerType];
    const primaryClinic = clinicIds[i % clinicIds.length];
    const secondClinic = i % 5 === 0 ? clinicIds[(i + 1) % clinicIds.length] : undefined;
    const loc = GEN_CITIES[primaryClinic][i % GEN_CITIES[primaryClinic].length];
    const color = PROVIDER_COLORS[i % PROVIDER_COLORS.length].value;
    const specs = [SPECIALIZATIONS_LIST[i % SPECIALIZATIONS_LIST.length], SPECIALIZATIONS_LIST[(i + 5) % SPECIALIZATIONS_LIST.length]];
    const visitTypes = [VISIT_TYPES_LIST[i % VISIT_TYPES_LIST.length], VISIT_TYPES_LIST[(i + 2) % VISIT_TYPES_LIST.length]];
    const services = [SERVICES_LIST[i % SERVICES_LIST.length], SERVICES_LIST[(i + 3) % SERVICES_LIST.length]];
    const insuranceAccepted = [GEN_INSURERS[i % GEN_INSURERS.length], GEN_INSURERS[(i + 4) % GEN_INSURERS.length], GEN_INSURERS[(i + 7) % GEN_INSURERS.length]];
    const domain = primaryClinic === "penfield-psychiatry" ? "penfieldpsych.com" : primaryClinic === "new-hartford" ? "newhartfordpsych.com" : "shorecounseling.com";
    const openDays: DayName[] = i % 3 === 0
      ? ["Monday", "Tuesday", "Wednesday", "Thursday"]
      : i % 3 === 1
        ? ["Tuesday", "Wednesday", "Thursday", "Friday"]
        : ["Monday", "Wednesday", "Friday", "Saturday"];
    const startH = 8 + (i % 3); // 8, 9, or 10 AM start
    const endH = i % 4 === 0 ? 20 : 17; // one in four runs an evening clinic (up to 8 PM)

    out.push({
      id: `p${n}`, kind: "provider",
      firstName: first, lastName: last, displayName: providerType === "Psychiatrist" ? `Dr. ${first} ${last}` : `${first} ${last}, ${credentials}`,
      gender: i % 2 === 0 ? "Female" : "Male",
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      phone: `+1 (585) ${(400 + i).toString()}-${(1000 + i * 3).toString().slice(-4)}`,
      dob: `${1965 + (i % 30)}-${((i % 12) + 1).toString().padStart(2, "0")}-${((i % 27) + 1).toString().padStart(2, "0")}`,
      providerType, npi: `12345${(10000 + n).toString().slice(-5)}`,
      licenseNumber: `${providerType === "Psychiatrist" ? "PN" : providerType === "Psychologist" ? "PY" : "LC"}-${(20000 + n * 13).toString()}`,
      licenseState: loc.state,
      specializations: specs,
      clinicAccess: secondClinic ? [primaryClinic, secondClinic] : [primaryClinic],
      color, credentials,
      bio: `${first} ${last} provides ${specs[0].toLowerCase()} and ${specs[1].toLowerCase()} care${secondClinic ? " across multiple clinic sites" : ""}.`,
      languages: GEN_LANGUAGE_SETS[i % GEN_LANGUAGE_SETS.length],
      street: GEN_STREETS[i % GEN_STREETS.length], city: loc.city, state: loc.state, zip: loc.zip,
      visitTypes, services,
      telehealthEnabled: i % 3 !== 2,
      permissionRole: PERMISSION_ROLES[i % PERMISSION_ROLES.length],
      insuranceAccepted,
      acceptingNewPatients: i % 6 !== 5,
      isActive: i % 17 !== 16,
      isDeleted: false,
      workingHours: DAYS.map((day) => openDays.includes(day)
        ? wh(day, true, `${startH.toString().padStart(2, "0")}:00`, `${endH.toString().padStart(2, "0")}:00`, "12:00", "13:00")
        : wh(day, false)),
    });
  }
  return out;
}

export const PROVIDERS: Provider[] = [...HAND_AUTHORED_PROVIDERS, ...generateAdditionalProviders(60)];

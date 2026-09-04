import type { BusinessHour, DayName } from "./clinics";

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

export const PROVIDERS: Provider[] = [
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

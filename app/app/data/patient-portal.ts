// ── Patient Portal — demo data for James Holloway (pt01) ─────────────────────

export const CURRENT_PATIENT_ID = "pt01";

function d(offset: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offset);
  return base.toISOString().split("T")[0];
}

// ── Extended Health Profile ───────────────────────────────────────────────────

export interface PatientAddress {
  street: string; city: string; state: string; zip: string;
}

export interface EmergencyContact {
  name: string; relationship: string; phone: string; email?: string;
}

export interface PatientHealthProfile {
  patientId: string;
  pronouns: string;
  preferredLanguage: string;
  race: string;
  ethnicity: string;
  maritalStatus: string;
  occupation: string;
  address: PatientAddress;
  emergencyContact: EmergencyContact;
  height: string;
  weight: string;
  bmi: string;
  bloodType: string;
  primaryDiagnoses: string[];
  careNeeds: string[];
  locationPreference: "in-person" | "telehealth" | "both";
  preferredClinicId: string;
  preferredProviderId: string;
  smokingStatus: string;
  alcoholUse: string;
  exerciseFrequency: string;
  primaryCareProvider: string;
}

export const PATIENT_HEALTH_PROFILE: PatientHealthProfile = {
  patientId: "pt01",
  pronouns: "He/Him",
  preferredLanguage: "English",
  race: "White / Caucasian",
  ethnicity: "Non-Hispanic",
  maritalStatus: "Married",
  occupation: "Software Engineer",
  address: { street: "142 Maple Ridge Drive", city: "Penfield", state: "NY", zip: "14526" },
  emergencyContact: { name: "Sarah Holloway", relationship: "Spouse", phone: "+1 (585) 412-0102", email: "sarah.holloway@email.com" },
  height: "5'11\"",
  weight: "185 lbs",
  bmi: "25.8",
  bloodType: "A+",
  primaryDiagnoses: ["Generalized Anxiety Disorder (GAD)", "Major Depressive Disorder"],
  careNeeds: ["Medication Management", "Regular Follow-Ups", "Psychotherapy"],
  locationPreference: "both",
  preferredClinicId: "penfield-psychiatry",
  preferredProviderId: "p1",
  smokingStatus: "Never smoker",
  alcoholUse: "Social / Occasional (< 3 drinks/week)",
  exerciseFrequency: "2–3× per week",
  primaryCareProvider: "Dr. Rachel Moore, MD (Penfield Family Medicine)",
};

// ── Insurance ─────────────────────────────────────────────────────────────────

export type EligibilityStatus = "active" | "inactive" | "pending" | "unknown";

export interface PatientInsurance {
  id: string;
  type: "primary" | "secondary";
  provider: string;
  memberId: string;
  groupNumber: string;
  planName: string;
  planType: string;
  effectiveDate: string;
  termDate?: string;
  copay: number;
  deductible: number;
  deductibleMet: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  eligibilityStatus: EligibilityStatus;
  lastChecked: string;
  subscriberName: string;
  subscriberDob: string;
  cardFrontUploaded: boolean;
  cardBackUploaded: boolean;
}

export const PATIENT_INSURANCES: PatientInsurance[] = [
  {
    id: "ins01",
    type: "primary",
    provider: "Aetna",
    memberId: "AET-8812010",
    groupNumber: "GRP-45521",
    planName: "Aetna Choice POS II",
    planType: "POS",
    effectiveDate: "2024-01-01",
    termDate: "2024-12-31",
    copay: 20,
    deductible: 1500,
    deductibleMet: 875,
    outOfPocketMax: 4000,
    outOfPocketMet: 875,
    eligibilityStatus: "active",
    lastChecked: new Date(Date.now() - 86400000).toISOString(),
    subscriberName: "James Holloway",
    subscriberDob: "1985-04-12",
    cardFrontUploaded: true,
    cardBackUploaded: true,
  },
];

// ── Allergies ─────────────────────────────────────────────────────────────────

export type AllergySeverity = "mild" | "moderate" | "severe" | "life-threatening";
export type AllergyType = "medication" | "food" | "environmental" | "other";

export interface PatientAllergy {
  id: string;
  allergen: string;
  type: AllergyType;
  reaction: string;
  severity: AllergySeverity;
  onset: string;
  status: "active" | "inactive";
  notes?: string;
}

export const PATIENT_ALLERGIES: PatientAllergy[] = [
  { id: "al01", allergen: "Penicillin", type: "medication", reaction: "Hives, difficulty breathing", severity: "severe", onset: "2010", status: "active" },
  { id: "al02", allergen: "Peanuts", type: "food", reaction: "Anaphylaxis, throat swelling", severity: "life-threatening", onset: "Childhood", status: "active" },
  { id: "al03", allergen: "Sulfonamides (Sulfa)", type: "medication", reaction: "Widespread skin rash", severity: "moderate", onset: "2018", status: "active" },
  { id: "al04", allergen: "Dust mites", type: "environmental", reaction: "Rhinitis, sneezing, watery eyes", severity: "mild", onset: "2005", status: "active", notes: "Managed with antihistamines seasonally" },
  { id: "al05", allergen: "Shellfish", type: "food", reaction: "Stomach cramping, hives", severity: "moderate", onset: "2015", status: "active" },
];

// ── Forms / Intake ────────────────────────────────────────────────────────────

export type FormStatus = "pending" | "completed" | "overdue";
export type ApprovalStatus = "pending" | "approved" | "needs-review";

export interface PatientForm {
  id: string;
  name: string;
  type: "intake" | "screening" | "consent" | "assessment";
  description: string;
  assignedAt: string;
  dueDate?: string;
  completedAt?: string;
  status: FormStatus;
  appointmentId?: string;
  score?: number;
  maxScore?: number;
  approvalStatus?: ApprovalStatus;
  providerNotes?: string;
  questions?: number;
}

export const PATIENT_FORMS: PatientForm[] = [
  {
    id: "f01",
    name: "PHQ-9 Depression Screening",
    type: "screening",
    description: "Patient Health Questionnaire — 9-item depression scale",
    assignedAt: d(-7),
    completedAt: d(-7),
    dueDate: d(-5),
    status: "completed",
    appointmentId: "a01",
    score: 14,
    maxScore: 27,
    approvalStatus: "approved",
    providerNotes: "Moderate depression range. Discussed findings at visit.",
    questions: 9,
  },
  {
    id: "f02",
    name: "GAD-7 Anxiety Screening",
    type: "screening",
    description: "Generalized Anxiety Disorder — 7-item scale",
    assignedAt: d(-7),
    completedAt: d(-7),
    dueDate: d(-5),
    status: "completed",
    appointmentId: "a01",
    score: 11,
    maxScore: 21,
    approvalStatus: "approved",
    providerNotes: "Moderate anxiety. Correlates with reported symptoms.",
    questions: 7,
  },
  {
    id: "f03",
    name: "New Patient Intake",
    type: "intake",
    description: "Comprehensive new patient intake including medical history, family history and presenting concerns",
    assignedAt: d(-7),
    completedAt: d(-7),
    dueDate: d(-5),
    status: "completed",
    appointmentId: "a01",
    approvalStatus: "approved",
    questions: 42,
  },
  {
    id: "f04",
    name: "Informed Consent for Treatment",
    type: "consent",
    description: "Consent to treatment, telehealth services, and records release",
    assignedAt: d(-7),
    completedAt: d(-6),
    status: "completed",
    approvalStatus: "approved",
    questions: 5,
  },
  {
    id: "f05",
    name: "PHQ-9 Monthly Check-in",
    type: "screening",
    description: "Monthly depression tracking via PHQ-9",
    assignedAt: d(0),
    dueDate: d(3),
    status: "pending",
    appointmentId: "a01",
    questions: 9,
  },
  {
    id: "f06",
    name: "Medication Side Effects Log",
    type: "assessment",
    description: "Report any side effects from current medications",
    assignedAt: d(0),
    dueDate: d(7),
    status: "pending",
    questions: 12,
  },
];

// ── Documents ─────────────────────────────────────────────────────────────────

export type DocType = "lab-result" | "imaging" | "referral" | "discharge-summary" | "consent" | "prescription" | "other";

export interface PatientDocument {
  id: string;
  name: string;
  type: DocType;
  date: string;
  provider?: string;
  clinic?: string;
  size: string;
  uploadedAt: string;
  uploadedBy: "patient" | "staff" | "provider";
}

export const PATIENT_DOCUMENTS: PatientDocument[] = [
  { id: "doc01", name: "Lab Results — Comprehensive Metabolic Panel", type: "lab-result", date: d(-30), provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "245 KB", uploadedAt: new Date(Date.now() - 30 * 86400000).toISOString(), uploadedBy: "staff" },
  { id: "doc02", name: "Referral Letter — Psychiatry", type: "referral", date: d(-45), provider: "Dr. Rachel Moore", clinic: "Penfield Family Medicine", size: "128 KB", uploadedAt: new Date(Date.now() - 45 * 86400000).toISOString(), uploadedBy: "staff" },
  { id: "doc03", name: "Sertraline Prescription — 50mg", type: "prescription", date: d(-7), provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "89 KB", uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString(), uploadedBy: "provider" },
  { id: "doc04", name: "Insurance EOB — Aetna Visit 10/14", type: "other", date: d(-20), size: "312 KB", uploadedAt: new Date(Date.now() - 20 * 86400000).toISOString(), uploadedBy: "patient" },
  { id: "doc05", name: "Prior Authorization — Medication", type: "other", date: d(-10), provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "156 KB", uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString(), uploadedBy: "staff" },
];

// ── Family Members ────────────────────────────────────────────────────────────

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  relationship: string;
  email?: string;
  phone?: string;
  notes?: string;
  portalAccess: boolean;
  profileCreated: boolean;
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: "fm01",
    firstName: "Sarah",
    lastName: "Holloway",
    dob: "1987-09-22",
    gender: "Female",
    relationship: "Spouse",
    email: "sarah.holloway@email.com",
    phone: "+1 (585) 412-0102",
    notes: "Primary emergency contact. Aware of treatment.",
    portalAccess: true,
    profileCreated: true,
  },
  {
    id: "fm02",
    firstName: "Ethan",
    lastName: "Holloway",
    dob: "2015-06-10",
    gender: "Male",
    relationship: "Child",
    notes: "Minor — proxy access managed by parent.",
    portalAccess: false,
    profileCreated: false,
  },
];

// ── Messages ──────────────────────────────────────────────────────────────────

export interface MessageThread {
  id: string;
  subject: string;
  participantName: string;
  participantRole: "provider" | "staff" | "billing";
  participantAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ThreadMessage[];
}

export interface ThreadMessage {
  id: string;
  fromPatient: boolean;
  senderName: string;
  body: string;
  timestamp: string;
  read: boolean;
  attachments?: { name: string; size: string }[];
}

export const MESSAGE_THREADS: MessageThread[] = [
  {
    id: "mt01",
    subject: "Medication Question — Sertraline",
    participantName: "Dr. Sarah Mitchell",
    participantRole: "provider",
    participantAvatar: "SM",
    lastMessage: "That is a normal adjustment reaction in the first 2 weeks. Let's check in again next week — if the nausea persists, we may adjust the timing or dosage.",
    lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    unreadCount: 1,
    messages: [
      { id: "m01a", fromPatient: true, senderName: "James Holloway", body: "Hi Dr. Mitchell, I started the Sertraline 3 days ago and I'm experiencing some nausea in the morning. Is this normal?", timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), read: true },
      { id: "m01b", fromPatient: false, senderName: "Dr. Sarah Mitchell", body: "That is a normal adjustment reaction in the first 2 weeks. Let's check in again next week — if the nausea persists, we may adjust the timing or dosage. In the meantime, try taking it with food and at bedtime rather than in the morning.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
    ],
  },
  {
    id: "mt02",
    subject: "Appointment Confirmation — Follow-Up",
    participantName: "Care Coordinator",
    participantRole: "staff",
    participantAvatar: "CC",
    lastMessage: "Your follow-up appointment has been confirmed for next Friday at 11:00 AM via Telehealth. You will receive a link 15 minutes before the session.",
    lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    unreadCount: 0,
    messages: [
      { id: "m02a", fromPatient: false, senderName: "Care Coordinator", body: "Your follow-up appointment has been confirmed for next Friday at 11:00 AM via Telehealth. You will receive a link 15 minutes before the session.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), read: true },
      { id: "m02b", fromPatient: true, senderName: "James Holloway", body: "Thank you, I'll be ready!", timestamp: new Date(Date.now() - 23 * 3600000).toISOString(), read: true },
    ],
  },
  {
    id: "mt03",
    subject: "Prior Authorization Update",
    participantName: "Billing Department",
    participantRole: "billing",
    participantAvatar: "BD",
    lastMessage: "We have received approval from Aetna for the prior authorization for your medication. Your prescription has been sent to your pharmacy.",
    lastMessageAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    unreadCount: 0,
    messages: [
      { id: "m03a", fromPatient: false, senderName: "Billing Department", body: "We have received approval from Aetna for the prior authorization for your medication. Your prescription has been sent to your pharmacy of record (CVS Penfield).", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), read: true },
    ],
  },
];

// ── Portal Appointments (enriched for patient view) ───────────────────────────
// These supplement CC_APPOINTMENTS with portal-specific data

export interface ReservedSlotOption {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface PortalAppointment {
  id: string;
  providerId: string;
  providerName: string;
  providerCredentials: string;
  clinicName: string;
  clinicAddress: string;
  visitType: string;
  mode: "in-person" | "telehealth" | "phone";
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "confirmed" | "completed" | "cancelled" | "arrived" | "in-session" | "requested";
  appointmentType?: "fixed" | "reserved";
  slotOptions?: ReservedSlotOption[];
  telehealthLink?: string;
  notes?: string;
  copay?: number;
  copayPaid?: boolean;
  summary?: string;
}

export const PORTAL_APPOINTMENTS: PortalAppointment[] = [
  // Today - Initial Consultation (in-person, arrived)
  {
    id: "a01",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry",
    clinicAddress: "500 Penfield Road, Suite 200, Penfield, NY 14526",
    visitType: "Initial Consultation",
    mode: "in-person",
    date: d(0),
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    status: "arrived",
    copay: 20,
    copayPaid: true,
    notes: "First visit — anxiety and mild depression",
  },
  // +7 days - Telehealth Follow-Up (upcoming, confirmed)
  {
    id: "pa_tel01",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry (Telehealth)",
    clinicAddress: "Virtual — Video Appointment",
    visitType: "Follow-Up",
    mode: "telehealth",
    date: d(7),
    startTime: "11:00",
    endTime: "11:30",
    duration: 30,
    status: "confirmed",
    telehealthLink: "pa_tel01",
    copay: 20,
    copayPaid: false,
  },
  // +14 days - Medication Check (in-person, confirmed)
  {
    id: "pa_ip02",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry",
    clinicAddress: "500 Penfield Road, Suite 200, Penfield, NY 14526",
    visitType: "Medication Check",
    mode: "in-person",
    date: d(14),
    startTime: "10:00",
    endTime: "10:30",
    duration: 30,
    status: "confirmed",
    copay: 20,
    copayPaid: false,
  },
  // Past — Completed visits
  {
    id: "pa_past01",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry",
    clinicAddress: "500 Penfield Road, Suite 200, Penfield, NY 14526",
    visitType: "Medication Check",
    mode: "in-person",
    date: d(-14),
    startTime: "09:00",
    endTime: "09:30",
    duration: 30,
    status: "completed",
    copay: 20,
    copayPaid: true,
    summary: "Reviewed current medications. Adjusted Sertraline from 25mg to 50mg. Discussed sleep hygiene strategies.",
  },
  {
    id: "pa_past02",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry (Telehealth)",
    clinicAddress: "Virtual — Video Appointment",
    visitType: "Follow-Up",
    mode: "telehealth",
    date: d(-30),
    startTime: "14:00",
    endTime: "14:30",
    duration: 30,
    status: "completed",
    copay: 20,
    copayPaid: true,
    summary: "Good progress reported. Anxiety symptoms improving with medication. Continuing current treatment plan.",
  },
  {
    id: "pa_past03",
    providerId: "p2",
    providerName: "Dr. James O'Brien",
    providerCredentials: "PhD, LCSW",
    clinicName: "Penfield Psychiatry",
    clinicAddress: "500 Penfield Road, Suite 200, Penfield, NY 14526",
    visitType: "Therapy Session",
    mode: "in-person",
    date: d(-45),
    startTime: "10:00",
    endTime: "11:00",
    duration: 60,
    status: "completed",
    copay: 20,
    copayPaid: true,
    summary: "CBT session — identified cognitive distortions related to work stress. Assigned thought diary homework.",
  },
  // Reserved appointment — patient needs to pick a slot
  {
    id: "pa_reserved01",
    providerId: "p1",
    providerName: "Dr. Sarah Mitchell",
    providerCredentials: "MD, FAPA",
    clinicName: "Penfield Psychiatry",
    clinicAddress: "500 Penfield Road, Suite 200, Penfield, NY 14526",
    visitType: "Therapy Session",
    mode: "in-person",
    date: d(21),
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    status: "requested",
    appointmentType: "reserved",
    copay: 20,
    copayPaid: false,
    notes: "Your care coordinator has reserved 3 slots for you. Please select your preferred time.",
    slotOptions: [
      { slotId: "slot_a", date: d(21), startTime: "09:00", endTime: "10:00" },
      { slotId: "slot_b", date: d(21), startTime: "14:00", endTime: "15:00" },
      { slotId: "slot_c", date: d(23), startTime: "10:30", endTime: "11:30" },
    ],
  },
];

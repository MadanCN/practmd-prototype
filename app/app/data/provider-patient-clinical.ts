// Per-patient clinical collections for the provider portal's patient chart:
// allergies, vitals, care comments, forms, documents. Prototype seed data —
// generated per patient with a few hand-authored overrides for pt01.

import { CC_PATIENTS } from "./cc-patients";
import type { PatientAllergy, PatientForm, PatientDocument } from "./patient-portal";

function iso(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function ymd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

/* ── Allergies ──────────────────────────────────────────────────────────── */

const ALLERGEN_POOL: Omit<PatientAllergy, "id" | "status">[] = [
  { allergen: "Penicillin", type: "medication", reaction: "Hives, difficulty breathing", severity: "severe", onset: "2010" },
  { allergen: "Sulfonamides (Sulfa)", type: "medication", reaction: "Widespread skin rash", severity: "moderate", onset: "2018" },
  { allergen: "Peanuts", type: "food", reaction: "Throat swelling, anaphylaxis", severity: "life-threatening", onset: "Childhood" },
  { allergen: "Shellfish", type: "food", reaction: "Stomach cramping, hives", severity: "moderate", onset: "2015" },
  { allergen: "Latex", type: "environmental", reaction: "Contact dermatitis", severity: "mild", onset: "2012" },
  { allergen: "Bee stings", type: "environmental", reaction: "Localized swelling", severity: "moderate", onset: "2008" },
  { allergen: "NSAIDs", type: "medication", reaction: "GI upset, wheezing", severity: "moderate", onset: "2020" },
];

export const PATIENT_ALLERGIES_BY_ID: Record<string, PatientAllergy[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    if (p.id === "pt01") {
      return [p.id, [
        { id: "al-pt01-1", status: "active", ...ALLERGEN_POOL[0] },
        { id: "al-pt01-2", status: "active", ...ALLERGEN_POOL[1] },
        { id: "al-pt01-3", status: "inactive", allergen: "Dust mites", type: "environmental", reaction: "Rhinitis, watery eyes", severity: "mild", onset: "2005", notes: "Resolved after immunotherapy" },
      ]];
    }
    const count = i % 3; // 0, 1 or 2 allergies
    return [p.id, Array.from({ length: count }, (_, k) => ({
      id: `al-${p.id}-${k + 1}`,
      status: "active" as const,
      ...ALLERGEN_POOL[(i + k) % ALLERGEN_POOL.length],
    }))];
  }),
);

/* ── Vitals ─────────────────────────────────────────────────────────────── */

export interface VitalsReading {
  id: string;
  recordedAt: string;
  recordedBy: string;
  weightLb?: number;
  heightIn?: number;
  bmi?: number;
  bmiPercentile?: number;
  systolic?: number;
  diastolic?: number;
  tempF?: number;
  pulse?: number;
  respiration?: number;
  spo2?: number;
  fio2?: number;
  painScore?: number;
  headCircumferenceCm?: number;
  waistCircumferenceIn?: number;
}

const RECORDERS = ["Jordan Lee, MA", "Dr. Sarah Mitchell", "Priya Shah, RN", "Front Desk"];

function makeReading(patientIdx: number, visitIdx: number): VitalsReading {
  const baseW = 150 + patientIdx * 6;
  const w = baseW + Math.round(Math.sin(visitIdx) * 4);
  const h = 64 + (patientIdx % 8);
  const bmi = +((w / (h * h)) * 703).toFixed(1);
  return {
    id: `v-${patientIdx}-${visitIdx}`,
    recordedAt: iso(visitIdx * 34 + 2, 9 + (visitIdx % 6)),
    recordedBy: RECORDERS[visitIdx % RECORDERS.length],
    weightLb: w,
    heightIn: h,
    bmi,
    bmiPercentile: 40 + ((patientIdx * 7) % 55),
    systolic: 116 + ((patientIdx + visitIdx) % 16),
    diastolic: 72 + ((patientIdx + visitIdx) % 10),
    tempF: +(97.8 + (visitIdx % 3) * 0.3).toFixed(1),
    pulse: 66 + ((patientIdx + visitIdx * 2) % 20),
    respiration: 14 + (visitIdx % 4),
    spo2: 97 + (visitIdx % 3),
    fio2: 21,
    painScore: visitIdx === 0 ? patientIdx % 4 : 0,
    headCircumferenceCm: undefined,
    waistCircumferenceIn: 34 + (patientIdx % 8),
  };
}

export const PATIENT_VITALS_BY_ID: Record<string, VitalsReading[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const n = i % 4 === 0 ? 4 : i % 4 === 1 ? 3 : i % 4 === 2 ? 2 : 1;
    return [p.id, Array.from({ length: n }, (_, k) => makeReading(i, k))];
  }),
);

/* ── Care comments ─────────────────────────────────────────────────────── */

export type CareCommentType = "normal" | "alert";

export interface CareComment {
  id: string;
  author: string;
  authorRole: string;
  createdAt: string;
  body: string;
  type: CareCommentType;
  flagOnNextVisit?: boolean;
  resolved?: boolean;
}

const COMMENT_POOL: { body: string; type: CareCommentType; flag?: boolean; role: string; author: string }[] = [
  { body: "Patient called to confirm they received the new prescription. No questions.", type: "normal", role: "Care Coordinator", author: "Jordan Lee" },
  { body: "Insurance changed to a new plan effective next month — flagged for eligibility re-check.", type: "alert", flag: true, role: "Revenue Management", author: "Priya Shah" },
  { body: "Patient prefers afternoon appointments going forward due to a schedule change at work.", type: "normal", role: "Care Coordinator", author: "Dana Ruiz" },
  { body: "Left two voicemails about the overdue intake form. Please confirm completion at the next visit.", type: "alert", flag: true, role: "Care Coordinator", author: "Erin Walsh" },
  { body: "Family member (spouse) requested to be added as an emergency contact — added to the record.", type: "normal", role: "Front Desk", author: "Bianca Ramos" },
];

export const CARE_COMMENTS_BY_ID: Record<string, CareComment[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const count = i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1;
    return [p.id, Array.from({ length: count }, (_, k) => {
      const src = COMMENT_POOL[(i + k) % COMMENT_POOL.length];
      return {
        id: `cmt-${p.id}-${k + 1}`,
        author: src.author,
        authorRole: src.role,
        createdAt: iso(k * 9 + 1, 11 + k),
        body: src.body,
        type: src.type,
        flagOnNextVisit: src.flag,
        resolved: false,
      };
    })];
  }),
);

/* ── Forms ─────────────────────────────────────────────────────────────── */

const FORM_TEMPLATES: Omit<PatientForm, "id" | "assignedAt" | "dueDate" | "completedAt" | "status" | "approvalStatus" | "score">[] = [
  { name: "PHQ-9 Depression Screening", type: "screening", description: "Patient Health Questionnaire — 9-item depression scale", maxScore: 27, questions: 9 },
  { name: "GAD-7 Anxiety Screening", type: "screening", description: "Generalized Anxiety Disorder — 7-item scale", maxScore: 21, questions: 7 },
  { name: "MDQ — Mood Disorder Questionnaire", type: "screening", description: "Bipolar spectrum screening instrument", maxScore: 13, questions: 15 },
  { name: "New Patient Intake", type: "intake", description: "Medical history, family history and presenting concerns", questions: 42 },
  { name: "Informed Consent for Treatment", type: "consent", description: "Consent to treatment, telehealth services and records release", questions: 5 },
  { name: "Medication Side Effects Log", type: "assessment", description: "Report any side effects from current medications", questions: 12 },
];

export const PATIENT_FORMS_BY_ID: Record<string, PatientForm[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const n = 2 + (i % 3);
    return [p.id, Array.from({ length: n }, (_, k) => {
      const t = FORM_TEMPLATES[(i + k) % FORM_TEMPLATES.length];
      const done = k < n - 1;
      const score = t.maxScore ? Math.round((0.3 + ((i + k) % 5) / 10) * t.maxScore) : undefined;
      return {
        id: `frm-${p.id}-${k + 1}`,
        ...t,
        assignedAt: ymd(20 - k * 4),
        dueDate: ymd(14 - k * 4),
        completedAt: done ? ymd(18 - k * 4) : undefined,
        status: done ? "completed" : "pending",
        score: done ? score : undefined,
        approvalStatus: done ? (["approved", "pending", "needs-review"] as const)[(i + k) % 3] : undefined,
        providerNotes: done && (i + k) % 3 === 0 ? "Reviewed at visit — consistent with clinical picture." : undefined,
      } as PatientForm;
    })];
  }),
);

/* ── Documents ─────────────────────────────────────────────────────────── */

const DOC_TEMPLATES: Omit<PatientDocument, "id" | "date" | "uploadedAt">[] = [
  { name: "Lab Results — Comprehensive Metabolic Panel", type: "lab-result", provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "245 KB", uploadedBy: "staff" },
  { name: "Referral Letter — Psychiatry", type: "referral", provider: "Dr. Rachel Moore", clinic: "Penfield Family Medicine", size: "128 KB", uploadedBy: "staff" },
  { name: "Prescription — Sertraline 50mg", type: "prescription", provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "89 KB", uploadedBy: "provider" },
  { name: "Insurance EOB", type: "other", size: "312 KB", uploadedBy: "patient" },
  { name: "Discharge Summary — Partial Program", type: "discharge-summary", provider: "Dr. Lisa Nguyen", clinic: "New Hartford Psychological Services", size: "198 KB", uploadedBy: "staff" },
  { name: "Prior Authorization — Medication", type: "other", provider: "Dr. Sarah Mitchell", clinic: "Penfield Psychiatry", size: "156 KB", uploadedBy: "staff" },
];

export const PATIENT_DOCS_BY_ID: Record<string, PatientDocument[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const n = 1 + (i % 4);
    return [p.id, Array.from({ length: n }, (_, k) => {
      const t = DOC_TEMPLATES[(i + k) % DOC_TEMPLATES.length];
      return {
        id: `doc-${p.id}-${k + 1}`,
        ...t,
        date: ymd(12 + k * 15),
        uploadedAt: iso(12 + k * 15, 14),
      } as PatientDocument;
    })];
  }),
);

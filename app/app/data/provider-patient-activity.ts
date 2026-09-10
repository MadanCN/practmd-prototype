// Timeline (audit trail), sent emails, and the PHR-filled profile per patient.
// Prototype seed data — generated per patient.

import { CC_PATIENTS } from "./cc-patients";
import { PATIENT_PROFILES } from "./provider-patients";

function iso(daysAgo: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

/* ── Timeline ─────────────────────────────────────────────────────────── */

export type TimelineCategory =
  | "signup" | "view" | "appointment" | "note" | "form" | "message"
  | "insurance" | "comment" | "document" | "phr" | "admin" | "email";

export interface TimelineEvent {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  category: TimelineCategory;
  action: string;
  detail?: string;
}

function patientActor(name: string) {
  return { name, role: "Patient" };
}

export const TIMELINE_BY_ID: Record<string, TimelineEvent[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const pt = patientActor(p.displayName);
    const signupDay = 210 + i * 12;
    const raw: Omit<TimelineEvent, "id">[] = [
      { at: iso(signupDay, 8, 14), actor: pt.name, actorRole: pt.role, category: "signup", action: "Registered for the patient portal", detail: `Account created with ${p.email}` },
      { at: iso(signupDay, 8, 20), actor: "System", actorRole: "Automated", category: "email", action: "Portal welcome email sent" },
      { at: iso(signupDay - 1, 9, 30), actor: "Jordan Lee", actorRole: "Care Coordinator", category: "admin", action: "Assigned as care coordinator" },
      { at: iso(signupDay - 2, 11, 0), actor: pt.name, actorRole: pt.role, category: "phr", action: "Completed the PHR intake profile" },
      { at: iso(signupDay - 3, 13, 45), actor: "Priya Shah", actorRole: "Revenue Management", category: "insurance", action: "Insurance eligibility verified", detail: `${p.insuranceProvider ?? "Plan"} — active` },
      { at: iso(signupDay - 4, 10, 15), actor: "Bianca Ramos", actorRole: "Front Desk", category: "appointment", action: "Booked initial consultation" },
      { at: iso(signupDay - 5, 10, 20), actor: pt.name, actorRole: pt.role, category: "form", action: "Completed 'New Patient Intake' form" },
      { at: iso(Math.round(signupDay * 0.7), 9, 5), actor: "Dr. Sarah Mitchell", actorRole: "Provider", category: "view", action: "Opened the patient chart", detail: "Before scheduled visit" },
      { at: iso(Math.round(signupDay * 0.7), 9, 55), actor: "Dr. Sarah Mitchell", actorRole: "Provider", category: "note", action: "Signed encounter note — Initial Consultation" },
      { at: iso(Math.round(signupDay * 0.5), 14, 0), actor: pt.name, actorRole: pt.role, category: "message", action: "Sent a secure message", detail: "Question about medication timing" },
      { at: iso(Math.round(signupDay * 0.5), 15, 10), actor: "Dr. Sarah Mitchell", actorRole: "Provider", category: "message", action: "Replied to the patient message" },
      { at: iso(Math.round(signupDay * 0.35), 11, 30), actor: "Jordan Lee", actorRole: "Care Coordinator", category: "comment", action: "Added a care comment" },
      { at: iso(Math.round(signupDay * 0.2), 8, 40), actor: "Front Desk", actorRole: "Front Desk", category: "appointment", action: "Rescheduled follow-up appointment" },
      { at: iso(14, 16, 0), actor: "System", actorRole: "Automated", category: "email", action: "Appointment reminder email sent" },
      { at: iso(9, 10, 5), actor: "Priya Shah", actorRole: "Revenue Management", category: "document", action: "Uploaded insurance EOB to the chart" },
      { at: iso(2, 9, 12), actor: "Dr. Sarah Mitchell", actorRole: "Provider", category: "view", action: "Viewed the patient chart" },
      { at: iso(1, 13, 30), actor: pt.name, actorRole: pt.role, category: "form", action: "Started 'PHQ-9 Monthly Check-in'" },
    ];
    // keep it plausible: fewer events for higher-index (newer) patients
    const trimmed = raw.slice(0, 17 - (i % 6));
    return [p.id, trimmed
      .map((e, k) => ({ id: `tl-${p.id}-${k}`, ...e }))
      .sort((a, b) => b.at.localeCompare(a.at))];
  }),
);

/* ── Emails ──────────────────────────────────────────────────────────── */

export type EmailStatus = "delivered" | "opened" | "clicked" | "bounced";

export interface SentEmail {
  id: string;
  subject: string;
  type: string;
  sentAt: string;
  status: EmailStatus;
  opens: number;
  lastOpenedAt?: string;
}

const EMAIL_TEMPLATES: { subject: string; type: string }[] = [
  { subject: "Welcome to the Penfield Psychiatry patient portal", type: "Portal invite" },
  { subject: "Please complete your intake forms before your visit", type: "Form assignment" },
  { subject: "Your appointment is confirmed", type: "Appointment confirmation" },
  { subject: "Reminder: appointment tomorrow at Penfield Psychiatry", type: "Appointment reminder" },
  { subject: "A new message from your care team", type: "Message notification" },
  { subject: "Your visit summary is ready to view", type: "Visit summary" },
  { subject: "Statement available in your portal", type: "Billing statement" },
  { subject: "Action needed: verify your insurance information", type: "Insurance" },
];

export const EMAILS_BY_ID: Record<string, SentEmail[]> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const n = 4 + (i % 4);
    return [p.id, Array.from({ length: n }, (_, k) => {
      const t = EMAIL_TEMPLATES[(i + k) % EMAIL_TEMPLATES.length];
      const roll = (i + k * 3) % 10;
      const status: EmailStatus = roll === 0 ? "bounced" : roll < 3 ? "delivered" : roll < 7 ? "opened" : "clicked";
      const opens = status === "opened" ? 1 + (k % 3) : status === "clicked" ? 2 + (k % 2) : 0;
      return {
        id: `em-${p.id}-${k}`,
        subject: t.subject,
        type: t.type,
        sentAt: iso(6 + k * 11, 9 + (k % 8)),
        status,
        opens,
        lastOpenedAt: opens > 0 ? iso(5 + k * 11, 12 + (k % 6)) : undefined,
      };
    }).sort((a, b) => b.sentAt.localeCompare(a.sentAt))];
  }),
);

/* ── PHR-filled profile ──────────────────────────────────────────────── */

export interface PhrProfile {
  pronouns: string;
  preferredLanguage: string;
  race: string;
  ethnicity: string;
  maritalStatus: string;
  occupation: string;
  height: string;
  weight: string;
  bloodType: string;
  primaryCareProvider: string;
  smokingStatus: string;
  alcoholUse: string;
  exerciseFrequency: string;
  primaryDiagnoses: string[];
  careNeeds: string[];
  locationPreference: string;
  updatedAt: string;
}

const LANGS = ["English", "English", "Spanish", "English", "Mandarin"];
const MARITAL = ["Married", "Single", "Divorced", "Partnered", "Widowed"];
const OCCUPATIONS = ["Software Engineer", "Teacher", "Nurse", "Retail Manager", "Retired", "Student", "Accountant", "Electrician"];
const RACE = ["White / Caucasian", "Black / African American", "Asian", "Two or more races", "Prefer not to say"];
const SMOKING = ["Never smoker", "Former smoker", "Never smoker", "Current — occasional"];
const ALCOHOL = ["Social / occasional (< 3 drinks/week)", "None", "Moderate (3–7 drinks/week)", "Social / occasional (< 3 drinks/week)"];
const EXERCISE = ["2–3× per week", "Rarely", "Daily", "1× per week"];
const DIAGNOSES_POOL = [
  ["Generalized Anxiety Disorder", "Major Depressive Disorder"],
  ["ADHD, combined type"],
  ["Bipolar II disorder"],
  ["PTSD", "Insomnia"],
  ["Major Depressive Disorder, recurrent"],
];
const CARE_NEEDS_POOL = [
  ["Medication Management", "Regular Follow-Ups", "Psychotherapy"],
  ["Medication Management"],
  ["Psychotherapy", "Assessments & Testing"],
  ["Medication Management", "Psychotherapy"],
];

export const PHR_PROFILE_BY_ID: Record<string, PhrProfile> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const prof = PATIENT_PROFILES[p.id];
    return [p.id, {
      pronouns: prof?.pronouns ?? "They / Them",
      preferredLanguage: LANGS[i % LANGS.length],
      race: RACE[i % RACE.length],
      ethnicity: i % 4 === 0 ? "Hispanic or Latino" : "Not Hispanic or Latino",
      maritalStatus: MARITAL[i % MARITAL.length],
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
      height: `${5 + (i % 2)}'${4 + (i % 8)}"`,
      weight: `${150 + i * 6} lbs`,
      bloodType: ["O+", "A+", "B+", "AB+", "O−"][i % 5],
      primaryCareProvider: i % 3 === 0 ? "Dr. Rachel Moore, MD (Penfield Family Medicine)" : "None on file",
      smokingStatus: SMOKING[i % SMOKING.length],
      alcoholUse: ALCOHOL[i % ALCOHOL.length],
      exerciseFrequency: EXERCISE[i % EXERCISE.length],
      primaryDiagnoses: DIAGNOSES_POOL[i % DIAGNOSES_POOL.length],
      careNeeds: CARE_NEEDS_POOL[i % CARE_NEEDS_POOL.length],
      locationPreference: prof?.patientType === "Telehealth Only" ? "Telehealth only" : i % 2 === 0 ? "In-person or telehealth" : "In-person preferred",
      updatedAt: iso(30 + i * 3, 10),
    }];
  }),
);

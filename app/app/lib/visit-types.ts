// Canonical visit-type vocabulary for the Provider portal — one source of
// truth for labels, calendar colours, default durations and the note
// template each visit type opens with. Replaces the per-file
// VISIT_TYPE_COLOR maps that used to live in today/, appointments/,
// appointments/list/ and the patient sections.

import type { NoteType } from "@/lib/encounter-notes-store";

export interface VisitTypeDef {
  id: string;
  label: string;
  /** Hex — used for the left rail, dots and calendar cards. */
  color: string;
  /** Rough typical charge for the primary CPT, used for "revenue at risk". */
  typicalCharge: number;
  defaultDurationMin: number;
  defaultNoteType: NoteType;
  description: string;
}

// Violet was deliberately swept out of the Provider portal earlier, so
// Spravato uses indigo (already reused in the patient Timeline section).
export const VISIT_TYPES: VisitTypeDef[] = [
  { id: "spravato",       label: "Spravato",             color: "#6366f1", typicalCharge: 285, defaultDurationMin: 120, defaultNoteType: "SOAP", description: "Esketamine (Spravato) in-office administration + 2 hr monitoring" },
  { id: "med-management", label: "Med Management",        color: "#1a5c9e", typicalCharge: 175, defaultDurationMin: 30,  defaultNoteType: "SOAP", description: "Medication review — response, side effects, adherence" },
  { id: "initial",        label: "Initial Consultation", color: "#0ea5e9", typicalCharge: 350, defaultDurationMin: 60,  defaultNoteType: "SOAP", description: "New-patient psychiatric evaluation" },
  { id: "talk-therapy",   label: "Talk Therapy",         color: "#f59e0b", typicalCharge: 160, defaultDurationMin: 45,  defaultNoteType: "DAP",  description: "Individual psychotherapy session" },
  { id: "tms",            label: "TMS",                  color: "#10b981", typicalCharge: 220, defaultDurationMin: 40,  defaultNoteType: "SOAP", description: "Transcranial magnetic stimulation treatment" },
  { id: "follow-up",      label: "Follow-Up",            color: "#05a99a", typicalCharge: 130, defaultDurationMin: 30,  defaultNoteType: "SOAP", description: "Routine follow-up visit" },
  { id: "crisis",         label: "Crisis Visit",         color: "#f43f5e", typicalCharge: 240, defaultDurationMin: 45,  defaultNoteType: "BIRP", description: "Same-day / urgent visit for acute symptoms or safety" },
  { id: "group",          label: "Group Session",        color: "#64748b", typicalCharge: 90,  defaultDurationMin: 90,  defaultNoteType: "DAP",  description: "Group psychotherapy" },
];

const BY_LABEL = new Map(VISIT_TYPES.map((v) => [v.label.toLowerCase(), v]));

// Older seed labels that may still turn up — map them onto the canonical set.
const ALIASES: Record<string, string> = {
  "medication check": "Med Management",
  "therapy session": "Talk Therapy",
  "telehealth consultation": "Follow-Up",
  "discharge summary": "Follow-Up",
};

export function visitTypeDef(label: string): VisitTypeDef {
  const key = (ALIASES[label.toLowerCase()] ?? label).toLowerCase();
  return BY_LABEL.get(key) ?? {
    id: "other", label, color: "#94a3b8", typicalCharge: 130,
    defaultDurationMin: 30, defaultNoteType: "SOAP", description: label,
  };
}

export function visitColor(label: string): string {
  return visitTypeDef(label).color;
}

export const VISIT_TYPE_LABELS = VISIT_TYPES.map((v) => v.label);

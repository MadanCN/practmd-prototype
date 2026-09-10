"use client";

// In-memory store for full encounter notes (the SOAP / BIRP / DAP editor).
// Seeded from PROVIDER_ENCOUNTER_NOTES; new notes are created from the
// New Encounter modal. Prototype only — state lives for the tab session and is
// shared across every note surface (Patients → Encounters, /provider/encounter-notes).

import { useSyncExternalStore } from "react";
import { PROVIDER_ENCOUNTER_NOTES } from "@/data/provider-today";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";

export type NoteType = "SOAP" | "BIRP" | "DAP" | "Narrative";
export type NoteStatus = "draft" | "pending-cosign" | "signed";

export const NOTE_TYPES: NoteType[] = ["SOAP", "BIRP", "DAP", "Narrative"];
export const ENCOUNTER_MODES = ["in-person", "telehealth", "phone"] as const;
export const VISIT_TYPES = [
  "Initial Consultation", "Follow-Up", "Medication Check", "Therapy Session",
  "Crisis / Urgent Visit", "Discharge Summary", "Group Session",
];

export interface ProcedureRow {
  id: string;
  description: string;
  code: string;
  quantity: string;
  charge: string;
  dxPointers: string;
  modifiers: string;
  pos: string;
}

export interface EncounterNoteDoc {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  coSignerName?: string;
  appointmentId?: string;
  date: string;
  visitType: string;
  mode: (typeof ENCOUNTER_MODES)[number];
  noteType: NoteType;
  status: NoteStatus;
  signedAt?: string;
  signedBy: string[];
  resource: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, string>;
  diagnoses: string[];
  procedures: ProcedureRow[];
}

/* ── Field definitions ─────────────────────────────────────────────────── */

export interface FieldDef {
  id: string;
  label: string;
  kind: "text" | "textarea";
}
export interface FieldGroup {
  id: string;
  title: string;
  fields: FieldDef[];
}

const t = (id: string, label: string): FieldDef => ({ id, label, kind: "text" });
const ta = (id: string, label: string): FieldDef => ({ id, label, kind: "textarea" });

export const SOAP_SUBJECTIVE: FieldGroup[] = [
  {
    id: "presenting", title: "Presenting concern",
    fields: [
      ta("s.chiefComplaint", "Chief complaint"),
      ta("s.hpi", "History of present illness"),
      t("s.duration", "Duration"), t("s.onset", "Onset"), t("s.timing", "Timing"),
      t("s.context", "Context"), t("s.modifyingFactors", "Modifying factors"), t("s.quality", "Quality"),
    ],
  },
  {
    id: "meds", title: "Medications",
    fields: [
      ta("s.priorMedication", "Prior medication"),
      ta("s.medSideEffects", "Reported medication side effects"),
      ta("s.currentMedications", "Current medications"),
      ta("s.medAllergies", "Medication allergies"),
    ],
  },
  {
    id: "assessments", title: "Symptom assessments",
    fields: [
      ta("s.depression", "Depression assessment"),
      ta("s.sleep", "Sleep assessment"),
      ta("s.anxiety", "Anxiety assessment"),
      ta("s.adhd", "ADHD assessment"),
      ta("s.bipolar", "Bipolar assessment"),
      ta("s.eatingDisorder", "Eating disorder signs / symptoms"),
      ta("s.postTrauma", "Post-trauma findings"),
      ta("s.involuntaryMovements", "Involuntary movements"),
      ta("s.substanceAbuse", "Substance abuse assessment"),
    ],
  },
  {
    id: "psychHistory", title: "Psychiatric & treatment history",
    fields: [
      ta("s.psychiatricHistory", "Psychiatric history"),
      ta("s.outpatientMedMgmt", "Outpatient mental health medication management"),
      ta("s.medTrials", "Psychiatric medication trials and effectiveness"),
      ta("s.outpatientTherapy", "Outpatient therapy"),
      ta("s.inpatientHospitalization", "Inpatient hospitalization"),
      ta("s.php", "Partial hospitalization programs"),
      ta("s.residential", "Residential placement"),
      ta("s.pastSI", "Past suicidal ideation / self-injurious behavior"),
      ta("s.substanceUseTreatment", "Substance use treatment history"),
    ],
  },
  {
    id: "medicalHistory", title: "Medical history",
    fields: [
      ta("s.pmh", "Past medical history"),
      ta("s.proceduresSurgeries", "Procedures, surgeries and medical hospitalizations"),
    ],
  },
  {
    id: "familySocial", title: "Family & social history",
    fields: [
      ta("s.familySocialHistory", "Family & social history"),
      ta("s.supportStructure", "Support structure"),
      ta("s.socialBackground", "Social background"),
      ta("s.familyHistory", "Family history"),
    ],
  },
  {
    id: "ros", title: "Review of systems",
    fields: [ta("s.ros", "Review of systems")],
  },
];

export const SOAP_OBJECTIVE: FieldGroup[] = [
  {
    id: "mse", title: "Mental status examination",
    fields: [
      ta("o.appearance", "General appearance"),
      t("o.gait", "Gait"),
      ta("o.behavior", "Behavior & activity"),
      t("o.orientation", "Orientation"),
      ta("o.speech", "Speech and language"),
      t("o.affect", "Affect"),
      t("o.mood", "Mood"),
      ta("o.memory", "Memory & recall"),
      ta("o.focus", "Focus and concentration"),
      ta("o.thoughtProcess", "Thought process"),
      ta("o.perception", "Perception"),
      ta("o.insightJudgement", "Insight & judgement"),
      t("o.riskLevel", "Level of risk"),
    ],
  },
];

export const SOAP_ASSESSMENT: FieldGroup[] = [
  {
    id: "assessment", title: "Assessment",
    fields: [
      ta("a.impression", "Psychiatric impression"),
      ta("a.counseling", "Counseled the patient on treatment options including but not limited to"),
    ],
  },
];

export const SOAP_PLAN: FieldGroup[] = [
  {
    id: "plan", title: "Plan",
    fields: [
      ta("p.prescription", "Prescription / medication"),
      ta("p.recordsReviewed", "Records & diagnostic testing reviewed"),
      ta("p.therapyRecommendation", "Therapy recommendation"),
      t("p.mintTd", "MINT / TD screening"),
    ],
  },
];

export const FOLLOWUP_FIELDS: FieldDef[] = [
  t("fu.type", "Choose type"),
  ta("fu.notes", "Notes"),
  t("fu.date", "Date"),
];

/** Section sets per note type. */
export function groupsFor(noteType: NoteType): { subjective: FieldGroup[]; objective: FieldGroup[]; assessment: FieldGroup[]; plan: FieldGroup[] } {
  if (noteType === "SOAP") {
    return { subjective: SOAP_SUBJECTIVE, objective: SOAP_OBJECTIVE, assessment: SOAP_ASSESSMENT, plan: SOAP_PLAN };
  }
  if (noteType === "BIRP") {
    return {
      subjective: [{ id: "behavior", title: "Behavior", fields: [ta("s.chiefComplaint", "Behavior"), ta("s.hpi", "Presenting problem & observations")] }],
      objective: [{ id: "intervention", title: "Intervention", fields: [ta("o.appearance", "Interventions used")] }],
      assessment: [{ id: "response", title: "Response", fields: [ta("a.impression", "Patient response to intervention")] }],
      plan: SOAP_PLAN,
    };
  }
  if (noteType === "DAP") {
    return {
      subjective: [{ id: "data", title: "Data", fields: [ta("s.chiefComplaint", "Data — subjective & objective")] }],
      objective: [],
      assessment: SOAP_ASSESSMENT,
      plan: SOAP_PLAN,
    };
  }
  return {
    subjective: [{ id: "narrative", title: "Narrative", fields: [ta("s.chiefComplaint", "Narrative note")] }],
    objective: [],
    assessment: [],
    plan: SOAP_PLAN,
  };
}

/* ── Store ─────────────────────────────────────────────────────────────── */

interface StoreState {
  notes: Record<string, EncounterNoteDoc>;
}

function providerName(id: string) {
  return PROVIDERS.find((p) => p.id === id)?.displayName ?? "Dr. Sarah Mitchell";
}
function patientName(id: string) {
  return CC_PATIENTS.find((p) => p.id === id)?.displayName ?? "Unknown patient";
}
function now() { return new Date().toISOString(); }
function ymd(iso: string) { return iso.split("T")[0]; }

const NOTE_TYPE_MAP: Record<string, string> = {
  progress: "Follow-Up", intake: "Initial Consultation", discharge: "Discharge Summary",
};

const SIGNED_SAMPLE: Record<string, string> = {
  "s.chiefComplaint": "Follow-up for medication management. Reports mood is more stable over the past two weeks.",
  "s.hpi": "Patient continues on current regimen. Sleep improved, energy fair, no SI/HI. Appetite normal. Denies new stressors.",
  "s.currentMedications": "Sertraline 100 mg daily, Bupropion XL 150 mg daily.",
  "s.medSideEffects": "Mild dry mouth, tolerable. No sexual side effects reported.",
  "o.appearance": "Well-groomed, appropriately dressed, appears stated age.",
  "o.behavior": "Calm, cooperative, good eye contact.",
  "o.affect": "Full range, congruent.",
  "o.mood": "\"Pretty good.\"",
  "o.thoughtProcess": "Linear, goal-directed.",
  "o.insightJudgement": "Insight and judgement intact.",
  "o.riskLevel": "Low.",
  "a.impression": "Major depressive disorder, recurrent, in partial remission. Responding well to current regimen.",
  "a.counseling": "Discussed medication adherence, sleep hygiene, and continued therapy. Patient verbalized understanding.",
  "p.prescription": "Continue current medications. No changes today.",
  "p.therapyRecommendation": "Continue weekly individual psychotherapy.",
  "fu.type": "Routine follow-up",
  "fu.notes": "Return in 4 weeks; sooner if symptoms worsen.",
};

function seedProcedure(): ProcedureRow[] {
  return [{
    id: "pc1", description: "Psychotherapy, 45 min with E/M", code: "90836",
    quantity: "1", charge: "175.00", dxPointers: "1", modifiers: "", pos: "11",
  }];
}

function makeSeed(): Record<string, EncounterNoteDoc> {
  const out: Record<string, EncounterNoteDoc> = {};
  for (const n of PROVIDER_ENCOUNTER_NOTES) {
    const signed = n.status === "historical";
    out[n.id] = {
      id: n.id,
      patientId: n.patientId,
      patientName: n.patientName,
      providerId: "p1",
      providerName: "Dr. Sarah Mitchell",
      coSignerName: undefined,
      appointmentId: undefined,
      date: ymd(n.visitDate),
      visitType: n.visitType || NOTE_TYPE_MAP[n.noteType] || "Follow-Up",
      mode: "in-person",
      noteType: "SOAP",
      status: signed ? "signed" : "draft",
      signedAt: n.signedAt,
      signedBy: signed ? ["Dr. Sarah Mitchell"] : [],
      resource: "Penfield Psychiatry · Room 4",
      createdAt: n.visitDate,
      updatedAt: n.signedAt ?? n.visitDate,
      fields: signed ? { ...SIGNED_SAMPLE } : {},
      diagnoses: signed ? ["F33.1"] : [],
      procedures: signed ? seedProcedure() : [],
    };
  }
  return out;
}

let state: StoreState = { notes: makeSeed() };
let listeners: (() => void)[] = [];

function emit() { for (const l of listeners) l(); }
function subscribe(l: () => void) { listeners = [...listeners, l]; return () => { listeners = listeners.filter((x) => x !== l); }; }
function getSnapshot() { return state; }
function set(updater: (s: StoreState) => StoreState) { state = updater(state); emit(); }

export function useEncounterNotes() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getNote(id: string): EncounterNoteDoc | undefined {
  return state.notes[id];
}

export function getNotesForPatient(patientId: string): EncounterNoteDoc[] {
  return Object.values(state.notes)
    .filter((n) => n.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllNotes(): EncounterNoteDoc[] {
  return Object.values(state.notes).sort((a, b) => b.date.localeCompare(a.date));
}

export function getNoteForAppointment(appointmentId: string): EncounterNoteDoc | undefined {
  return Object.values(state.notes).find((n) => n.appointmentId === appointmentId);
}

export function createNote(input: {
  patientId: string;
  providerId: string;
  date: string;
  visitType: string;
  mode: (typeof ENCOUNTER_MODES)[number];
  noteType: NoteType;
  appointmentId?: string;
}): string {
  const id = `enc_${Math.random().toString(36).slice(2, 9)}`;
  const doc: EncounterNoteDoc = {
    id,
    patientId: input.patientId,
    patientName: patientName(input.patientId),
    providerId: input.providerId,
    providerName: providerName(input.providerId),
    appointmentId: input.appointmentId,
    date: input.date,
    visitType: input.visitType,
    mode: input.mode,
    noteType: input.noteType,
    status: "draft",
    signedBy: [],
    resource: input.mode === "telehealth" ? "Telehealth — secure video" : "Penfield Psychiatry · Room 4",
    createdAt: now(),
    updatedAt: now(),
    fields: {},
    diagnoses: [],
    procedures: [],
  };
  set((s) => ({ notes: { ...s.notes, [id]: doc } }));
  return id;
}

/** Get an existing note for an appointment, or create one. */
export function noteForAppointment(appointmentId: string, seed: { patientId: string; providerId: string; date: string; visitType: string; mode: (typeof ENCOUNTER_MODES)[number] }): string {
  const existing = Object.values(state.notes).find((n) => n.appointmentId === appointmentId);
  if (existing) return existing.id;
  return createNote({ ...seed, noteType: "SOAP", appointmentId });
}

export function setField(id: string, key: string, value: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "draft") return s;
    return { notes: { ...s.notes, [id]: { ...n, fields: { ...n.fields, [key]: value }, updatedAt: now() } } };
  });
}

export function setMeta(id: string, patch: Partial<Pick<EncounterNoteDoc, "visitType" | "mode" | "noteType" | "date" | "resource" | "providerId" | "providerName">>) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "draft") return s;
    return { notes: { ...s.notes, [id]: { ...n, ...patch, updatedAt: now() } } };
  });
}

export function toggleDiagnosis(id: string, code: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "draft") return s;
    const has = n.diagnoses.includes(code);
    return { notes: { ...s.notes, [id]: { ...n, diagnoses: has ? n.diagnoses.filter((c) => c !== code) : [...n.diagnoses, code], updatedAt: now() } } };
  });
}

export function addProcedure(id: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "draft") return s;
    const row: ProcedureRow = { id: `pc_${Math.random().toString(36).slice(2, 7)}`, description: "", code: "", quantity: "1", charge: "", dxPointers: "", modifiers: "", pos: "11" };
    return { notes: { ...s.notes, [id]: { ...n, procedures: [...n.procedures, row], updatedAt: now() } } };
  });
}

export function updateProcedure(id: string, rowId: string, patch: Partial<ProcedureRow>) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "draft") return s;
    return { notes: { ...s.notes, [id]: { ...n, procedures: n.procedures.map((r) => (r.id === rowId ? { ...r, ...patch } : r)), updatedAt: now() } } };
  });
}

export function removeProcedure(id: string, rowId: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n) return s;
    return { notes: { ...s.notes, [id]: { ...n, procedures: n.procedures.filter((r) => r.id !== rowId), updatedAt: now() } } };
  });
}

export function signNote(id: string, opts: { requestCoSign: boolean; coSignerName?: string }) {
  set((s) => {
    const n = s.notes[id];
    if (!n) return s;
    return {
      notes: {
        ...s.notes,
        [id]: {
          ...n,
          status: opts.requestCoSign ? "pending-cosign" : "signed",
          signedAt: now(),
          signedBy: [n.providerName],
          coSignerName: opts.requestCoSign ? opts.coSignerName : undefined,
          updatedAt: now(),
        },
      },
    };
  });
}

export function addCoSign(id: string, coSignerName: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n) return s;
    return { notes: { ...s.notes, [id]: { ...n, status: "signed", signedBy: [...n.signedBy, coSignerName], coSignerName, updatedAt: now() } } };
  });
}

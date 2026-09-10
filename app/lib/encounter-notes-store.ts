"use client";

// In-memory store for full encounter notes (the SOAP / BIRP / DAP editor).
// Seeded from PROVIDER_ENCOUNTER_NOTES; new notes are created from the
// New Encounter modal. Prototype only — state lives for the tab session and is
// shared across every note surface (Patients → Encounters, /provider/encounter-notes).

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { PROVIDER_ENCOUNTER_NOTES } from "@/data/provider-today";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";

export type NoteType = "SOAP" | "BIRP" | "DAP" | "Narrative";
export type NoteStatus = "draft" | "pending-cosign" | "returned" | "signed";

export interface Addendum {
  id: string;
  authorName: string;
  createdAt: string;
  reason: string;
  body: string;
  /** set when the addendum changed diagnosis / procedure coding → RCM task */
  affectsCoding?: boolean;
  /** human summary of what coding changed, e.g. "+Dx F41.1 · −CPT 99213" */
  codingSummary?: string;
}

export interface NoteAuditEvent {
  id: string;
  at: string;
  actor: string;
  kind: "created" | "template-selected" | "signed" | "cosign-requested" | "cosigned"
    | "returned" | "addendum" | "copy-forward";
  detail?: string;
}

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
  /** clinic-admin template this note is bound to + the version in force when
   *  it was created (versions are immutable once notes reference them) */
  templateId?: string;
  templateVersion?: number;
  /** fields the provider explicitly carried forward from an earlier note */
  carriedForwardFields?: string[];
  carriedForwardFrom?: string;
  addenda: Addendum[];
  audit: NoteAuditEvent[];
  /** co-signer's comment when a note is returned for revision */
  returnedComment?: string;
  returnedBy?: string;
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

/** A worked example of the addendum flow on a couple of already-signed notes,
 *  so the co-sign / addendum / RCM-task path is demonstrable out of the box. */
function seedAddenda(noteId: string, signedAt: string | undefined): Addendum[] {
  const t = (mins: number) => new Date((signedAt ? new Date(signedAt).getTime() : Date.now()) + mins * 60000).toISOString();
  if (noteId === "note05") {
    return [
      {
        id: "ad_seed_05a",
        authorName: "Dr. Sarah Mitchell",
        createdAt: t(60 * 26),
        reason: "Coding correction after chart review",
        body: "On review, the visit also addressed a new generalized anxiety complaint that warrants a secondary diagnosis, and the level of service supports 99215 rather than 99214. Diagnosis and procedure coding updated accordingly.",
        affectsCoding: true,
        codingSummary: "+Dx F41.1 · −CPT 99214 · +CPT 99215",
      },
    ];
  }
  if (noteId === "note04") {
    return [
      {
        id: "ad_seed_04a",
        authorName: "Dr. Sarah Mitchell",
        createdAt: t(60 * 4),
        reason: "Clarification requested by the patient's therapist",
        body: "To clarify the plan: the patient was started on sertraline 25 mg for one week, then to increase to 50 mg. Follow-up in 2 weeks, sooner if side effects. No change to diagnosis or billing.",
        affectsCoding: false,
      },
    ];
  }
  return [];
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
      diagnoses: signed ? (n.id === "note05" ? ["F33.1", "F41.1"] : ["F33.1"]) : [],
      procedures: signed
        ? (n.id === "note05"
            ? [{ id: "pc1", description: "E/M established, high complexity", code: "99215", quantity: "1", charge: "215.00", dxPointers: "1,2", modifiers: "", pos: "11" }]
            : seedProcedure())
        : [],
      templateId: signed ? "med-management" : undefined,
      templateVersion: signed ? 3 : undefined,
      addenda: signed ? seedAddenda(n.id, n.signedAt) : [],
      audit: [
        { id: `au_${n.id}_c`, at: n.visitDate, actor: "Dr. Sarah Mitchell", kind: "created" },
        ...(signed && n.signedAt ? [{ id: `au_${n.id}_s`, at: n.signedAt, actor: "Dr. Sarah Mitchell", kind: "signed" as const }] : []),
        ...(signed ? seedAddenda(n.id, n.signedAt).map((a) => ({ id: `au_${a.id}`, at: a.createdAt, actor: a.authorName, kind: "addendum" as const, detail: a.affectsCoding ? `coding change · ${a.codingSummary}` : a.reason })) : []),
      ],
    };
  }
  return out;
}

const store = createPersistedStore<StoreState>({
  key: "encounter-notes",
  initial: { notes: makeSeed() },
  revive: (raw, initial) => {
    const persisted = ((raw as StoreState)?.notes) ?? {};
    // seed rows the code knows about but the saved blob predates still show;
    // any note the provider has since touched wins.
    const merged: Record<string, EncounterNoteDoc> = { ...initial.notes };
    for (const [k, v] of Object.entries(persisted)) {
      const seed = initial.notes[k];
      // an untouched seeded signed note gets its demo addenda / coding back so
      // the addendum walkthrough is visible even on a warm (persisted) load
      const keepSeededAddenda = seed && seed.status === "signed" && (v.addenda?.length ?? 0) === 0 && seed.addenda.length > 0;
      merged[k] = {
        ...v,
        addenda: keepSeededAddenda ? seed.addenda : (v.addenda ?? []),
        diagnoses: keepSeededAddenda ? seed.diagnoses : v.diagnoses,
        procedures: keepSeededAddenda ? seed.procedures : v.procedures,
        audit: keepSeededAddenda ? seed.audit : (v.audit ?? []),
      } as EncounterNoteDoc;
    }
    return { notes: merged };
  },
});

const state = new Proxy({} as StoreState, { get: (_t, p) => (store.get() as unknown as Record<string, unknown>)[p as string] });
function set(updater: (s: StoreState) => StoreState) { store.set(updater); }

export function useEncounterNotes() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
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
  templateId?: string;
  templateVersion?: number;
}): string {
  const id = `enc_${Math.random().toString(36).slice(2, 9)}`;
  const author = providerName(input.providerId);
  const doc: EncounterNoteDoc = {
    id,
    patientId: input.patientId,
    patientName: patientName(input.patientId),
    providerId: input.providerId,
    providerName: author,
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
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    addenda: [],
    audit: [{ id: `au_${id}_c`, at: now(), actor: author, kind: "created" }],
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

/** A note is content-editable by its author while it is a draft or has been
 *  returned for revision. Signed / awaiting-co-signature notes are frozen. */
export function isEditable(n: EncounterNoteDoc | undefined): boolean {
  return !!n && (n.status === "draft" || n.status === "returned");
}

function audit(n: EncounterNoteDoc, kind: NoteAuditEvent["kind"], actor: string, detail?: string): NoteAuditEvent[] {
  return [...n.audit, { id: `au_${Math.random().toString(36).slice(2, 8)}`, at: now(), actor, kind, detail }];
}

export function setField(id: string, key: string, value: string) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    return { notes: { ...s.notes, [id]: { ...n, fields: { ...n.fields, [key]: value }, updatedAt: now() } } };
  });
}

export function setMeta(id: string, patch: Partial<Pick<EncounterNoteDoc, "visitType" | "mode" | "noteType" | "date" | "resource" | "providerId" | "providerName">>) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    // place of service follows the mode automatically (11 in-person / 10 telehealth)
    let procedures = n.procedures;
    if (patch.mode && patch.mode !== n.mode) {
      const pos = patch.mode === "telehealth" ? "10" : "11";
      procedures = n.procedures.map((r) => ({ ...r, pos }));
    }
    return { notes: { ...s.notes, [id]: { ...n, ...patch, procedures, updatedAt: now() } } };
  });
}

export function selectTemplateForNote(id: string, templateId: string, version: number, noteType: NoteType) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    return {
      notes: {
        ...s.notes,
        [id]: { ...n, templateId, templateVersion: version, noteType, updatedAt: now(), audit: audit(n, "template-selected", n.providerName, `${templateId} v${version}`) },
      },
    };
  });
}

export function copyForwardInto(id: string, sourceNoteId: string, fieldKeys: string[]) {
  set((s) => {
    const n = s.notes[id];
    const src = s.notes[sourceNoteId];
    if (!isEditable(n) || !src) return s;
    const carried: Record<string, string> = {};
    for (const k of fieldKeys) if (src.fields[k] != null) carried[k] = src.fields[k];
    return {
      notes: {
        ...s.notes,
        [id]: {
          ...n,
          fields: { ...n.fields, ...carried },
          carriedForwardFields: Array.from(new Set([...(n.carriedForwardFields ?? []), ...Object.keys(carried)])),
          carriedForwardFrom: sourceNoteId,
          updatedAt: now(),
          audit: audit(n, "copy-forward", n.providerName, `${Object.keys(carried).length} fields from ${src.date}`),
        },
      },
    };
  });
}

export function reorderDiagnoses(id: string, from: number, to: number) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    const dx = [...n.diagnoses];
    const [m] = dx.splice(from, 1);
    dx.splice(to, 0, m);
    return { notes: { ...s.notes, [id]: { ...n, diagnoses: dx, updatedAt: now() } } };
  });
}

export function toggleDiagnosis(id: string, code: string) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    const has = n.diagnoses.includes(code);
    return { notes: { ...s.notes, [id]: { ...n, diagnoses: has ? n.diagnoses.filter((c) => c !== code) : [...n.diagnoses, code], updatedAt: now() } } };
  });
}

export function addProcedure(id: string) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    const row: ProcedureRow = { id: `pc_${Math.random().toString(36).slice(2, 7)}`, description: "", code: "", quantity: "1", charge: "", dxPointers: "1", modifiers: "", pos: n.mode === "telehealth" ? "10" : "11" };
    return { notes: { ...s.notes, [id]: { ...n, procedures: [...n.procedures, row], updatedAt: now() } } };
  });
}

export function updateProcedure(id: string, rowId: string, patch: Partial<ProcedureRow>) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    return { notes: { ...s.notes, [id]: { ...n, procedures: n.procedures.map((r) => (r.id === rowId ? { ...r, ...patch } : r)), updatedAt: now() } } };
  });
}

export function removeProcedure(id: string, rowId: string) {
  set((s) => {
    const n = s.notes[id];
    if (!isEditable(n)) return s;
    return { notes: { ...s.notes, [id]: { ...n, procedures: n.procedures.filter((r) => r.id !== rowId), updatedAt: now() } } };
  });
}

export function signNote(id: string, opts: { requestCoSign: boolean; coSignerName?: string; signerName?: string }) {
  set((s) => {
    const n = s.notes[id];
    if (!n) return s;
    const signer = opts.signerName ?? n.providerName;
    return {
      notes: {
        ...s.notes,
        [id]: {
          ...n,
          status: opts.requestCoSign ? "pending-cosign" : "signed",
          signedAt: now(),
          signedBy: [signer],
          coSignerName: opts.requestCoSign ? opts.coSignerName : undefined,
          returnedComment: undefined,
          returnedBy: undefined,
          updatedAt: now(),
          audit: audit(n, opts.requestCoSign ? "cosign-requested" : "signed", signer, opts.coSignerName),
        },
      },
    };
  });
}

export function addCoSign(id: string, coSignerName: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "pending-cosign") return s;
    return { notes: { ...s.notes, [id]: { ...n, status: "signed", signedBy: [...n.signedBy, coSignerName], coSignerName, updatedAt: now(), audit: audit(n, "cosigned", coSignerName) } } };
  });
}

/** Co-signer sends a note back — status returns to editable with the comment attached. */
export function returnForRevision(id: string, coSignerName: string, comment: string) {
  set((s) => {
    const n = s.notes[id];
    if (!n || n.status !== "pending-cosign") return s;
    return {
      notes: {
        ...s.notes,
        [id]: { ...n, status: "returned", signedAt: undefined, signedBy: [], returnedComment: comment, returnedBy: coSignerName, updatedAt: now(), audit: audit(n, "returned", coSignerName, comment) },
      },
    };
  });
}

function procKey(p: ProcedureRow) {
  return `${p.code}|${p.description}|${p.quantity}|${p.charge}|${p.modifiers}|${p.pos}|${p.dxPointers}`;
}
export function sameProcedures(a: ProcedureRow[], b: ProcedureRow[]): boolean {
  return a.length === b.length && a.every((p, i) => procKey(p) === procKey(b[i]));
}
export function sameDiagnoses(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((c, i) => c === b[i]);
}

/** Human summary of a coding change, for the addendum + the RCM task. */
export function codingDiffSummary(dxBefore: string[], dxAfter: string[], procBefore: ProcedureRow[], procAfter: ProcedureRow[]): string {
  const parts: string[] = [];
  const dxAdded = dxAfter.filter((c) => !dxBefore.includes(c));
  const dxRemoved = dxBefore.filter((c) => !dxAfter.includes(c));
  if (dxAdded.length) parts.push(`+Dx ${dxAdded.join(", ")}`);
  if (dxRemoved.length) parts.push(`−Dx ${dxRemoved.join(", ")}`);
  if (!dxAdded.length && !dxRemoved.length && !sameDiagnoses(dxBefore, dxAfter)) parts.push("Dx order changed");
  const cptBefore = procBefore.map((p) => p.code).filter(Boolean);
  const cptAfter = procAfter.map((p) => p.code).filter(Boolean);
  const cptAdded = cptAfter.filter((c) => !cptBefore.includes(c));
  const cptRemoved = cptBefore.filter((c) => !cptAfter.includes(c));
  if (cptAdded.length) parts.push(`+CPT ${cptAdded.join(", ")}`);
  if (cptRemoved.length) parts.push(`−CPT ${cptRemoved.join(", ")}`);
  if (!cptAdded.length && !cptRemoved.length && !sameProcedures(procBefore, procAfter)) parts.push("procedure detail edited");
  return parts.join(" · ");
}

/**
 * Append an addendum to a signed note. The original narrative is never touched.
 * If `diagnoses` / `procedures` are supplied and differ from what's on file, the
 * note's coding is amended and the return value flags the change so the caller
 * can raise the Revenue Cycle task (a bill may already be submitted).
 */
export function addAddendum(id: string, input: {
  authorName: string;
  reason: string;
  body: string;
  diagnoses?: string[];
  procedures?: ProcedureRow[];
}): { codingChanged: boolean; summary: string } {
  const n = getNote(id);
  if (!n || n.status !== "signed") return { codingChanged: false, summary: "" };

  const newDx = input.diagnoses ?? n.diagnoses;
  const newProc = input.procedures ?? n.procedures;
  const codingChanged = !sameDiagnoses(newDx, n.diagnoses) || !sameProcedures(newProc, n.procedures);
  const summary = codingChanged ? codingDiffSummary(n.diagnoses, newDx, n.procedures, newProc) : "";

  set((s) => {
    const cur = s.notes[id];
    if (!cur || cur.status !== "signed") return s;
    const add: Addendum = {
      id: `ad_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now(),
      authorName: input.authorName,
      reason: input.reason,
      body: input.body,
      affectsCoding: codingChanged,
      codingSummary: summary || undefined,
    };
    return {
      notes: {
        ...s.notes,
        [id]: {
          ...cur,
          diagnoses: newDx,
          procedures: newProc,
          addenda: [...cur.addenda, add],
          updatedAt: now(),
          audit: audit(cur, "addendum", input.authorName, codingChanged ? `coding change · ${summary}` : input.reason),
        },
      },
    };
  });

  return { codingChanged, summary };
}

/** Notes a designated co-signer must action (their supervisees, awaiting co-sign). */
export function getNotesToCoSign(coSignerName: string): EncounterNoteDoc[] {
  return Object.values(state.notes)
    .filter((n) => n.status === "pending-cosign" && n.coSignerName === coSignerName)
    .sort((a, b) => a.date.localeCompare(b.date));
}

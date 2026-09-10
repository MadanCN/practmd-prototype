"use client";

// Shared store for the clinical encounter workflow: Start Session (in-person,
// from Waiting Room) or Join (telehealth) creates an Encounter tied to an
// appointment; Check Out / End Call closes the session and surfaces a
// "review and complete note" prompt; completing the note signs the
// encounter. Also owns live appointment-status overrides so Waiting Room,
// the appointment detail page, Today, and Encounter Notes all agree on
// where a given appointment actually is in its lifecycle within this
// session — CC_APPOINTMENTS itself is static seed data, so status changes
// have to live somewhere shared rather than per-page local state.

import { useSyncExternalStore } from "react";
import { type AppointmentStatus, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { noteForAppointment } from "@/lib/encounter-notes-store";

export type EncounterStatus = "in-progress" | "pending-note" | "signed";

export interface EncounterNoteDraft {
  chiefComplaint: string;
  subjective: string;
  assessment: string;
  plan: string;
  diagnosisCodes: string[];
  procedureCode: string;
  durationMin: string;
}

export interface Encounter {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  visitType: string;
  mode: CcAppointment["mode"];
  startedAt: string;
  endedAt?: string;
  status: EncounterStatus;
  note: EncounterNoteDraft;
  signedAt?: string;
  /** Unset until the provider picks a note template — every note-writing
   *  surface (appointment detail page, telehealth sidebar) gates on this
   *  before showing any note fields. */
  templateId?: string;
}

export const BLANK_NOTE: EncounterNoteDraft = {
  chiefComplaint: "",
  subjective: "",
  assessment: "",
  plan: "",
  diagnosisCodes: [],
  procedureCode: "90834",
  durationMin: "45",
};

export interface NoteTemplate {
  id: string;
  label: string;
  description: string;
  defaultProcedureCode: string;
  defaultDurationMin: string;
  placeholders: {
    chiefComplaint: string;
    subjective: string;
    assessment: string;
    plan: string;
  };
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "initial-eval",
    label: "Psychiatric Initial Evaluation",
    description: "Comprehensive intake for a new patient — history, mental status exam, diagnosis, and treatment plan.",
    defaultProcedureCode: "90791",
    defaultDurationMin: "60",
    placeholders: {
      chiefComplaint: "Reason for seeking care today…",
      subjective: "History of present illness, psychiatric history, substance use history, family history, mental status exam…",
      assessment: "Diagnostic impression, differential, risk assessment…",
      plan: "Treatment plan, medications initiated, therapy referral, follow-up interval…",
    },
  },
  {
    id: "med-management",
    label: "Medication Management Follow-Up",
    description: "Focused visit to review medication response, side effects, and adherence.",
    defaultProcedureCode: "99214",
    defaultDurationMin: "30",
    placeholders: {
      chiefComplaint: "Reason for today's medication check…",
      subjective: "Response to current medications, side effects, adherence, symptom changes since last visit…",
      assessment: "Current symptom control, medication tolerability…",
      plan: "Medication adjustments, labs ordered, next follow-up interval…",
    },
  },
  {
    id: "therapy-progress",
    label: "Therapy Progress Note",
    description: "Individual psychotherapy session — presenting concerns, interventions, and response.",
    defaultProcedureCode: "90834",
    defaultDurationMin: "45",
    placeholders: {
      chiefComplaint: "Presenting concern for today's session…",
      subjective: "Patient's report since last session, mood, functioning, stressors…",
      assessment: "Clinical observations, progress toward treatment goals…",
      plan: "Interventions used, homework assigned, next session focus…",
    },
  },
  {
    id: "crisis",
    label: "Crisis / Urgent Visit",
    description: "Same-day or urgent visit for acute symptom escalation or safety concerns.",
    defaultProcedureCode: "90792",
    defaultDurationMin: "45",
    placeholders: {
      chiefComplaint: "Nature of the crisis / urgent concern…",
      subjective: "Precipitating events, safety assessment, current risk factors…",
      assessment: "Risk level, acuity, need for higher level of care…",
      plan: "Safety plan, disposition, immediate follow-up…",
    },
  },
  {
    id: "telehealth-consult",
    label: "Telehealth Consultation",
    description: "General virtual visit note — flexible structure for any telehealth visit type.",
    defaultProcedureCode: "90832",
    defaultDurationMin: "30",
    placeholders: {
      chiefComplaint: "Reason for today's telehealth visit…",
      subjective: "Patient's report via video/phone…",
      assessment: "Clinical impressions from this virtual visit…",
      plan: "Plan and follow-up…",
    },
  },
  {
    id: "blank",
    label: "Blank / General Note",
    description: "No preset structure — start from a blank SOAP-style note.",
    defaultProcedureCode: "90834",
    defaultDurationMin: "45",
    placeholders: {
      chiefComplaint: "Reason for today's visit…",
      subjective: "Patient's report, history of present illness…",
      assessment: "Clinical impressions, diagnosis updates…",
      plan: "Treatment plan, orders, referrals…",
    },
  },
];

export const DIAGNOSIS_CODES = [
  { code: "F41.1", label: "Generalized Anxiety Disorder" },
  { code: "F32.9", label: "Major Depressive Disorder, unspecified" },
  { code: "F33.1", label: "MDD, recurrent, moderate" },
  { code: "F43.10", label: "PTSD" },
  { code: "F90.0", label: "ADHD, predominantly inattentive" },
  { code: "F31.9", label: "Bipolar disorder, unspecified" },
  { code: "F40.10", label: "Social Anxiety Disorder" },
  { code: "F42.9", label: "OCD, unspecified" },
  { code: "F10.20", label: "Alcohol use disorder, moderate/severe" },
  { code: "Z71.9", label: "Counseling, unspecified" },
];

export const PROCEDURE_CODES = [
  { code: "90791", label: "Psychiatric Eval (initial)" },
  { code: "90792", label: "Psychiatric Eval w/ medical (initial)" },
  { code: "90832", label: "Psychotherapy 30 min" },
  { code: "90834", label: "Psychotherapy 45 min" },
  { code: "90837", label: "Psychotherapy 60 min" },
  { code: "99213", label: "E&M — Established, Low complexity" },
  { code: "99214", label: "E&M — Established, Moderate complexity" },
];

export type NotificationKind =
  | "appointment-booked" | "checked-in" | "note-pending" | "charge-created" | "generic";

export interface EncounterNotification {
  id: string;
  message: string;
  href: string;
  createdAt: string;
  kind: NotificationKind;
  /** Set for appointment-related notifications so the layout can open the
   *  appointment drawer instead of just navigating. */
  apptId?: string;
}

interface StoreState {
  statusOverrides: Record<string, AppointmentStatus>;
  /** Reschedule / cancel-reason / edit field changes, merged over the
   *  static seed appointment by getEffectiveAppointment. */
  apptPatches: Record<string, Partial<CcAppointment>>;
  calledAppointmentIds: Record<string, true>;
  encounters: Record<string, Encounter>; // keyed by appointmentId
  /** appointmentId -> the SOAP note doc id created at check-in / session start. */
  apptNoteIds: Record<string, string>;
  notifications: EncounterNotification[];
}

function seedNotifications(): EncounterNotification[] {
  const mk = (apptId: string, message: string, minsAgo: number): EncounterNotification => ({
    id: `notif_seed_${apptId}`,
    message,
    href: `/provider/appointments/list?appt=${apptId}`,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
    kind: "appointment-booked",
    apptId,
  });
  return [
    mk("b09", "New appointment booked — Marcus Webb requested an urgent Crisis Visit", 12),
    mk("a31", "New appointment booked — Priya Nair, Initial Consultation", 140),
  ];
}

let state: StoreState = {
  statusOverrides: {},
  apptPatches: {},
  calledAppointmentIds: {},
  encounters: {},
  apptNoteIds: {},
  notifications: seedNotifications(),
};

function now() {
  return new Date().toISOString();
}
function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

type Listener = () => void;
let listeners: Listener[] = [];
function emit() {
  for (const l of listeners) l();
}
function subscribe(listener: Listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
function getSnapshot() {
  return state;
}
function set(updater: (s: StoreState) => StoreState) {
  state = updater(state);
  emit();
}

export function useEncounterStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ── Derived reads (safe to call outside React render too) ──────────────────

export function getEffectiveStatus(appt: CcAppointment): AppointmentStatus {
  return state.statusOverrides[appt.id] ?? appt.status;
}

/** Static seed appointment + any in-session edits (reschedule / cancel
 *  reason) + live status. Every provider surface should render this rather
 *  than the raw CC_APPOINTMENTS row. */
export function getEffectiveAppointment(appt: CcAppointment): CcAppointment {
  const patch = state.apptPatches[appt.id];
  const status = state.statusOverrides[appt.id] ?? appt.status;
  return patch ? { ...appt, ...patch, status } : { ...appt, status };
}

export function isCalled(appointmentId: string): boolean {
  return !!state.calledAppointmentIds[appointmentId];
}

export function getEncounterForAppointment(appointmentId: string): Encounter | undefined {
  return state.encounters[appointmentId];
}

export function getNoteIdForAppointment(appointmentId: string): string | undefined {
  return state.apptNoteIds[appointmentId];
}

// ── Actions ──────────────────────────────────────────────────────────────

export function markCalled(appointmentId: string) {
  set((s) => ({ ...s, calledAppointmentIds: { ...s.calledAppointmentIds, [appointmentId]: true } }));
}

/** Generic notification push — used by the note editor (charge created),
 *  drawer actions (cancel / reschedule) etc. */
export function pushNotification(n: {
  message: string;
  href: string;
  kind?: NotificationKind;
  apptId?: string;
}) {
  set((s) => ({
    ...s,
    notifications: [
      { id: id("notif"), createdAt: now(), kind: n.kind ?? "generic", ...n },
      ...s.notifications,
    ],
  }));
}

/** Reschedule / cancel / edit an appointment. Writes a status override plus
 *  an optional field patch that getEffectiveAppointment merges. */
export function setApptStatus(appointmentId: string, status: AppointmentStatus, patch?: Partial<CcAppointment>) {
  set((s) => ({
    ...s,
    statusOverrides: { ...s.statusOverrides, [appointmentId]: status },
    apptPatches: patch ? { ...s.apptPatches, [appointmentId]: { ...s.apptPatches[appointmentId], ...patch } } : s.apptPatches,
  }));
}

/** Resolve (creating if needed) the SOAP note doc id for an appointment.
 *  Kept outside any store `set()` updater so the encounter-notes-store
 *  write happens cleanly before this store updates. */
function resolveNoteId(appt: CcAppointment): string {
  const existing = state.apptNoteIds[appt.id];
  if (existing) return existing;
  return noteForAppointment(appt.id, {
    patientId: appt.patientId,
    providerId: appt.providerId,
    date: appt.date,
    visitType: appt.visitType,
    mode: appt.mode,
  });
}

/** Front-desk / provider check-in. Marks the patient arrived, opens a SOAP
 *  note draft tied to the appointment, and surfaces them in the Waiting
 *  Room. */
export function checkInPatient(appt: CcAppointment): string {
  const patient = CC_PATIENTS.find((p) => p.id === appt.patientId);
  const noteId = resolveNoteId(appt);
  set((s) => ({
    ...s,
    statusOverrides: { ...s.statusOverrides, [appt.id]: "arrived" },
    apptNoteIds: { ...s.apptNoteIds, [appt.id]: noteId },
    notifications: [
      {
        id: id("notif"),
        message: `${patient?.displayName ?? "Patient"} checked in for their ${appt.visitType.toLowerCase()} — now in the waiting room.`,
        href: `/provider/waiting-room?appt=${appt.id}`,
        createdAt: now(),
        kind: "checked-in" as const,
        apptId: appt.id,
      },
      ...s.notifications,
    ],
  }));
  return noteId;
}

/** In-person/phone: Start Session from Waiting Room or the appointment
 *  drawer. Telehealth: called when the provider joins the call. Creates
 *  the Encounter record and guarantees the SOAP note doc exists. */
export function startSession(appt: CcAppointment): Encounter & { noteId: string } {
  const existing = state.encounters[appt.id];
  const patient = CC_PATIENTS.find((p) => p.id === appt.patientId);
  const noteId = resolveNoteId(appt);

  const encounter: Encounter = existing ?? {
    id: id("enc"),
    appointmentId: appt.id,
    patientId: appt.patientId,
    patientName: patient?.displayName ?? "Unknown Patient",
    providerId: appt.providerId,
    visitType: appt.visitType,
    mode: appt.mode,
    startedAt: now(),
    status: "in-progress",
    note: { ...BLANK_NOTE, procedureCode: PROCEDURE_CODES.find((c) => c.label.includes(String(appt.duration)))?.code ?? "90834", durationMin: String(appt.duration) },
  };

  set((s) => ({
    ...s,
    statusOverrides: { ...s.statusOverrides, [appt.id]: "in-session" },
    apptNoteIds: { ...s.apptNoteIds, [appt.id]: noteId },
    encounters: { ...s.encounters, [appt.id]: { ...encounter, status: "in-progress" as const } },
  }));
  return { ...encounter, noteId };
}

/** Check Out (in-person) / End Call (telehealth): completes the appointment
 *  and moves the encounter into "needs a note written" state. */
export function checkOutPatient(appointmentId: string) {
  const encounter = state.encounters[appointmentId];
  set((s) => ({
    ...s,
    statusOverrides: { ...s.statusOverrides, [appointmentId]: "completed" },
    encounters: encounter ? { ...s.encounters, [appointmentId]: { ...encounter, status: "pending-note", endedAt: now() } } : s.encounters,
    notifications: [
      {
        id: id("notif"),
        message: `${encounter?.patientName ?? "Patient"} checked out — the encounter note is unsigned and unbilled.`,
        href: s.apptNoteIds[appointmentId] ? `/provider/encounters/${s.apptNoteIds[appointmentId]}` : `/provider/encounter-notes`,
        createdAt: now(),
        kind: "note-pending" as const,
        apptId: appointmentId,
      },
      ...s.notifications,
    ],
  }));
}

/** Called by the SOAP editor once a note tied to an appointment is signed —
 *  closes the encounter so the Waiting Room / lifecycle agree. */
export function completeEncounterForNote(appointmentId: string | undefined) {
  if (!appointmentId) return;
  set((s) => {
    const enc = s.encounters[appointmentId];
    if (!enc) return s;
    return { ...s, encounters: { ...s.encounters, [appointmentId]: { ...enc, status: "signed", signedAt: now() } } };
  });
}

/** Must be called before any note fields are shown — every note-writing
 *  surface gates on `encounter.templateId` being set. Applies the
 *  template's default procedure code / duration as a starting point. */
export function selectTemplate(appointmentId: string, templateId: string) {
  const tpl = NOTE_TEMPLATES.find((t) => t.id === templateId);
  set((s) => {
    const enc = s.encounters[appointmentId];
    if (!enc || !tpl) return s;
    return {
      ...s,
      encounters: {
        ...s.encounters,
        [appointmentId]: {
          ...enc,
          templateId,
          note: { ...enc.note, procedureCode: tpl.defaultProcedureCode, durationMin: tpl.defaultDurationMin },
        },
      },
    };
  });
}

export function updateNoteDraft(appointmentId: string, changes: Partial<EncounterNoteDraft>) {
  set((s) => {
    const enc = s.encounters[appointmentId];
    if (!enc) return s;
    return { ...s, encounters: { ...s.encounters, [appointmentId]: { ...enc, note: { ...enc.note, ...changes } } } };
  });
}

export function toggleDiagnosisCode(appointmentId: string, code: string) {
  set((s) => {
    const enc = s.encounters[appointmentId];
    if (!enc) return s;
    const has = enc.note.diagnosisCodes.includes(code);
    const diagnosisCodes = has ? enc.note.diagnosisCodes.filter((c) => c !== code) : [...enc.note.diagnosisCodes, code];
    return { ...s, encounters: { ...s.encounters, [appointmentId]: { ...enc, note: { ...enc.note, diagnosisCodes } } } };
  });
}

export function completeEncounterNote(appointmentId: string) {
  set((s) => {
    const enc = s.encounters[appointmentId];
    if (!enc) return s;
    return { ...s, encounters: { ...s.encounters, [appointmentId]: { ...enc, status: "signed", signedAt: now() } } };
  });
}

export function dismissNotification(notificationId: string) {
  set((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== notificationId) }));
}

// ── Encounter Notes list integration ────────────────────────────────────────
// Shapes live encounters (checked-out-but-unsigned, or signed) into the same
// row shape data/provider-today.ts's EncounterNote uses, so the Encounter
// Notes page and Today dashboard can show real, freshly-created encounters
// alongside the seeded demo notes without knowing the difference.

export interface EncounterNoteRow {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  visitType: string;
  visitDate: string;
  noteType: "progress";
  status: "pending" | "historical";
  daysOverdue?: number;
  signedAt?: string;
}

export function getLiveEncounterNoteRows(): EncounterNoteRow[] {
  return Object.values(state.encounters)
    .filter((e) => e.status === "pending-note" || e.status === "signed")
    .map((e) => ({
      id: e.id,
      patientId: e.patientId,
      patientName: e.patientName,
      appointmentId: e.appointmentId,
      visitType: e.visitType,
      visitDate: e.startedAt,
      noteType: "progress" as const,
      status: e.status === "signed" ? ("historical" as const) : ("pending" as const),
      daysOverdue: e.status === "pending-note" ? 0 : undefined,
      signedAt: e.signedAt,
    }));
}

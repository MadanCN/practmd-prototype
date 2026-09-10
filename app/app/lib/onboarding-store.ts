"use client";

// In-memory demo store bridging the Patient Onboarding wizard, the Revenue
// Management eligibility worklist, and the Care Coordinator task queue.
// No backend in this prototype — state lives for the lifetime of the tab and
// is shared across routes via client-side navigation.

import { useSyncExternalStore } from "react";

export type EligibilityState =
  | "pending"
  | "in-progress"
  | "on-hold"
  | "verified-active"
  | "verified-inactive"
  | "verified-not-covered"
  | "unable-to-verify"
  | "self-pay-confirmed"
  | "expired";

export const RESOLVED_STATES: EligibilityState[] = [
  "verified-active",
  "verified-inactive",
  "verified-not-covered",
  "self-pay-confirmed",
];

export interface CarveOutInfo {
  vendor: string;
  payerId: string;
  notes: string;
}

export interface HistoryEntry {
  state: EligibilityState;
  at: string;
  by?: string;
  note?: string;
}

export interface EligibilityWorklistItem {
  id: string;
  submissionId: string;
  patientName: string;
  payerName: string;
  memberId: string;
  state: EligibilityState;
  assignee?: string;
  verificationChannel?: "portal" | "phone" | "clearinghouse";
  onHoldReason?: string;
  unableReason?: string;
  carveOut?: CarveOutInfo;
  history: HistoryEntry[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: string;
  type: "onboarding-prep" | "book-appointment";
  title: string;
  detail: string;
  patientName: string;
  submissionId: string;
  assignee: string;
  status: "open" | "done";
  createdAt: string;
}

export interface AccountHolder {
  firstName: string;
  lastName: string;
  relationship: string;
  mobile: string;
}

export interface PatientIdentity {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;
  sexAtBirth?: string;
  pronouns?: string;
}

export interface CareIntent {
  careTypes: string[];
  location?: string;
  skipped: boolean;
}

export interface InsuranceSubmission {
  payerName: string;
  cardFrontUploaded: boolean;
  cardBackUploaded: boolean;
  relationshipToCardholder: string;
  cardholderFirstName: string;
  cardholderLastName: string;
  cardholderDob: string;
  memberId: string;
}

export interface OnboardingSubmission {
  id: string;
  createdAt: string;
  accountFor: "self" | "guardian";
  accountHolder?: AccountHolder;
  patient?: PatientIdentity;
  careIntent?: CareIntent;
  insurance?: InsuranceSubmission;
  formsCompleted: string[];
  step: number;
  coordinator?: string;
  completedAt?: string;
}

interface StoreState {
  submissions: OnboardingSubmission[];
  worklist: EligibilityWorklistItem[];
  tasks: Task[];
}

const DEFAULT_COORDINATOR = "Jordan Lee";
const RCM_STAFF = ["Priya Shah", "Marcus Webb", "Dana Ruiz"];

function now() {
  return new Date().toISOString();
}

function nowMinus(hours: number) {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Seed data — pre-populated so both queues demo the full state machine ────

const seedSubmissions: OnboardingSubmission[] = [
  {
    id: "sub_seed_emma",
    createdAt: nowMinus(20),
    accountFor: "guardian",
    accountHolder: { firstName: "John", lastName: "Doe", relationship: "Parent", mobile: "(415) 555-0142" },
    patient: { firstName: "Emma", lastName: "Doe", preferredName: "Emma", dob: "2009-12-10", sexAtBirth: "Female", pronouns: "Her/Hers" },
    careIntent: { careTypes: ["Talk Therapy", "ADHD Services"], location: "Rochester", skipped: false },
    insurance: { payerName: "Aetna", cardFrontUploaded: true, cardBackUploaded: true, relationshipToCardholder: "Child", cardholderFirstName: "John", cardholderLastName: "Doe", cardholderDob: "1983-05-14", memberId: "AET-771029" },
    formsCompleted: ["Patient Health Information"],
    step: 6,
    coordinator: DEFAULT_COORDINATOR,
    completedAt: nowMinus(19),
  },
  {
    id: "sub_seed_marcus",
    createdAt: nowMinus(6),
    accountFor: "self",
    accountHolder: { firstName: "Marcus", lastName: "Alvarez", relationship: "Self", mobile: "(585) 555-0188" },
    patient: { firstName: "Marcus", lastName: "Alvarez", dob: "1991-02-27", sexAtBirth: "Male" },
    careIntent: { careTypes: ["Medication Management"], location: "Telehealth", skipped: false },
    insurance: { payerName: "BlueCross BlueShield", cardFrontUploaded: true, cardBackUploaded: true, relationshipToCardholder: "Self", cardholderFirstName: "Marcus", cardholderLastName: "Alvarez", cardholderDob: "1991-02-27", memberId: "BCBS-450192" },
    formsCompleted: ["Patient Health Information"],
    step: 6,
    coordinator: DEFAULT_COORDINATOR,
    completedAt: nowMinus(5.5),
  },
  {
    id: "sub_seed_olivia",
    createdAt: nowMinus(30),
    accountFor: "self",
    accountHolder: { firstName: "Olivia", lastName: "Chen", relationship: "Self", mobile: "(212) 555-0117" },
    patient: { firstName: "Olivia", lastName: "Chen", dob: "1996-08-03", sexAtBirth: "Female", pronouns: "She/Her" },
    careIntent: { careTypes: ["Assessments & Tests"], location: "Albany", skipped: false },
    insurance: { payerName: "Highmark", cardFrontUploaded: true, cardBackUploaded: false, relationshipToCardholder: "Self", cardholderFirstName: "Olivia", cardholderLastName: "Chen", cardholderDob: "1996-08-03", memberId: "HM-990211" },
    formsCompleted: ["Patient Health Information"],
    step: 6,
    coordinator: DEFAULT_COORDINATOR,
    completedAt: nowMinus(29),
  },
  {
    id: "sub_seed_noah",
    createdAt: nowMinus(72),
    accountFor: "guardian",
    accountHolder: { firstName: "Grace", lastName: "Kim", relationship: "Parent", mobile: "(646) 555-0199" },
    patient: { firstName: "Noah", lastName: "Kim", dob: "2012-03-18", sexAtBirth: "Male" },
    careIntent: { careTypes: ["Talk Therapy"], location: "Farmington", skipped: false },
    insurance: { payerName: "Excellus", cardFrontUploaded: true, cardBackUploaded: true, relationshipToCardholder: "Child", cardholderFirstName: "Grace", cardholderLastName: "Kim", cardholderDob: "1980-11-02", memberId: "EXC-102938" },
    formsCompleted: ["Patient Health Information"],
    step: 6,
    coordinator: DEFAULT_COORDINATOR,
    completedAt: nowMinus(71),
  },
];

const seedWorklist: EligibilityWorklistItem[] = [
  {
    id: "elig_seed_emma",
    submissionId: "sub_seed_emma",
    patientName: "Emma Doe",
    payerName: "Aetna",
    memberId: "AET-771029",
    state: "in-progress",
    assignee: "Priya Shah",
    verificationChannel: "portal",
    carveOut: {
      vendor: "Optum Behavioral Health",
      payerId: "OPT-BH-4471",
      notes: "Aetna medical plan carves out behavioral health to Optum — verify network and auth rules against Optum, not Aetna directly.",
    },
    history: [
      { state: "pending", at: nowMinus(20) },
      { state: "in-progress", at: nowMinus(18), by: "Priya Shah" },
    ],
    createdAt: nowMinus(20),
  },
  {
    id: "elig_seed_marcus",
    submissionId: "sub_seed_marcus",
    patientName: "Marcus Alvarez",
    payerName: "BlueCross BlueShield",
    memberId: "BCBS-450192",
    state: "pending",
    history: [{ state: "pending", at: nowMinus(5.5) }],
    createdAt: nowMinus(5.5),
  },
  {
    id: "elig_seed_olivia",
    submissionId: "sub_seed_olivia",
    patientName: "Olivia Chen",
    payerName: "Highmark",
    memberId: "HM-990211",
    state: "on-hold",
    assignee: "Marcus Webb",
    onHoldReason: "Card back image missing — need full member ID to confirm digits before verifying.",
    history: [
      { state: "pending", at: nowMinus(29) },
      { state: "in-progress", at: nowMinus(28), by: "Marcus Webb" },
      { state: "on-hold", at: nowMinus(27), by: "Marcus Webb", note: "Card back image missing" },
    ],
    createdAt: nowMinus(29),
  },
  {
    id: "elig_seed_noah",
    submissionId: "sub_seed_noah",
    patientName: "Noah Kim",
    payerName: "Excellus",
    memberId: "EXC-102938",
    state: "verified-active",
    assignee: "Dana Ruiz",
    verificationChannel: "clearinghouse",
    history: [
      { state: "pending", at: nowMinus(71) },
      { state: "in-progress", at: nowMinus(70), by: "Dana Ruiz" },
      { state: "verified-active", at: nowMinus(69), by: "Dana Ruiz", note: "Coverage confirmed active via clearinghouse" },
    ],
    createdAt: nowMinus(71),
    resolvedAt: nowMinus(69),
  },
];

const seedTasks: Task[] = [
  {
    id: "task_seed_emma",
    type: "onboarding-prep",
    title: "New patient onboarding started — Emma Doe",
    detail: "Guardian John Doe (Parent) started onboarding. Confirm location fit and follow up on guardian consent/POA upload.",
    patientName: "Emma Doe",
    submissionId: "sub_seed_emma",
    assignee: DEFAULT_COORDINATOR,
    status: "open",
    createdAt: nowMinus(20),
  },
  {
    id: "task_seed_marcus",
    type: "onboarding-prep",
    title: "New patient onboarding started — Marcus Alvarez",
    detail: "Self-enrolled patient. No guardian relationship to verify.",
    patientName: "Marcus Alvarez",
    submissionId: "sub_seed_marcus",
    assignee: DEFAULT_COORDINATOR,
    status: "open",
    createdAt: nowMinus(6),
  },
  {
    id: "task_seed_olivia",
    type: "onboarding-prep",
    title: "New patient onboarding started — Olivia Chen",
    detail: "Self-enrolled patient. No guardian relationship to verify.",
    patientName: "Olivia Chen",
    submissionId: "sub_seed_olivia",
    assignee: DEFAULT_COORDINATOR,
    status: "done",
    createdAt: nowMinus(30),
  },
  {
    id: "task_seed_noah_prep",
    type: "onboarding-prep",
    title: "New patient onboarding started — Noah Kim",
    detail: "Guardian Grace Kim (Parent) started onboarding.",
    patientName: "Noah Kim",
    submissionId: "sub_seed_noah",
    assignee: DEFAULT_COORDINATOR,
    status: "done",
    createdAt: nowMinus(72),
  },
  {
    id: "task_seed_noah_book",
    type: "book-appointment",
    title: "Eligibility verified — book appointment for Noah Kim",
    detail: "Excellus coverage confirmed Verified - Active via clearinghouse. Safe to book the first appointment.",
    patientName: "Noah Kim",
    submissionId: "sub_seed_noah",
    assignee: DEFAULT_COORDINATOR,
    status: "open",
    createdAt: nowMinus(69),
  },
];

let state: StoreState = {
  submissions: seedSubmissions,
  worklist: seedWorklist,
  tasks: seedTasks,
};

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

export function useOnboardingStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ── Onboarding wizard actions ────────────────────────────────────────────────

export function createSubmission(accountFor: "self" | "guardian"): string {
  const submissionId = id("sub");
  set((s) => ({
    ...s,
    submissions: [
      ...s.submissions,
      { id: submissionId, createdAt: now(), accountFor, formsCompleted: [], step: 1 },
    ],
  }));
  return submissionId;
}

export function submitAccountHolder(submissionId: string, data: AccountHolder) {
  const coordinator = DEFAULT_COORDINATOR;
  set((s) => ({
    ...s,
    submissions: s.submissions.map((sub) =>
      sub.id === submissionId ? { ...sub, accountHolder: data, step: 2, coordinator } : sub
    ),
    tasks: [
      ...s.tasks,
      {
        id: id("task"),
        type: "onboarding-prep",
        title: `New patient onboarding started — ${data.firstName} ${data.lastName}`,
        detail:
          data.relationship && data.relationship !== "Self"
            ? `${data.firstName} ${data.lastName} (${data.relationship}) started onboarding on behalf of a patient. Confirm location fit and follow up on guardian consent/POA upload.`
            : `${data.firstName} ${data.lastName} started onboarding for themselves.`,
        patientName: `${data.firstName} ${data.lastName}`,
        submissionId,
        assignee: coordinator,
        status: "open",
        createdAt: now(),
      },
    ],
  }));
}

export function submitPatientInfo(submissionId: string, data: PatientIdentity) {
  set((s) => ({
    ...s,
    submissions: s.submissions.map((sub) => (sub.id === submissionId ? { ...sub, patient: data, step: 3 } : sub)),
  }));
}

export function submitCareIntent(submissionId: string, data: CareIntent) {
  set((s) => ({
    ...s,
    submissions: s.submissions.map((sub) => (sub.id === submissionId ? { ...sub, careIntent: data, step: 4 } : sub)),
  }));
}

export function submitInsurance(submissionId: string, data: InsuranceSubmission) {
  set((s) => {
    const sub = s.submissions.find((x) => x.id === submissionId);
    const patientName = sub?.patient ? `${sub.patient.firstName} ${sub.patient.lastName}` : "Unknown patient";
    return {
      ...s,
      submissions: s.submissions.map((x) => (x.id === submissionId ? { ...x, insurance: data, step: 5 } : x)),
      worklist: [
        ...s.worklist,
        {
          id: id("elig"),
          submissionId,
          patientName,
          payerName: data.payerName,
          memberId: data.memberId,
          state: "pending",
          history: [{ state: "pending", at: now() }],
          createdAt: now(),
        },
      ],
    };
  });
}

export function completeForms(submissionId: string, forms: string[]) {
  set((s) => ({
    ...s,
    submissions: s.submissions.map((sub) =>
      sub.id === submissionId ? { ...sub, formsCompleted: forms, step: 6, completedAt: now() } : sub
    ),
  }));
}

// ── Revenue Management worklist actions ──────────────────────────────────────

function pushHistory(item: EligibilityWorklistItem, entry: HistoryEntry): EligibilityWorklistItem {
  return { ...item, history: [...item.history, entry] };
}

function bookAppointmentTask(item: EligibilityWorklistItem, outcomeLabel: string): Task {
  return {
    id: id("task"),
    type: "book-appointment",
    title: `Eligibility resolved — book appointment for ${item.patientName}`,
    detail: `${item.payerName} coverage resolved as "${outcomeLabel}". Safe to reach out and book the first appointment.`,
    patientName: item.patientName,
    submissionId: item.submissionId,
    assignee: DEFAULT_COORDINATOR,
    status: "open",
    createdAt: now(),
  };
}

export function pickWorklistItem(itemId: string, assignee: string = RCM_STAFF[0]) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "in-progress", assignee }, { state: "in-progress", at: now(), by: assignee })
        : it
    ),
  }));
}

export function setVerificationChannel(itemId: string, channel: "portal" | "phone" | "clearinghouse") {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) => (it.id === itemId ? { ...it, verificationChannel: channel } : it)),
  }));
}

const OUTCOME_LABELS: Record<string, string> = {
  "verified-active": "Verified - Active",
  "verified-inactive": "Verified - Inactive",
  "verified-not-covered": "Verified - Not Covered",
  "self-pay-confirmed": "Self-Pay Confirmed",
};

export function resolveVerification(
  itemId: string,
  outcome: "verified-active" | "verified-inactive" | "verified-not-covered"
) {
  set((s) => {
    const item = s.worklist.find((it) => it.id === itemId);
    if (!item) return s;
    const updated = pushHistory(
      { ...item, state: outcome, resolvedAt: now() },
      { state: outcome, at: now(), by: item.assignee, note: `Verified via ${item.verificationChannel ?? "portal"}` }
    );
    return {
      ...s,
      worklist: s.worklist.map((it) => (it.id === itemId ? updated : it)),
      tasks: [...s.tasks, bookAppointmentTask(updated, OUTCOME_LABELS[outcome])],
    };
  });
}

export function placeOnHold(itemId: string, reason: string) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "on-hold", onHoldReason: reason }, { state: "on-hold", at: now(), by: it.assignee, note: reason })
        : it
    ),
  }));
}

export function receiveMissingInfo(itemId: string) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "in-progress" }, { state: "in-progress", at: now(), by: it.assignee, note: "Missing information received from patient" })
        : it
    ),
  }));
}

export function markUnableToVerify(itemId: string, reason: string) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "unable-to-verify", unableReason: reason }, { state: "unable-to-verify", at: now(), by: it.assignee, note: reason })
        : it
    ),
  }));
}

export function convertToSelfPay(itemId: string) {
  set((s) => {
    const item = s.worklist.find((it) => it.id === itemId);
    if (!item) return s;
    const updated = pushHistory(
      { ...item, state: "self-pay-confirmed", resolvedAt: now() },
      { state: "self-pay-confirmed", at: now(), note: "Patient opted for self-pay" }
    );
    return {
      ...s,
      worklist: s.worklist.map((it) => (it.id === itemId ? updated : it)),
      tasks: [...s.tasks, bookAppointmentTask(updated, OUTCOME_LABELS["self-pay-confirmed"])],
    };
  });
}

export function reverify(itemId: string) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "in-progress" }, { state: "in-progress", at: now(), by: it.assignee, note: "Resubmitted for re-verification" })
        : it
    ),
  }));
}

export function expireCoverage(itemId: string) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) =>
      it.id === itemId
        ? pushHistory({ ...it, state: "expired" }, { state: "expired", at: now(), note: "Termination date passed (system)" })
        : it
    ),
  }));
}

export function setCarveOut(itemId: string, info: CarveOutInfo) {
  set((s) => ({
    ...s,
    worklist: s.worklist.map((it) => (it.id === itemId ? { ...it, carveOut: info } : it)),
  }));
}

// ── Care Coordinator task actions ────────────────────────────────────────────

export function completeTask(taskId: string) {
  set((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "done" } : t)),
  }));
}

export const RCM_ASSIGNEES = RCM_STAFF;
export const DEFAULT_CARE_COORDINATOR = DEFAULT_COORDINATOR;

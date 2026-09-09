"use client";

// The provider access gate. Four checks, all of which must pass (PRD
// "How permission is decided"): role, clinical status, capability, scope.
// Plus the module-level V / C / E / X matrix and the state gates that no
// capability can override.

import {
  STATUS_META,
  type ClinicalStatus,
  type ProviderCapabilities,
} from "@/data/provider-credentialing";
import type { ProviderSession } from "@/lib/provider-session";

/* ── Module access ────────────────────────────────────────────────────── */

export type Access = "V" | "C" | "E" | "X"; // View, Create, Edit, Execute/act

export type ProviderModule =
  | "patient-list" | "patient-demographics" | "patient-clinical" | "patient-insurance"
  | "patient-documents" | "patient-timeline" | "appointments" | "waiting-room"
  | "encounters" | "eligibility" | "bills" | "tasks" | "messages-patient"
  | "messages-internal" | "submissions" | "reports" | "availability" | "results"
  | "refills" | "medication" | "recents" | "settings";

const MODULE_ACCESS: Record<ProviderModule, Access[] | null> = {
  "patient-list": ["V"],
  "patient-demographics": ["V"],
  "patient-clinical": ["V", "C", "E"],
  "patient-insurance": ["V"],
  "patient-documents": ["V", "C", "E"],
  "patient-timeline": ["V"],
  appointments: ["V"],
  "waiting-room": ["V", "X"],
  encounters: ["V", "C", "E", "X"],
  eligibility: null, // not rendered
  bills: null, // not rendered — signing creates the bill
  tasks: ["V", "X"],
  "messages-patient": ["V", "C", "E", "X"],
  "messages-internal": ["V", "C", "E", "X"],
  submissions: null,
  reports: ["V"],
  availability: ["V", "C", "E", "X"],
  results: ["V"],
  refills: ["V"],
  medication: ["V"],
  recents: ["V"],
  settings: ["V", "E"],
};

export function moduleRendered(m: ProviderModule): boolean {
  return MODULE_ACCESS[m] !== null;
}

export function moduleAccess(m: ProviderModule, a: Access): boolean {
  return MODULE_ACCESS[m]?.includes(a) ?? false;
}

/* ── Gate 1: clinical status ──────────────────────────────────────────── */

export function statusPermitsLogin(status: ClinicalStatus) {
  return STATUS_META[status].permits.login;
}
export function statusPortal(status: ClinicalStatus) {
  return STATUS_META[status].permits.portal;
}
export function statusBanner(status: ClinicalStatus) {
  return STATUS_META[status].banner;
}

/* ── The composite gate ───────────────────────────────────────────────── */

export interface GateContext {
  session: ProviderSession;
  /** capability the action requires, if any */
  capability?: keyof ProviderCapabilities;
  /** does the action require an open-encounter-capable status? */
  requiresOpenEncounter?: boolean;
  requiresBookable?: boolean;
  requiresSign?: boolean;
  /** patient the action touches — checked against panel + can_view_all_patients */
  patientInPanel?: boolean;
}

export interface GateResult {
  ok: boolean;
  reason?: string;
  failedGate?: "role" | "status" | "capability" | "scope";
}

export function checkGate(ctx: GateContext): GateResult {
  const { session } = ctx;
  const permits = STATUS_META[session.clinicalStatus].permits;

  // Gate 2 — clinical status
  if (ctx.requiresOpenEncounter && !permits.openEncounter) {
    return { ok: false, failedGate: "status", reason: `Your status is ${STATUS_META[session.clinicalStatus].label} — you can't open an encounter.` };
  }
  if (ctx.requiresBookable && permits.bookable === false) {
    return { ok: false, failedGate: "status", reason: `Your status is ${STATUS_META[session.clinicalStatus].label} — you aren't bookable.` };
  }
  if (ctx.requiresSign && permits.signNotes === false) {
    return { ok: false, failedGate: "status", reason: `Your status is ${STATUS_META[session.clinicalStatus].label} — you can't sign notes.` };
  }

  // Gate 3 — capability
  if (ctx.capability && !session.capabilities[ctx.capability]) {
    return { ok: false, failedGate: "capability", reason: `You don't have the ${ctx.capability} capability.` };
  }

  // Gate 4 — scope
  if (ctx.patientInPanel === false && !session.capabilities.can_view_all_patients) {
    return { ok: false, failedGate: "scope", reason: "This patient isn't in your panel." };
  }

  return { ok: true };
}

/* ── Signature paths (PRD state gates) ────────────────────────────────── */

export type SignaturePath = "sign" | "sign-and-cosign" | "none";

/** Which signature control(s) a provider is offered for their own draft. */
export function signaturePaths(caps: ProviderCapabilities, status: ClinicalStatus): SignaturePath[] {
  if (STATUS_META[status].permits.signNotes === false) return [];
  if (caps.requires_cosign) return ["sign-and-cosign"]; // plain Sign is NOT offered
  if (caps.can_sign_notes) return ["sign"];
  return ["sign-and-cosign"];
}

/** Hard state-gate: a note needs at least one diagnosis and one procedure row. */
export function signatureBlockers(note: { diagnoses: unknown[]; procedures: unknown[] }): string[] {
  const out: string[] = [];
  if (note.diagnoses.length === 0) out.push("at least one diagnosis code");
  if (note.procedures.length === 0) out.push("at least one procedure row");
  return out;
}

/* ── Telehealth hard gates ────────────────────────────────────────────── */

export interface TelehealthGateInput {
  hasTelehealthConsent: boolean;
  patientState: string;
  licensedStates: string[];
  canTelehealth: boolean;
}

export function telehealthGate(i: TelehealthGateInput): GateResult {
  if (!i.canTelehealth) return { ok: false, failedGate: "capability", reason: "You aren't provisioned for telehealth." };
  if (!i.hasTelehealthConsent) return { ok: false, failedGate: "scope", reason: "No telehealth consent on record for this patient." };
  if (i.patientState && !i.licensedStates.includes(i.patientState)) {
    return { ok: false, failedGate: "scope", reason: `You aren't licensed in ${i.patientState}, where the patient is located. No acknowledgement makes this lawful.` };
  }
  return { ok: true };
}

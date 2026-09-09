"use client";

// Clinic-admin-configurable note templates. A template sets the section
// structure a note uses (via its base NoteType), a one-line description shown
// in the picker, and the default procedure code / duration. Templates are
// versioned: every written note stores the template id + the version in force
// when it was created, and a version can be deactivated but never deleted
// (PRD "Template selection gates the note").

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import type { NoteType } from "@/lib/encounter-notes-store";

export interface NoteTemplateVersion {
  version: number;
  createdAt: string;
  active: boolean;
  changeNote: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  baseNoteType: NoteType;
  defaultVisitType: string;
  defaultProcedureCode: string;
  defaultDurationMin: number;
  /** section ids (from groupsFor) that clinical judgement usually expects filled
   *  — surfaced as "recommended", never hard-required */
  recommendedSections: string[];
  versions: NoteTemplateVersion[];
  /** whole template retired — hidden from the picker, existing notes keep it */
  retired?: boolean;
}

function v(version: number, daysAgo: number, changeNote: string, active = true): NoteTemplateVersion {
  return { version, createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(), active, changeNote };
}

const SEED: NoteTemplate[] = [
  {
    id: "initial-eval",
    name: "Psychiatric Initial Evaluation",
    description: "Comprehensive new-patient intake — full history, mental status exam, diagnosis and treatment plan.",
    baseNoteType: "SOAP",
    defaultVisitType: "Initial Consultation",
    defaultProcedureCode: "90792",
    defaultDurationMin: 60,
    recommendedSections: ["presenting", "psychHistory", "mse", "assessment", "plan"],
    versions: [v(1, 400, "Initial release", false), v(2, 180, "Added substance-use screening fields", false), v(3, 30, "Split family & social history")],
  },
  {
    id: "med-management",
    name: "Medication Management Follow-Up",
    description: "Focused visit to review medication response, side effects and adherence.",
    baseNoteType: "SOAP",
    defaultVisitType: "Med Management",
    defaultProcedureCode: "99214",
    defaultDurationMin: 30,
    recommendedSections: ["presenting", "meds", "mse", "assessment", "plan"],
    versions: [v(1, 300, "Initial release", false), v(2, 120, "MSE reduced to core fields", false), v(3, 20, "Added MINT/TD screening to plan")],
  },
  {
    id: "therapy-progress",
    name: "Therapy Progress Note",
    description: "Individual psychotherapy session — presenting concerns, interventions and response.",
    baseNoteType: "DAP",
    defaultVisitType: "Talk Therapy",
    defaultProcedureCode: "90834",
    defaultDurationMin: 45,
    recommendedSections: ["data", "assessment", "plan"],
    versions: [v(1, 250, "Initial release", false), v(2, 45, "Switched to DAP structure")],
  },
  {
    id: "crisis",
    name: "Crisis / Urgent Visit",
    description: "Same-day visit for acute symptom escalation or safety concerns.",
    baseNoteType: "BIRP",
    defaultVisitType: "Crisis Visit",
    defaultProcedureCode: "90792",
    defaultDurationMin: 45,
    recommendedSections: ["behavior", "intervention", "response", "plan"],
    versions: [v(1, 200, "Initial release")],
  },
  {
    id: "group",
    name: "Group Session Note",
    description: "Group psychotherapy — group theme, individual participation and response.",
    baseNoteType: "DAP",
    defaultVisitType: "Group Session",
    defaultProcedureCode: "90853",
    defaultDurationMin: 90,
    recommendedSections: ["data", "assessment", "plan"],
    versions: [v(1, 150, "Initial release")],
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Episode-of-care summary at discharge — course of treatment, outcome and aftercare plan.",
    baseNoteType: "Narrative",
    defaultVisitType: "Follow-Up",
    defaultProcedureCode: "90834",
    defaultDurationMin: 30,
    recommendedSections: ["narrative", "plan"],
    versions: [v(1, 500, "Initial release", false), v(2, 90, "Added aftercare checklist")],
  },
  {
    id: "brief-telehealth",
    name: "Brief Telehealth Check-In",
    description: "Short virtual visit — flexible structure for any quick telehealth follow-up.",
    baseNoteType: "SOAP",
    defaultVisitType: "Follow-Up",
    defaultProcedureCode: "99213",
    defaultDurationMin: 20,
    recommendedSections: ["presenting", "assessment", "plan"],
    versions: [v(1, 60, "Initial release")],
  },
];

interface TemplateStoreState {
  templates: NoteTemplate[];
}

const store = createPersistedStore<TemplateStoreState>({
  key: "note-templates",
  initial: { templates: SEED },
  revive: (raw, initial) => {
    const saved = (raw as TemplateStoreState)?.templates;
    return saved && saved.length ? { templates: saved } : initial;
  },
});

export function useNoteTemplates() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getTemplates(): NoteTemplate[] {
  return store.get().templates;
}

/** Templates a provider can pick right now — not retired, has an active version. */
export function pickableTemplates(): NoteTemplate[] {
  return store.get().templates.filter((t) => !t.retired && t.versions.some((vv) => vv.active));
}

export function getTemplate(id: string): NoteTemplate | undefined {
  return store.get().templates.find((t) => t.id === id);
}

export function activeVersion(t: NoteTemplate): NoteTemplateVersion | undefined {
  return [...t.versions].reverse().find((vv) => vv.active);
}

/** Human label for a note's stored template + version. */
export function templateLabel(templateId?: string, version?: number): string {
  if (!templateId) return "No template";
  const t = getTemplate(templateId);
  if (!t) return `${templateId}${version ? ` v${version}` : ""}`;
  return version ? `${t.name} · v${version}` : t.name;
}

/* ── admin-side edits (used by the clinic-admin template screen) ───────── */

export function deactivateTemplateVersion(templateId: string, version: number) {
  store.set((s) => ({
    templates: s.templates.map((t) =>
      t.id === templateId
        ? { ...t, versions: t.versions.map((vv) => (vv.version === version ? { ...vv, active: false } : vv)) }
        : t,
    ),
  }));
}

export function publishTemplateVersion(templateId: string, changeNote: string) {
  store.set((s) => ({
    templates: s.templates.map((t) => {
      if (t.id !== templateId) return t;
      const next = Math.max(...t.versions.map((vv) => vv.version)) + 1;
      return {
        ...t,
        versions: [
          ...t.versions.map((vv) => ({ ...vv, active: false })),
          { version: next, createdAt: new Date().toISOString(), active: true, changeNote },
        ],
      };
    }),
  }));
}

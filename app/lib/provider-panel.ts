"use client";

// Panel membership is derived, never hand-maintained (PRD "Scope"): a patient
// is in a provider's panel if they have an appointment with that provider
// (past or future), an open encounter, or an explicit assignment. Reaching
// beyond the panel needs can_view_all_patients — and global search must never
// reveal that an out-of-panel patient exists.

import { CC_PATIENTS } from "@/data/cc-patients";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { getAllNotes } from "@/lib/encounter-notes-store";

export function getPanelPatientIds(providerId: string): Set<string> {
  const ids = new Set<string>();
  for (const p of CC_PATIENTS) if (p.primaryProviderId === providerId) ids.add(p.id);
  for (const a of CC_APPOINTMENTS) if (a.providerId === providerId) ids.add(a.patientId);
  for (const n of getAllNotes()) if (n.providerId === providerId) ids.add(n.patientId);
  return ids;
}

export function isPatientInPanel(providerId: string, patientId: string): boolean {
  return getPanelPatientIds(providerId).has(patientId);
}

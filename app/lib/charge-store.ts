"use client";

// Charges / superbill store. When a provider signs an encounter note the
// editor calls createChargeFromNote(doc) — the note's procedure rows (or a
// sensible default from the visit type) become charge lines and the whole
// thing lands in the Revenue Management "Charges" worklist as a "ready"
// claim. Same useSyncExternalStore pattern as the other prototype stores.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import type { EncounterNoteDoc } from "@/lib/encounter-notes-store";
import { DIAGNOSIS_CODES } from "@/lib/encounter-store";
import { visitTypeDef } from "@/lib/visit-types";

export type ChargeStatus = "ready" | "submitted" | "paid";

export interface ChargeLine {
  code: string;
  description: string;
  units: string;
  charge: string;
  modifiers: string;
  pos: string;
  dxPointers: string;
}

export interface Charge {
  id: string;
  noteId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  providerName: string;
  dateOfService: string;
  visitType: string;
  lines: ChargeLine[];
  diagnoses: { code: string; label: string }[];
  total: number;
  status: ChargeStatus;
  createdAt: string;
}

interface StoreState {
  charges: Charge[];
}

function now() {
  return new Date().toISOString();
}
function id() {
  return `chg_${Math.random().toString(36).slice(2, 9)}`;
}

// A couple of already-billed charges so the worklist isn't empty on a cold load.
function seed(): Charge[] {
  return [
    {
      id: "chg_seed1", noteId: "note05", appointmentId: undefined,
      patientId: "pt02", patientName: "Elena Vasquez", providerName: "Dr. Sarah Mitchell",
      dateOfService: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
      visitType: "Med Management",
      lines: [{ code: "99214", description: "E/M established, moderate", units: "1", charge: "175.00", modifiers: "", pos: "11", dxPointers: "1" }],
      diagnoses: [{ code: "F33.1", label: "MDD, recurrent, moderate" }],
      total: 175, status: "paid", createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: "chg_seed2", noteId: "note06", appointmentId: undefined,
      patientId: "pt07", patientName: "Robert Flynn", providerName: "Dr. Sarah Mitchell",
      dateOfService: new Date(Date.now() - 21 * 86400000).toISOString().split("T")[0],
      visitType: "Follow-Up",
      lines: [{ code: "99213", description: "E/M established, low", units: "1", charge: "130.00", modifiers: "", pos: "11", dxPointers: "1" }],
      diagnoses: [{ code: "F41.1", label: "Generalized Anxiety Disorder" }],
      total: 130, status: "submitted", createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];
}

const store = createPersistedStore<StoreState>({
  key: "charge-store",
  initial: { charges: seed() },
  revive: (raw, initial) => {
    const p = (raw as StoreState)?.charges ?? [];
    const seedIds = new Set(initial.charges.map((c) => c.id));
    // keep any seed charge the saved blob is missing, plus everything saved
    return { charges: [...p, ...initial.charges.filter((c) => !p.some((x) => x.id === c.id) && seedIds.has(c.id))] };
  },
});
const state = new Proxy({} as StoreState, { get: (_t, p) => (store.get() as unknown as Record<string, unknown>)[p as string] });
function set(updater: (s: StoreState) => StoreState) { store.set(updater); }

export function useChargeStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getCharges(): Charge[] {
  return state.charges;
}

export function getChargeForNote(noteId: string): Charge | undefined {
  return state.charges.find((c) => c.noteId === noteId);
}

/** Idempotent — signing the same note twice won't double-bill. */
export function createChargeFromNote(doc: EncounterNoteDoc): Charge {
  const existing = state.charges.find((c) => c.noteId === doc.id);
  if (existing) return existing;

  const vt = visitTypeDef(doc.visitType);
  const lines: ChargeLine[] = doc.procedures.length > 0
    ? doc.procedures.map((p) => ({
        code: p.code || "—",
        description: p.description || vt.label,
        units: p.quantity || "1",
        charge: p.charge || String(vt.typicalCharge.toFixed(2)),
        modifiers: p.modifiers || "",
        pos: p.pos || "11",
        dxPointers: p.dxPointers || "1",
      }))
    : [{
        code: doc.noteType === "SOAP" ? "99214" : "90834",
        description: vt.label,
        units: "1",
        charge: vt.typicalCharge.toFixed(2),
        modifiers: "",
        pos: doc.mode === "telehealth" ? "10" : "11",
        dxPointers: "1",
      }];

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.charge) || 0) * (parseFloat(l.units) || 1), 0);

  const diagnoses = (doc.diagnoses.length ? doc.diagnoses : ["F33.1"]).map((code) => ({
    code,
    label: DIAGNOSIS_CODES.find((d) => d.code === code)?.label ?? code,
  }));

  const charge: Charge = {
    id: id(),
    noteId: doc.id,
    appointmentId: doc.appointmentId,
    patientId: doc.patientId,
    patientName: doc.patientName,
    providerName: doc.providerName,
    dateOfService: doc.date,
    visitType: doc.visitType,
    lines,
    diagnoses,
    total,
    status: "ready",
    createdAt: now(),
  };

  set((s) => ({ charges: [charge, ...s.charges] }));
  return charge;
}

export function advanceChargeStatus(chargeId: string) {
  set((s) => ({
    charges: s.charges.map((c) => {
      if (c.id !== chargeId) return c;
      const next: ChargeStatus = c.status === "ready" ? "submitted" : c.status === "submitted" ? "paid" : "paid";
      return { ...c, status: next };
    }),
  }));
}

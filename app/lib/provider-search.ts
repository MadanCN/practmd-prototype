"use client";

// Global search for the provider shell. Covers the provider's own patients,
// appointments, notes, tasks and messages, grouped by type. Results never
// reveal existence outside the panel — an out-of-panel match simply isn't
// returned (no "access denied", which would confirm a patient exists).

import { CC_PATIENTS } from "@/data/cc-patients";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { PROVIDER_TASKS, PROVIDER_MESSAGE_THREADS } from "@/data/provider-today";
import { getAllNotes } from "@/lib/encounter-notes-store";
import { getPanelPatientIds } from "@/lib/provider-panel";

export type SearchGroup = "Patients" | "Appointments" | "Notes" | "Tasks" | "Messages";

export interface SearchResult {
  group: SearchGroup;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

function fmtDate(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function searchProvider(query: string, opts: { providerId: string; canViewAll: boolean }): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const panel = getPanelPatientIds(opts.providerId);
  const inScope = (patientId: string) => opts.canViewAll || panel.has(patientId);
  const out: SearchResult[] = [];

  for (const p of CC_PATIENTS) {
    if (!inScope(p.id)) continue;
    if ([p.displayName, p.mrn, p.email, p.phone].some((f) => f.toLowerCase().includes(q))) {
      out.push({ group: "Patients", id: p.id, title: p.displayName, subtitle: `${p.mrn} · ${p.insuranceProvider ?? "No insurer"}`, href: `/provider/patients/${p.id}` });
    }
  }

  for (const a of CC_APPOINTMENTS) {
    if (a.providerId !== opts.providerId || !inScope(a.patientId)) continue;
    const pt = CC_PATIENTS.find((p) => p.id === a.patientId);
    if (!pt) continue;
    if ([pt.displayName, a.visitType, a.status].some((f) => f.toLowerCase().includes(q))) {
      out.push({ group: "Appointments", id: a.id, title: `${pt.displayName} · ${a.visitType}`, subtitle: `${fmtDate(a.date)} ${a.startTime} · ${a.status}`, href: `/provider/appointments/list?appt=${a.id}` });
    }
  }

  for (const n of getAllNotes()) {
    if (n.providerId !== opts.providerId || !inScope(n.patientId)) continue;
    if ([n.patientName, n.visitType, n.noteType, n.status].some((f) => f.toLowerCase().includes(q))) {
      out.push({ group: "Notes", id: n.id, title: `${n.patientName} · ${n.visitType}`, subtitle: `${n.noteType} · ${n.status} · ${fmtDate(n.date)}`, href: `/provider/encounters/${n.id}` });
    }
  }

  for (const t of PROVIDER_TASKS) {
    if (t.patientId && !inScope(t.patientId)) continue;
    if ([t.title, t.description, t.patientName ?? ""].some((f) => f.toLowerCase().includes(q))) {
      out.push({ group: "Tasks", id: t.id, title: t.title, subtitle: t.patientName ? `${t.patientName} · ${t.dueLabel}` : t.dueLabel, href: `/provider/tasks?task=${t.id}` });
    }
  }

  for (const m of PROVIDER_MESSAGE_THREADS) {
    if (m.patientId && !inScope(m.patientId)) continue;
    if ([m.subject, m.participantName].some((f) => f.toLowerCase().includes(q))) {
      out.push({ group: "Messages", id: m.id, title: m.subject, subtitle: `${m.participantName} · ${m.channel}`, href: `/provider/messages/${m.channel === "patient" ? "patients" : "internal"}?thread=${m.id}` });
    }
  }

  return out.slice(0, 24);
}

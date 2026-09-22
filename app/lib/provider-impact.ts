// "What would this edit break?" — the appointment / co-sign counts the Edit
// guardrails show before an admin removes a clinic, changes working hours,
// turns off telehealth or turns off Can Co-sign.

import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { DAYS, type DayName } from "@/data/clinics";
import type { WorkingHour } from "@/data/providers";
import { getNotesToCoSign } from "@/lib/encounter-notes-store";
import { todayIso } from "@/lib/provider-validation";

/** Confirmed appointments from today onward — the ones that block access changes. */
export function futureConfirmed(providerId: string): CcAppointment[] {
  const today = todayIso();
  return CC_APPOINTMENTS.filter((a) => a.providerId === providerId && a.status === "confirmed" && a.date >= today);
}

export const confirmedAtClinic = (providerId: string, clinicId: string) =>
  futureConfirmed(providerId).filter((a) => a.clinicId === clinicId);

/** Confirmed video consults — their join links go dark while the licence is off. */
export const confirmedVideo = (providerId: string) =>
  futureConfirmed(providerId).filter((a) => a.mode === "telehealth");

export function pendingCosignCount(providerName: string): number {
  return getNotesToCoSign(providerName).length;
}

/* ── Working-hours impact ─────────────────────────────────────────────── */

const dayOfDate = (iso: string): DayName => DAYS[(new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7];
const mins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Is the appointment fully inside one of the day's working segments (and, when
 *  the appointment has a location, at that location)? */
export function fitsHours(hours: WorkingHour[], a: Pick<CcAppointment, "date" | "startTime" | "endTime" | "locationId">): boolean {
  const day = hours.find((h) => h.day === dayOfDate(a.date));
  if (!day || !day.isWorking) return false;
  return day.segments.some(
    (s) => mins(a.startTime) >= mins(s.startTime) && mins(a.endTime) <= mins(s.endTime) && (!a.locationId || s.locationId === a.locationId),
  );
}

/** Confirmed appointments on/after `fromDate` that sit inside the current hours
 *  but fall outside the proposed ones — i.e. the ones this change strands. */
export function appointmentsStrandedByHours(providerId: string, current: WorkingHour[], proposed: WorkingHour[], fromDate: string): CcAppointment[] {
  return futureConfirmed(providerId).filter((a) => a.date >= fromDate && fitsHours(current, a) && !fitsHours(proposed, a));
}

export function patientName(patientId: string): string {
  const p = CC_PATIENTS.find((x) => x.id === patientId);
  return p ? `${p.firstName} ${p.lastName}` : patientId;
}

export function formatApptWhen(a: Pick<CcAppointment, "date" | "startTime">): string {
  const d = new Date(a.date + "T00:00:00Z");
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })} · ${a.startTime}`;
}

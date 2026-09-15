// Shared slot-generation + availability engine for booking flows. Previously
// this logic (minus break-time exclusion, which nowhere implemented) was
// duplicated across NewAppointmentDrawer.tsx, RescheduleModal.tsx and
// WaitlistView.tsx — one copy here, reused by all three, fixes the bug once
// instead of three times.

import type { Provider } from "@/data/providers";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { addMinutes, todayIso } from "@/lib/cc-date-format";

export const SLOT_INTERVAL = 30;

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Every `SLOT_INTERVAL`-minute slot in a provider's working hours for one
 *  date. A provider's day is one or more location-tagged segments (see
 *  `WorkingHourSegment`) — passing `locationId` (a `ClinicLocation.id`, see
 *  data/clinics.ts) restricts slots to the segment(s) at that location (the
 *  normal booking-flow case, since a location is always chosen before a
 *  date); omitting it pools every segment regardless of location. Any gap
 *  between segments (e.g. a lunch break, or travel time between two sites)
 *  is excluded automatically since slots are only generated within each
 *  segment's own range. */
export function generateDaySlots(provider: Provider | undefined, date: string, locationId?: string): string[] {
  if (!provider || !date) return [];
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
  const wh = provider.workingHours.find((w) => w.day === dayName);
  if (!wh || !wh.isWorking) return [];
  const segments = locationId ? wh.segments.filter((s) => s.locationId === locationId) : wh.segments;

  const slots: string[] = [];
  for (const seg of segments) {
    let cur = seg.startTime;
    const end = seg.endTime;
    while (cur < end) {
      const next = addMinutes(cur, SLOT_INTERVAL);
      if (next > end) break;
      slots.push(cur);
      cur = next;
    }
  }
  return slots.sort();
}

/** Confirmed/completed appointment start times for a provider on a date —
 *  same contract as the old per-file `getBookedSlots`, kept here so the free-
 *  slot math and the booked-slot math live next to each other. */
export function getBookedSlots(providerId: string, date: string): string[] {
  return CC_APPOINTMENTS
    .filter((a) => a.providerId === providerId && a.date === date && ["confirmed", "completed", "arrived", "in-session"].includes(a.status))
    .map((a) => a.startTime);
}

export function getFreeSlots(provider: Provider | undefined, date: string, locationId?: string): string[] {
  const booked = provider ? getBookedSlots(provider.id, date) : [];
  return generateDaySlots(provider, date, locationId).filter((s) => !booked.includes(s));
}

export function hasAvailability(provider: Provider | undefined, date: string, locationId?: string): boolean {
  return getFreeSlots(provider, date, locationId).length > 0;
}

function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Which of the next `days` calendar days (starting today) have at least one
 *  free slot for this provider — the day-level dots on the mini calendar.
 *  Walks local calendar days (see the isoOf comment in
 *  MiniAvailabilityCalendar.tsx — a UTC round-trip here would shift dates by
 *  a day in positive-UTC-offset timezones), so today's own boundary is
 *  re-anchored via string comparison against todayIso() rather than assumed
 *  to be i=0. */
export function getAvailableDates(provider: Provider | undefined, days = 60, locationId?: string): Set<string> {
  const out = new Set<string>();
  if (!provider) return out;
  const start = new Date();
  const today = todayIso();
  for (let i = -1; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = isoOf(d);
    if (iso < today) continue;
    if (hasAvailability(provider, iso, locationId)) out.add(iso);
  }
  return out;
}

/** Is `resourceId` free for the given date + [startTime, endTime) window?
 *  Overlap check against every non-cancelled/no-show appointment already
 *  holding that room, optionally excluding one appointment (when checking
 *  availability while rescheduling that same appointment). */
export function isResourceFree(resourceId: string, date: string, startTime: string, endTime: string, excludeApptId?: string): boolean {
  const startMin = toMin(startTime);
  const endMin = toMin(endTime);
  return !CC_APPOINTMENTS.some((a: CcAppointment) => {
    if (a.resourceId !== resourceId || a.date !== date) return false;
    if (excludeApptId && a.id === excludeApptId) return false;
    if (a.status === "cancelled" || a.status === "no-show") return false;
    const aStart = toMin(a.startTime);
    const aEnd = toMin(a.endTime);
    return startMin < aEnd && endMin > aStart;
  });
}

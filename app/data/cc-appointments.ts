export type AppointmentStatus = "confirmed" | "waitlisted" | "requested" | "cancelled" | "completed" | "no-show" | "arrived" | "in-session";
export type AppointmentMode = "in-person" | "telehealth" | "phone";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";
export type ScheduleType = "appointment" | "waitlist";
export type AppointmentType = "fixed" | "reserved";

export interface AppointmentActivity {
  id: string;
  type: "created" | "status-change" | "rescheduled" | "note" | "eligibility" | "fee-charged" | "form-assigned" | "offer-sent" | "notification";
  timestamp: string;
  description: string;
  actor: "Care Coordinator" | "Patient" | "System" | "Provider";
  meta?: string;
}

export interface RecurrenceConfig {
  type: RecurrenceType;
  every?: number;
  daysOfWeek?: string[];
  endDate?: string;
  occurrences?: number;
}

export interface CcAppointment {
  id: string;
  patientId: string;
  providerId: string;
  clinicId: string;
  visitType: string;
  mode: AppointmentMode;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  scheduleType: ScheduleType;
  appointmentType: AppointmentType;
  notes?: string;
  forms?: string[];
  recurrence?: RecurrenceConfig;
  waitlistPosition?: number;
  waitlistPriority?: "crisis" | "urgent" | "routine";
  requestedAt?: string;
  reservedSlots?: { date: string; startTime: string; endTime: string }[];
  cancellationReason?: string;
  rescheduledFrom?: { date: string; startTime: string; endTime: string };
  activityLog?: AppointmentActivity[];
}

function d(offset: number): string {
  // UTC-based so d(0) === `new Date().toISOString().split("T")[0]` — the
  // "today" every provider/patient page computes. A local-midnight version
  // drifts a day in evening US timezones and de-syncs the whole app.
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString().split("T")[0];
}

/** Day-offset from today to a given weekday (1=Monday..7=Sunday) within the
 *  current Mon-Sun week — unlike raw d(offset), this stays correct no matter
 *  which day of the week the app happens to be running on. */
function weekOffset(isoWeekday: number): number {
  const todayIso = ((new Date().getUTCDay() + 6) % 7) + 1;
  return isoWeekday - todayIso;
}

/** Same as weekOffset but N whole weeks ahead — used to populate the
 *  Calendar with "this week + next two weeks" of appointments. */
function futureWeek(isoWeekday: number, weeks: number): number {
  return weekOffset(isoWeekday) + weeks * 7;
}

// offset relative to today:
//  -3 = Mon (if today Thu), -2 = Tue, -1 = Wed, 0 = Thu (today), 1 = Fri, 7 = next Thu
// We use fixed offsets from "today" so the calendar always shows current week

const RAW_APPOINTMENTS: CcAppointment[] = [
  // ── TODAY (0) ──────────────────────────────────────────────────────────────
  // Dr. Sarah Mitchell (p1) – Thu: 09:00-17:00
  { id: "a01", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(0), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "GAD-7", "New Patient Intake"], notes: "First visit – anxiety and mild depression" },
  { id: "a02", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(0), startTime: "10:00", endTime: "10:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["Medication Review"] },
  { id: "a03", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(0), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a04", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(0), startTime: "13:00", endTime: "14:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9"] },
  { id: "a05", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(0), startTime: "14:00", endTime: "14:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a06", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(0), startTime: "15:30", endTime: "16:30", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "GAD-7", "New Patient Intake"] },

  // Lisa Nguyen (p3) – Thu: 08:00-16:00
  { id: "a11", patientId: "pt11", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(0), startTime: "08:00", endTime: "09:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", recurrence: { type: "weekly", every: 1, daysOfWeek: ["Thursday"] } },
  { id: "a12", patientId: "pt12", providerId: "p3", clinicId: "new-hartford", visitType: "Initial Consultation", mode: "in-person", date: d(0), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "New Patient Intake"] },
  { id: "a13", patientId: "pt10", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(0), startTime: "10:00", endTime: "11:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a14", patientId: "pt15", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "telehealth", date: d(0), startTime: "13:00", endTime: "14:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a15", patientId: "pt06", providerId: "p3", clinicId: "new-hartford", visitType: "Follow-Up", mode: "in-person", date: d(0), startTime: "14:00", endTime: "15:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // Dr. James O'Brien (p2) – Thu: OFF (but we still show some waitlisted/requested)
  // Waitlisted appointments (today)
  { id: "a20", patientId: "pt08", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(0), startTime: "11:00", endTime: "12:00", duration: 60, status: "waitlisted", scheduleType: "waitlist", appointmentType: "fixed", waitlistPosition: 1, waitlistPriority: "crisis", notes: "Patient prefers morning slots" },
  { id: "a21", patientId: "pt09", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(0), startTime: "11:00", endTime: "12:00", duration: 60, status: "waitlisted", scheduleType: "waitlist", appointmentType: "fixed", waitlistPosition: 2, waitlistPriority: "urgent" },
  { id: "a22", patientId: "pt04", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(0), startTime: "10:00", endTime: "11:00", duration: 60, status: "waitlisted", scheduleType: "waitlist", appointmentType: "fixed", waitlistPosition: 3, waitlistPriority: "routine" },

  // Requested appointments (from patient portal – awaiting confirmation)
  { id: "a30", patientId: "pt13", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "telehealth", date: d(2), startTime: "10:00", endTime: "11:00", duration: 60, status: "requested", scheduleType: "appointment", appointmentType: "fixed", requestedAt: new Date().toISOString(), notes: "Patient requested via portal" },
  { id: "a31", patientId: "pt04", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(1), startTime: "14:00", endTime: "15:00", duration: 60, status: "requested", scheduleType: "appointment", appointmentType: "reserved", reservedSlots: [{ date: d(1), startTime: "14:00", endTime: "15:00" }, { date: d(3), startTime: "09:00", endTime: "10:00" }, { date: d(3), startTime: "11:00", endTime: "12:00" }], requestedAt: new Date().toISOString() },
  { id: "a32", patientId: "pt09", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(3), startTime: "08:00", endTime: "09:00", duration: 60, status: "requested", scheduleType: "appointment", appointmentType: "fixed", requestedAt: new Date().toISOString() },

  // ── MONDAY (-3) ────────────────────────────────────────────────────────────
  { id: "a40", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(-3), startTime: "09:30", endTime: "10:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a41", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(-3), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a42", patientId: "pt04", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "in-person", date: d(-3), startTime: "10:00", endTime: "11:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", recurrence: { type: "weekly", every: 1, daysOfWeek: ["Monday"] } },
  { id: "a43", patientId: "pt13", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "telehealth", date: d(-3), startTime: "14:00", endTime: "15:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── TUESDAY (-2) ───────────────────────────────────────────────────────────
  { id: "a50", patientId: "pt06", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(-2), startTime: "08:00", endTime: "09:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", recurrence: { type: "weekly", every: 1, daysOfWeek: ["Tuesday"] } },
  { id: "a51", patientId: "pt08", providerId: "p3", clinicId: "new-hartford", visitType: "Initial Consultation", mode: "in-person", date: d(-2), startTime: "09:00", endTime: "10:00", duration: 60, status: "completed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "New Patient Intake"] },
  { id: "a52", patientId: "pt15", providerId: "p3", clinicId: "new-hartford", visitType: "Follow-Up", mode: "in-person", date: d(-2), startTime: "13:00", endTime: "14:00", duration: 60, status: "completed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── WEDNESDAY (-1) ─────────────────────────────────────────────────────────
  { id: "a60", patientId: "pt04", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "telehealth", date: d(-1), startTime: "10:00", endTime: "11:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a61", patientId: "pt09", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(-1), startTime: "13:00", endTime: "14:00", duration: 60, status: "completed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "GAD-7"] },
  { id: "a62", patientId: "pt10", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(-1), startTime: "08:00", endTime: "09:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a63", patientId: "pt11", providerId: "p3", clinicId: "new-hartford", visitType: "Group Session", mode: "in-person", date: d(-1), startTime: "10:00", endTime: "11:30", duration: 90, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── FRIDAY (+1) ────────────────────────────────────────────────────────────
  { id: "a70", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(1), startTime: "09:00", endTime: "09:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a71", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(1), startTime: "10:00", endTime: "10:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a72", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(1), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a73", patientId: "pt04", providerId: "p2", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "in-person", date: d(1), startTime: "10:00", endTime: "11:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a74", patientId: "pt12", providerId: "p3", clinicId: "new-hartford", visitType: "Talk Therapy", mode: "in-person", date: d(1), startTime: "08:00", endTime: "09:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", recurrence: { type: "weekly", every: 1, daysOfWeek: ["Friday"] } },

  // ── Dr. Sarah Mitchell (p1) — rest of the current work week ─────────────────
  // Monday (isoWeekday 1) — working 09:00-17:00, break 12:00-13:00, mostly past/completed
  { id: "a80", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(weekOffset(1)), startTime: "09:00", endTime: "10:00", duration: 60, status: "completed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a81", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(weekOffset(1)), startTime: "10:30", endTime: "11:00", duration: 30, status: "completed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a82", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(weekOffset(1)), startTime: "14:00", endTime: "15:00", duration: 60, status: "completed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "New Patient Intake"] },
  { id: "a83", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(weekOffset(1)), startTime: "15:30", endTime: "16:00", duration: 30, status: "no-show", scheduleType: "appointment", appointmentType: "fixed" },

  // Thursday (isoWeekday 4) — working 09:00-17:00, break 12:00-13:00
  { id: "a84", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(weekOffset(4)), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "GAD-7", "New Patient Intake"] },
  { id: "a85", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(weekOffset(4)), startTime: "10:30", endTime: "11:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a86", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(weekOffset(4)), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a87", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(weekOffset(4)), startTime: "13:30", endTime: "14:30", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a88", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(weekOffset(4)), startTime: "14:30", endTime: "15:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a89", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(weekOffset(4)), startTime: "15:30", endTime: "16:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // Friday (isoWeekday 5) — working 09:00-15:00, no break
  { id: "a90", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(weekOffset(5)), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "New Patient Intake"] },
  { id: "a91", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(weekOffset(5)), startTime: "10:00", endTime: "10:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a92", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(weekOffset(5)), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a93", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(weekOffset(5)), startTime: "13:00", endTime: "13:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a94", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(weekOffset(5)), startTime: "14:00", endTime: "14:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── Already checked in today (seeds the Waiting Room on load) ───────────────
  { id: "a07", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(0), startTime: "12:00", endTime: "12:30", duration: 30, status: "arrived", scheduleType: "appointment", appointmentType: "fixed", forms: ["Medication Review"] },
  { id: "a08", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(0), startTime: "10:30", endTime: "11:00", duration: 30, status: "arrived", scheduleType: "appointment", appointmentType: "fixed" },

  // ── Spravato & TMS — Dr. Mitchell, spread across the 3-week window ──────────
  { id: "a09", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Spravato", mode: "in-person", date: d(0), startTime: "13:30", endTime: "15:30", duration: 120, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", notes: "In-office esketamine + 2 hr monitoring. BP checks q15." },
  { id: "a10", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "TMS", mode: "in-person", date: d(weekOffset(4)), startTime: "12:00", endTime: "12:40", duration: 40, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", notes: "TMS session 14 of 36" },
  { id: "a95", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Spravato", mode: "in-person", date: d(weekOffset(5)), startTime: "09:00", endTime: "11:00", duration: 120, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "a96", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "TMS", mode: "in-person", date: d(weekOffset(5)), startTime: "12:00", endTime: "12:40", duration: 40, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── NEXT WEEK (+1) — Dr. Sarah Mitchell (p1) ───────────────────────────────
  { id: "b01", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(futureWeek(1, 1)), startTime: "09:00", endTime: "09:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b02", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "telehealth", date: d(futureWeek(1, 1)), startTime: "10:00", endTime: "10:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b03", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Spravato", mode: "in-person", date: d(futureWeek(1, 1)), startTime: "13:00", endTime: "15:00", duration: 120, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b04", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(futureWeek(2, 1)), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "GAD-7", "New Patient Intake"] },
  { id: "b05", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "TMS", mode: "in-person", date: d(futureWeek(2, 1)), startTime: "12:00", endTime: "12:40", duration: 40, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b06", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "in-person", date: d(futureWeek(2, 1)), startTime: "14:00", endTime: "14:45", duration: 45, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b07", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "phone", date: d(futureWeek(4, 1)), startTime: "10:00", endTime: "10:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b08", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "telehealth", date: d(futureWeek(4, 1)), startTime: "11:00", endTime: "11:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "b09", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Crisis Visit", mode: "in-person", date: d(futureWeek(4, 1)), startTime: "15:00", endTime: "15:45", duration: 45, status: "requested", scheduleType: "appointment", appointmentType: "fixed", requestedAt: new Date().toISOString(), notes: "Patient requested urgent slot via portal" },
  { id: "b10", patientId: "pt02", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "in-person", date: d(futureWeek(5, 1)), startTime: "09:30", endTime: "10:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },

  // ── WEEK AFTER (+2) — Dr. Sarah Mitchell (p1) ──────────────────────────────
  { id: "c01", patientId: "pt01", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Follow-Up", mode: "in-person", date: d(futureWeek(1, 2)), startTime: "09:00", endTime: "09:30", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "c02", patientId: "pt11", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Spravato", mode: "in-person", date: d(futureWeek(1, 2)), startTime: "13:00", endTime: "15:00", duration: 120, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "c03", patientId: "pt07", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "TMS", mode: "in-person", date: d(futureWeek(2, 2)), startTime: "12:00", endTime: "12:40", duration: 40, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "c04", patientId: "pt14", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Med Management", mode: "telehealth", date: d(futureWeek(2, 2)), startTime: "10:30", endTime: "11:00", duration: 30, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "c05", patientId: "pt05", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Talk Therapy", mode: "in-person", date: d(futureWeek(4, 2)), startTime: "14:00", endTime: "14:45", duration: 45, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed" },
  { id: "c06", patientId: "pt03", providerId: "p1", clinicId: "penfield-psychiatry", visitType: "Initial Consultation", mode: "in-person", date: d(futureWeek(5, 2)), startTime: "09:00", endTime: "10:00", duration: 60, status: "confirmed", scheduleType: "appointment", appointmentType: "fixed", forms: ["PHQ-9", "New Patient Intake"] },
];

// The "today" block and the weekOffset() work-week blocks can resolve to the
// same calendar day (e.g. today is a Friday), which would double-book a
// provider at an identical start time. Drop those collisions, keeping the
// first (the hand-authored "today" rows win).
export const CC_APPOINTMENTS: CcAppointment[] = (() => {
  const seen = new Set<string>();
  return RAW_APPOINTMENTS.filter((a) => {
    if (a.status === "waitlisted" || a.status === "requested") return true;
    const key = `${a.providerId}|${a.date}|${a.startTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

// Helpers
export function getAppointmentsForDate(date: string) {
  return CC_APPOINTMENTS.filter(a => a.date === date);
}

export function getAppointmentsForProvider(providerId: string, date: string) {
  return CC_APPOINTMENTS.filter(a => a.providerId === providerId && a.date === date && a.status !== "waitlisted" && a.status !== "requested");
}

export function getWaitlistedAppointments() {
  return CC_APPOINTMENTS.filter(a => a.status === "waitlisted").sort((a, b) => (a.waitlistPosition ?? 99) - (b.waitlistPosition ?? 99));
}

export function getRequestedAppointments() {
  return CC_APPOINTMENTS.filter(a => a.status === "requested");
}

export function getBookedSlots(providerId: string, date: string): string[] {
  return CC_APPOINTMENTS
    .filter(a => a.providerId === providerId && a.date === date && ["confirmed", "completed"].includes(a.status))
    .map(a => a.startTime);
}

export function getWaitlistMatchesForProvider(providerId: string, allAppointments?: CcAppointment[]): CcAppointment[] {
  const source = allAppointments ?? CC_APPOINTMENTS;
  const priorityOrder: Record<string, number> = { crisis: 0, urgent: 1, routine: 2 };
  return source
    .filter(a => a.providerId === providerId && a.status === "waitlisted")
    .sort((a, b) => {
      const pa = priorityOrder[a.waitlistPriority ?? "routine"];
      const pb = priorityOrder[b.waitlistPriority ?? "routine"];
      return pa !== pb ? pa - pb : (a.waitlistPosition ?? 99) - (b.waitlistPosition ?? 99);
    });
}

export function getLastVisitForPatient(patientId: string): CcAppointment | null {
  const today = new Date().toISOString().split("T")[0];
  const past = CC_APPOINTMENTS
    .filter(a => a.patientId === patientId && a.date <= today && ["confirmed", "completed"].includes(a.status))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  return past[0] ?? null;
}

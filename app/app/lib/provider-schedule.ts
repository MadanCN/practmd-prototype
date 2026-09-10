import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { getEffectiveStatus, getEncounterForAppointment, isCalled, getNoteIdForAppointment } from "@/lib/encounter-store";

export type WrStatus = "waiting" | "called" | "with-provider" | "telehealth-waiting";

export interface WrEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  visitType: string;
  mode: "in-person" | "telehealth" | "phone";
  scheduledTime: string;
  arrivedAt: string;
  status: WrStatus;
  waitMinutes: number;
  room?: string;
  priority: "normal" | "urgent" | "crisis";
  insuranceStatus: "active" | "inactive" | "pending";
  noteId?: string;
}

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map((p) => [p.id, p]));

/** Derives today's waiting-room state for a provider from CC_APPOINTMENTS.
 *  Shared by the Waiting Room page and the provider Today dashboard so both
 *  read the same "who's checked in / who's in the virtual lobby" picture. */
export function buildWaitingRoom(providerId: string): WrEntry[] {
  const todayDate = new Date().toISOString().split("T")[0];
  // Only patients who have actually checked in belong in the waiting room —
  // a "confirmed" appointment scheduled for later today does not.
  const todaysAppts = CC_APPOINTMENTS.filter((a) => {
    if (a.providerId !== providerId || a.date !== todayDate) return false;
    const status = getEffectiveStatus(a);
    return status === "arrived" || status === "in-session";
  });

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return todaysAppts.map((appt, i) => {
    const [h, m] = appt.startTime.split(":").map(Number);
    const schMins = h * 60 + m;
    const diff = nowMins - schMins;

    const encounter = getEncounterForAppointment(appt.id);
    let status: WrStatus;
    if (encounter?.status === "in-progress") status = "with-provider";
    else if (appt.mode === "telehealth") status = "telehealth-waiting";
    else if (isCalled(appt.id)) status = "called";
    else status = "waiting";

    const patient = PATIENT_MAP[appt.patientId];

    const arrivedMinsAgo = Math.max(0, diff > 0 ? Math.min(diff, 15) : 5);
    const arriveTime = new Date(now.getTime() - arrivedMinsAgo * 60000);
    const arrivedAt = `${String(arriveTime.getHours()).padStart(2, "0")}:${String(arriveTime.getMinutes()).padStart(2, "0")}`;

    return {
      appointmentId: appt.id,
      patientId: appt.patientId,
      patientName: patient?.displayName ?? "Unknown",
      mrn: patient?.mrn ?? "",
      visitType: appt.visitType,
      mode: appt.mode,
      scheduledTime: appt.startTime,
      arrivedAt,
      status,
      waitMinutes: Math.max(0, diff > 0 ? diff : 0),
      room: appt.mode === "in-person" ? `Room ${i + 1}0${i + 1}` : undefined,
      priority: "normal",
      insuranceStatus: patient?.insuranceStatus ?? "active",
      noteId: getNoteIdForAppointment(appt.id),
    };
  });
}

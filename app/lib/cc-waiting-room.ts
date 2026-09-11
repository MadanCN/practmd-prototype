// Cross-provider waiting-room aggregation — a coordinator manages many
// providers at once, so "who's here right now, with whom, how long" is the
// CC-relevant view of today's appointments, not any single provider's
// schedule. Shared by the Waiting Room page and the Home dashboard so the
// two never disagree.

import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";

export type WrStatus = "waiting" | "called" | "with-provider" | "telehealth-waiting";

export interface WrEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  visitType: string;
  mode: "in-person" | "telehealth" | "phone";
  providerId: string;
  providerName: string;
  scheduledTime: string;
  arrivedAt: string;
  status: WrStatus;
  waitMinutes: number;
  room?: string;
  insuranceStatus: "active" | "inactive" | "pending";
}

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map((p) => [p.id, p]));
const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

export function buildWaitingRoom(): WrEntry[] {
  const todayIso = new Date().toISOString().split("T")[0];
  const relevant = CC_APPOINTMENTS.filter((a) =>
    a.date === todayIso && (a.status === "confirmed" || a.status === "arrived" || a.status === "in-session"));

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Group by provider to simulate per-provider ordering
  const byProvider: Record<string, typeof relevant> = {};
  for (const appt of relevant) {
    if (!byProvider[appt.providerId]) byProvider[appt.providerId] = [];
    byProvider[appt.providerId].push(appt);
  }

  const entries: WrEntry[] = [];

  for (const [providerId, appts] of Object.entries(byProvider)) {
    appts.forEach((appt, i) => {
      const [h, m] = appt.startTime.split(":").map(Number);
      const schMins = h * 60 + m;
      const diff = nowMins - schMins;

      let status: WrStatus;
      if (appt.mode === "telehealth") status = "telehealth-waiting";
      else if (i === 0) status = "with-provider";
      else if (i === 1) status = "called";
      else status = "waiting";

      const patient = PATIENT_MAP[appt.patientId];
      const provider = PROVIDER_MAP[providerId];

      const arrivedMinsAgo = Math.max(0, diff > 0 ? Math.min(diff, 15) : 5);
      const arriveTime = new Date(now.getTime() - arrivedMinsAgo * 60000);
      const arrivedAt = `${String(arriveTime.getHours()).padStart(2, "0")}:${String(arriveTime.getMinutes()).padStart(2, "0")}`;

      entries.push({
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: patient?.displayName ?? "Unknown",
        mrn: patient?.mrn ?? "",
        visitType: appt.visitType,
        mode: appt.mode,
        providerId,
        providerName: provider?.displayName ?? "Unknown Provider",
        scheduledTime: appt.startTime,
        arrivedAt,
        status,
        waitMinutes: Math.max(0, diff > 0 ? diff : 0),
        room: appt.mode === "in-person" ? `Room ${(i + 1) * 101}` : undefined,
        insuranceStatus: patient?.insuranceStatus ?? "active",
      });
    });
  }

  return entries;
}

// Bookable physical resources (rooms, and the equipment installed in them)
// for in-person visits. Greenfield — nothing in the app modeled this before;
// the closest prior art was `global-masters/screens/RoomTypes.tsx` /
// `EquipmentTypes.tsx`, which are just an admin taxonomy (room/equipment
// *categories*), never linked to a clinic, a schedule, or an appointment.
// This file is the first place a room is an actual bookable thing tied to a
// clinic, matching the categories those taxonomy screens already define.

export type RoomType = "consultation" | "therapy" | "group-therapy" | "treatment" | "assessment";

export interface ClinicResource {
  id: string;
  clinicId: string;
  name: string;
  roomType: RoomType;
  capacity: number;
  /** Equipment installed in the room — a treatment suite lists its device(s). */
  equipment: string[];
  isActive: boolean;
}

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  consultation: "Consultation Room",
  therapy: "Therapy Room",
  "group-therapy": "Group Therapy Room",
  treatment: "Treatment Suite",
  assessment: "Assessment Room",
};

export const CLINIC_RESOURCES: ClinicResource[] = [
  // ── Penfield Psychiatry ──────────────────────────────────────────────────
  { id: "res_pp_c1", clinicId: "penfield-psychiatry", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_pp_c2", clinicId: "penfield-psychiatry", name: "Consultation Room 2", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_pp_t1", clinicId: "penfield-psychiatry", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_pp_t2", clinicId: "penfield-psychiatry", name: "Therapy Room 2", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_pp_g1", clinicId: "penfield-psychiatry", name: "Group Therapy Room", roomType: "group-therapy", capacity: 12, equipment: ["Video Conferencing Unit"], isActive: true },
  { id: "res_pp_tr1", clinicId: "penfield-psychiatry", name: "Treatment Suite A (Spravato)", roomType: "treatment", capacity: 1, equipment: ["Blood Pressure Monitor", "Pulse Oximeter"], isActive: true },
  { id: "res_pp_tr2", clinicId: "penfield-psychiatry", name: "Treatment Suite B (TMS)", roomType: "treatment", capacity: 1, equipment: ["Transcranial Magnetic Stimulator"], isActive: true },
  { id: "res_pp_a1", clinicId: "penfield-psychiatry", name: "Assessment Room", roomType: "assessment", capacity: 2, equipment: ["Digital Scale"], isActive: true },

  // ── New Hartford Psychological Services ──────────────────────────────────
  { id: "res_nh_c1", clinicId: "new-hartford", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_nh_t1", clinicId: "new-hartford", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_nh_t2", clinicId: "new-hartford", name: "Therapy Room 2", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_nh_g1", clinicId: "new-hartford", name: "Group Therapy Room", roomType: "group-therapy", capacity: 10, equipment: [], isActive: true },
  { id: "res_nh_a1", clinicId: "new-hartford", name: "Assessment Room", roomType: "assessment", capacity: 2, equipment: ["Biofeedback Device"], isActive: true },

  // ── Shore Counseling ──────────────────────────────────────────────────────
  { id: "res_sc_c1", clinicId: "shore-counseling", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_sc_t1", clinicId: "shore-counseling", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_sc_g1", clinicId: "shore-counseling", name: "Group Therapy Room", roomType: "group-therapy", capacity: 8, equipment: [], isActive: true },
];

export function getResourcesForClinic(clinicId: string): ClinicResource[] {
  return CLINIC_RESOURCES.filter((r) => r.clinicId === clinicId && r.isActive);
}

export function getResource(id: string): ClinicResource | undefined {
  return CLINIC_RESOURCES.find((r) => r.id === id);
}

export function roomTypeLabel(t: RoomType): string {
  return ROOM_TYPE_LABEL[t];
}

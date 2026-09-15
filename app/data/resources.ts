// Bookable physical resources (rooms, and the equipment installed in them)
// for in-person visits. Greenfield — nothing in the app modeled this before;
// the closest prior art was `global-masters/screens/RoomTypes.tsx` /
// `EquipmentTypes.tsx`, which are just an admin taxonomy (room/equipment
// *categories*), never linked to a location, a schedule, or an appointment.
// This file is the first place a room is an actual bookable thing tied to a
// physical location, matching the categories those taxonomy screens already
// define. Keyed by `ClinicLocation.id` (data/clinics.ts), not `Clinic.id` —
// a room exists at one address, and a clinic can own several.

export type RoomType = "consultation" | "therapy" | "group-therapy" | "treatment" | "assessment";

export interface ClinicResource {
  id: string;
  locationId: string;
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
  // ── Penfield (Penfield Psychiatry's main site) ────────────────────────────
  { id: "res_pp_c1", locationId: "penfield", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_pp_c2", locationId: "penfield", name: "Consultation Room 2", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_pp_t1", locationId: "penfield", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_pp_t2", locationId: "penfield", name: "Therapy Room 2", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_pp_g1", locationId: "penfield", name: "Group Therapy Room", roomType: "group-therapy", capacity: 12, equipment: ["Video Conferencing Unit"], isActive: true },
  { id: "res_pp_tr1", locationId: "penfield", name: "Treatment Suite A (Spravato)", roomType: "treatment", capacity: 1, equipment: ["Blood Pressure Monitor", "Pulse Oximeter"], isActive: true },
  { id: "res_pp_tr2", locationId: "penfield", name: "Treatment Suite B (TMS)", roomType: "treatment", capacity: 1, equipment: ["Transcranial Magnetic Stimulator"], isActive: true },
  { id: "res_pp_a1", locationId: "penfield", name: "Assessment Room", roomType: "assessment", capacity: 2, equipment: ["Digital Scale"], isActive: true },

  // ── Utica (New Hartford Psychological Services' site) ─────────────────────
  { id: "res_nh_c1", locationId: "utica", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_nh_t1", locationId: "utica", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_nh_t2", locationId: "utica", name: "Therapy Room 2", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_nh_g1", locationId: "utica", name: "Group Therapy Room", roomType: "group-therapy", capacity: 10, equipment: [], isActive: true },
  { id: "res_nh_a1", locationId: "utica", name: "Assessment Room", roomType: "assessment", capacity: 2, equipment: ["Biofeedback Device"], isActive: true },

  // ── Shore Counseling (inactive location — kept only for legacy seed data) ──
  { id: "res_sc_c1", locationId: "shore-counseling", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_sc_t1", locationId: "shore-counseling", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_sc_g1", locationId: "shore-counseling", name: "Group Therapy Room", roomType: "group-therapy", capacity: 8, equipment: [], isActive: true },

  // ── Rochester (Penfield Psychiatry satellite) ─────────────────────────────
  { id: "res_ro_c1", locationId: "rochester", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_ro_t1", locationId: "rochester", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_ro_g1", locationId: "rochester", name: "Group Therapy Room", roomType: "group-therapy", capacity: 10, equipment: [], isActive: true },
  { id: "res_ro_a1", locationId: "rochester", name: "Assessment Room", roomType: "assessment", capacity: 2, equipment: ["Digital Scale"], isActive: true },

  // ── Ithaca (Penfield Psychiatry satellite) ────────────────────────────────
  { id: "res_it_c1", locationId: "ithaca", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_it_t1", locationId: "ithaca", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_it_g1", locationId: "ithaca", name: "Group Therapy Room", roomType: "group-therapy", capacity: 8, equipment: [], isActive: true },

  // ── Farmington (Penfield Psychiatry satellite) ────────────────────────────
  { id: "res_fa_c1", locationId: "farmington", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_fa_t1", locationId: "farmington", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },

  // ── Albany (Penfield Psychiatry satellite) ────────────────────────────────
  { id: "res_al_c1", locationId: "albany", name: "Consultation Room 1", roomType: "consultation", capacity: 3, equipment: [], isActive: true },
  { id: "res_al_t1", locationId: "albany", name: "Therapy Room 1", roomType: "therapy", capacity: 2, equipment: [], isActive: true },
  { id: "res_al_g1", locationId: "albany", name: "Group Therapy Room", roomType: "group-therapy", capacity: 10, equipment: ["Video Conferencing Unit"], isActive: true },
];

export function getResourcesForLocation(locationId: string): ClinicResource[] {
  return CLINIC_RESOURCES.filter((r) => r.locationId === locationId && r.isActive);
}

export function getResource(id: string): ClinicResource | undefined {
  return CLINIC_RESOURCES.find((r) => r.id === id);
}

export function roomTypeLabel(t: RoomType): string {
  return ROOM_TYPE_LABEL[t];
}

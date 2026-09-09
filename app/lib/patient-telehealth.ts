"use client";

// Telehealth eligibility per patient — the two hard gates on starting a video
// encounter (PRD "State gates"): a telehealth consent must be on record, and
// the patient's confirmed physical location must be a state the provider is
// licensed in. Prototype seed derived deterministically from the patient id.

import { CC_PATIENTS } from "@/data/cc-patients";

const STATES = ["New York", "New Jersey", "Connecticut", "Pennsylvania", "Florida"];

export interface PatientTelehealth {
  patientId: string;
  hasConsent: boolean;
  consentSignedOn?: string;
  confirmedState: string;
}

export const PATIENT_TELEHEALTH: Record<string, PatientTelehealth> = Object.fromEntries(
  CC_PATIENTS.map((p, i) => {
    const hasConsent = i % 7 !== 3; // one patient in seven has no consent on file
    return [
      p.id,
      {
        patientId: p.id,
        hasConsent,
        consentSignedOn: hasConsent ? new Date(Date.now() - (30 + i * 11) * 86400000).toISOString().split("T")[0] : undefined,
        // most patients in NY; a couple report an out-of-state location
        confirmedState: i % 5 === 4 ? STATES[(i % 3) + 1] : "New York",
      },
    ];
  }),
);

export function getPatientTelehealth(patientId: string): PatientTelehealth {
  return (
    PATIENT_TELEHEALTH[patientId] ?? { patientId, hasConsent: true, confirmedState: "New York" }
  );
}

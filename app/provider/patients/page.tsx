"use client";

import { useMemo } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PatientsPanel } from "@/components/provider/patients/PatientsPanel";
import { getMyPatients } from "@/data/provider-patients";

export default function ProviderPatientsPage() {
  const patients = useMemo(() => getMyPatients(), []);
  return (
    <ProviderLayout>
      <PatientsPanel
        patients={patients}
        basePath="/provider"
        title="My Patients"
        subtitle={`${patients.length} patients in your panel at Penfield Psychiatry`}
        referable
        visitScope="p1"
      />
    </ProviderLayout>
  );
}

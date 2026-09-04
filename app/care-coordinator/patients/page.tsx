"use client";

import { useMemo } from "react";
import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import { PatientsPanel } from "@/components/provider/patients/PatientsPanel";
import { getAllPatients } from "@/data/provider-patients";

export default function CcPatientsPage() {
  const patients = useMemo(() => getAllPatients(), []);
  return (
    <CcLayout>
      <PatientsPanel
        patients={patients}
        basePath="/care-coordinator"
        title="Patients"
        subtitle={`${patients.length} patients across all providers`}
      />
    </CcLayout>
  );
}

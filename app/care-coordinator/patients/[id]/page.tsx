"use client";

import { use } from "react";
import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import { PatientProfileShell } from "@/components/provider/patients/PatientProfileShell";
import { ChartBaseProvider } from "@/components/provider/patients/chart-base";

export default function CcPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CcLayout>
      <ChartBaseProvider base="/care-coordinator">
        <PatientProfileShell id={id} />
      </ChartBaseProvider>
    </CcLayout>
  );
}

"use client";

import { use } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PatientProfileShell } from "@/components/provider/patients/PatientProfileShell";

export default function ProviderPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProviderLayout>
      <PatientProfileShell id={id} />
    </ProviderLayout>
  );
}

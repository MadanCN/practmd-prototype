"use client";

import { Suspense } from "react";
import RmLayout from "@/components/revenue-management/layout/RmLayout";
import ClaimsList from "@/components/revenue-management/ClaimsList";

export default function ClaimsPage() {
  return (
    <RmLayout>
      <Suspense fallback={null}>
        <ClaimsList />
      </Suspense>
    </RmLayout>
  );
}

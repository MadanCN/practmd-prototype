"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { RefreshCw } from "lucide-react";

const SEED = [
  { id: "1", name: "Annual Wellness Check", displayOrder: 1, isActive: true },
  { id: "2", name: "Follow-up Required", displayOrder: 2, isActive: true },
  { id: "3", name: "Medication Review", displayOrder: 3, isActive: true },
  { id: "4", name: "Lab Results", displayOrder: 4, isActive: true },
  { id: "5", name: "Preventive Care", displayOrder: 5, isActive: true },
  { id: "6", name: "Care Plan Review", displayOrder: 6, isActive: true },
];

export default function RecallTypesScreen() {
  return (
    <GmSimpleTable
      title="Recall Types"
      description="Define categories for patient recall campaigns — what the recall is for (e.g., annual checkup, medication review)."
      icon={RefreshCw}
      singularLabel="Recall Type"
      seedData={SEED}
    />
  );
}

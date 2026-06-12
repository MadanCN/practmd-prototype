"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { UserCircle } from "lucide-react";

const SEED = [
  { id: "1", name: "New Patient", displayOrder: 1, isActive: true },
  { id: "2", name: "Established Patient", displayOrder: 2, isActive: true },
  { id: "3", name: "Referral", displayOrder: 3, isActive: true },
  { id: "4", name: "Walk-in", displayOrder: 4, isActive: true },
  { id: "5", name: "Self-Pay", displayOrder: 5, isActive: true },
  { id: "6", name: "Insurance", displayOrder: 6, isActive: true },
];

export default function PatientTypeScreen() {
  return (
    <GmSimpleTable
      title="Patient Types"
      description="Classify patients by their relationship to the practice, used for scheduling, billing, and reporting."
      icon={UserCircle}
      singularLabel="Patient Type"
      seedData={SEED}
    />
  );
}

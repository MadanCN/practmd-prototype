"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { Workflow } from "lucide-react";

const SEED = [
  { id: "1", name: "Lead", displayOrder: 1, isActive: true },
  { id: "2", name: "Prospect", displayOrder: 2, isActive: true },
  { id: "3", name: "Pending Intake", displayOrder: 3, isActive: true },
  { id: "4", name: "Active", displayOrder: 4, isActive: true },
  { id: "5", name: "On Hold", displayOrder: 5, isActive: true },
  { id: "6", name: "Discharged", displayOrder: 6, isActive: true },
  { id: "7", name: "Inactive", displayOrder: 7, isActive: false },
];

export default function PatientStageScreen() {
  return (
    <GmSimpleTable
      title="Patient Stages"
      description="Define lifecycle stages for patients, from initial inquiry through active care to discharge."
      icon={Workflow}
      singularLabel="Patient Stage"
      seedData={SEED}
    />
  );
}

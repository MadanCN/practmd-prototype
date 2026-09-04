"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { ListChecks } from "lucide-react";

const SEED = [
  { id: "1", name: "Pending", displayOrder: 1, isActive: true },
  { id: "2", name: "Contacted", displayOrder: 2, isActive: true },
  { id: "3", name: "Appointment Booked", displayOrder: 3, isActive: true },
  { id: "4", name: "Completed", displayOrder: 4, isActive: true },
  { id: "5", name: "No Response", displayOrder: 5, isActive: true },
  { id: "6", name: "Declined", displayOrder: 6, isActive: true },
  { id: "7", name: "Cancelled", displayOrder: 7, isActive: false },
];

export default function RecallStatusScreen() {
  return (
    <GmSimpleTable
      title="Recall Status"
      description="Track the current state of a patient recall record through the outreach lifecycle."
      icon={ListChecks}
      singularLabel="Recall Status"
      seedData={SEED}
    />
  );
}

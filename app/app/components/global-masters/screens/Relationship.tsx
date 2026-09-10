"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { Users } from "lucide-react";

const SEED = [
  { id: "1", name: "Self", displayOrder: 1, isActive: true },
  { id: "2", name: "Spouse", displayOrder: 2, isActive: true },
  { id: "3", name: "Parent", displayOrder: 3, isActive: true },
  { id: "4", name: "Child", displayOrder: 4, isActive: true },
  { id: "5", name: "Sibling", displayOrder: 5, isActive: true },
  { id: "6", name: "Guardian", displayOrder: 6, isActive: true },
  { id: "7", name: "Grandparent", displayOrder: 7, isActive: true },
  { id: "8", name: "Caregiver", displayOrder: 8, isActive: true },
  { id: "9", name: "Emergency Contact", displayOrder: 9, isActive: true },
  { id: "10", name: "Other", displayOrder: 10, isActive: true },
];

export default function RelationshipScreen() {
  return (
    <GmSimpleTable
      title="Relationship to Patient"
      description="Define how a contact or guarantor relates to the patient (used for insurance, emergency contacts, and billing)."
      icon={Users}
      singularLabel="Relationship"
      seedData={SEED}
    />
  );
}

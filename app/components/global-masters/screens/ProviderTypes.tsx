"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { UserCog } from "lucide-react";

const SEED = [
  { id: "1", name: "Psychiatrist", displayOrder: 1, isActive: true },
  { id: "2", name: "Psychologist", displayOrder: 2, isActive: true },
  { id: "3", name: "Licensed Clinical Social Worker", displayOrder: 3, isActive: true },
  { id: "4", name: "Licensed Professional Counselor", displayOrder: 4, isActive: true },
  { id: "5", name: "Psychiatric Nurse Practitioner", displayOrder: 5, isActive: true },
  { id: "6", name: "Marriage and Family Therapist", displayOrder: 6, isActive: true },
  { id: "7", name: "Certified Alcohol & Drug Counselor", displayOrder: 7, isActive: true },
  { id: "8", name: "Behavioral Health Coach", displayOrder: 8, isActive: true },
];

export default function ProviderTypesScreen() {
  return (
    <GmSimpleTable
      title="Provider Types"
      description="Define the clinical provider categories used for credential tracking, scheduling rules, and billing classification."
      icon={UserCog}
      singularLabel="Provider Type"
      seedData={SEED}
    />
  );
}

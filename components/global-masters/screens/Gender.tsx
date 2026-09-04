"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { VenusAndMars } from "lucide-react";

const SEED = [
  { id: "1", name: "Male", displayOrder: 1, isActive: true },
  { id: "2", name: "Female", displayOrder: 2, isActive: true },
  { id: "3", name: "Non-binary", displayOrder: 3, isActive: true },
  { id: "4", name: "Transgender Male", displayOrder: 4, isActive: true },
  { id: "5", name: "Transgender Female", displayOrder: 5, isActive: true },
  { id: "6", name: "Genderqueer", displayOrder: 6, isActive: true },
  { id: "7", name: "Gender Fluid", displayOrder: 7, isActive: true },
  { id: "8", name: "Prefer Not to Say", displayOrder: 8, isActive: true },
  { id: "9", name: "Other", displayOrder: 9, isActive: true },
];

export default function GenderScreen() {
  return (
    <GmSimpleTable
      title="Gender"
      description="Configure the gender options available when registering or updating a patient profile."
      icon={VenusAndMars}
      singularLabel="Gender"
      seedData={SEED}
    />
  );
}

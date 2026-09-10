"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { Heart } from "lucide-react";

const SEED = [
  { id: "1", name: "Single", displayOrder: 1, isActive: true },
  { id: "2", name: "Married", displayOrder: 2, isActive: true },
  { id: "3", name: "Domestic Partner", displayOrder: 3, isActive: true },
  { id: "4", name: "Separated", displayOrder: 4, isActive: true },
  { id: "5", name: "Divorced", displayOrder: 5, isActive: true },
  { id: "6", name: "Widowed", displayOrder: 6, isActive: true },
  { id: "7", name: "Unknown", displayOrder: 7, isActive: true },
];

export default function MaritalStatusScreen() {
  return (
    <GmSimpleTable
      title="Marital Status"
      description="Define the marital status options for patient demographic records."
      icon={Heart}
      singularLabel="Marital Status"
      seedData={SEED}
    />
  );
}

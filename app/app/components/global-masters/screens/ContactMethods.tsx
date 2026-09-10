"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { Phone } from "lucide-react";

const SEED = [
  { id: "1", name: "Mobile Phone", displayOrder: 1, isActive: true },
  { id: "2", name: "Home Phone", displayOrder: 2, isActive: true },
  { id: "3", name: "Work Phone", displayOrder: 3, isActive: true },
  { id: "4", name: "Email", displayOrder: 4, isActive: true },
  { id: "5", name: "SMS Text", displayOrder: 5, isActive: true },
  { id: "6", name: "Patient Portal", displayOrder: 6, isActive: true },
  { id: "7", name: "Mail", displayOrder: 7, isActive: false },
];

export default function ContactMethodsScreen() {
  return (
    <GmSimpleTable
      title="Contact Methods"
      description="Define the available methods for contacting patients for appointments, reminders, and general communication."
      icon={Phone}
      singularLabel="Contact Method"
      seedData={SEED}
    />
  );
}

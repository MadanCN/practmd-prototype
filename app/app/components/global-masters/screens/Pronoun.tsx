"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { MessageCircle } from "lucide-react";

const SEED = [
  { id: "1", name: "He/Him", displayOrder: 1, isActive: true },
  { id: "2", name: "She/Her", displayOrder: 2, isActive: true },
  { id: "3", name: "They/Them", displayOrder: 3, isActive: true },
  { id: "4", name: "Ze/Hir", displayOrder: 4, isActive: true },
  { id: "5", name: "Xe/Xem", displayOrder: 5, isActive: true },
  { id: "6", name: "Prefer Not to Say", displayOrder: 6, isActive: true },
];

export default function PronounScreen() {
  return (
    <GmSimpleTable
      title="Pronouns"
      description="Manage preferred pronoun options displayed in patient and provider profiles."
      icon={MessageCircle}
      singularLabel="Pronoun"
      seedData={SEED}
    />
  );
}

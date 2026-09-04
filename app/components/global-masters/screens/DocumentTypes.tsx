"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { FileText } from "lucide-react";

const SEED = [
  { id: "1", name: "Intake Form", description: "Initial patient intake and history form", displayOrder: 1, isActive: true },
  { id: "2", name: "Consent Form", description: "Patient consent for treatment and privacy policies", displayOrder: 2, isActive: true },
  { id: "3", name: "Progress Note", description: "Session or visit clinical progress note", displayOrder: 3, isActive: true },
  { id: "4", name: "Discharge Summary", description: "Summary at the end of care", displayOrder: 4, isActive: true },
  { id: "5", name: "Referral Letter", description: "Formal referral to another provider", displayOrder: 5, isActive: true },
  { id: "6", name: "Insurance Authorization", description: "Prior authorization documentation", displayOrder: 6, isActive: true },
  { id: "7", name: "Lab Report", description: "Laboratory results and interpretation", displayOrder: 7, isActive: true },
  { id: "8", name: "Assessment Report", description: "Psychological or clinical assessment results", displayOrder: 8, isActive: true },
  { id: "9", name: "Treatment Plan", description: "Structured care plan document", displayOrder: 9, isActive: true },
];

export default function DocumentTypesScreen() {
  return (
    <GmSimpleTable
      title="Document Types"
      description="Define the categories of clinical documents that can be uploaded, generated, or attached in patient charts."
      icon={FileText}
      singularLabel="Document Type"
      seedData={SEED}
      hasDescription
    />
  );
}

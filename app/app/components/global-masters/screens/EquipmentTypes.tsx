"use client";
import GmSimpleTable from "@/components/global-masters/GmSimpleTable";
import { Stethoscope } from "lucide-react";

const SEED = [
  { id: "1", name: "EEG Machine", description: "Electroencephalogram for brain activity monitoring", displayOrder: 1, isActive: true },
  { id: "2", name: "Biofeedback Device", description: "Real-time physiological feedback equipment", displayOrder: 2, isActive: true },
  { id: "3", name: "Transcranial Magnetic Stimulator", description: "TMS device for non-invasive brain stimulation", displayOrder: 3, isActive: true },
  { id: "4", name: "Video Conferencing Unit", description: "Dedicated telehealth video equipment", displayOrder: 4, isActive: true },
  { id: "5", name: "Digital Scale", description: "Patient weight measurement device", displayOrder: 5, isActive: true },
  { id: "6", name: "Blood Pressure Monitor", description: "Automated BP cuff for vitals", displayOrder: 6, isActive: true },
  { id: "7", name: "Pulse Oximeter", description: "SpO2 and pulse rate monitoring", displayOrder: 7, isActive: true },
];

export default function EquipmentTypesScreen() {
  return (
    <GmSimpleTable
      title="Equipment Types"
      description="Manage the types of medical and clinical equipment available across clinic locations."
      icon={Stethoscope}
      singularLabel="Equipment Type"
      seedData={SEED}
      hasDescription
    />
  );
}

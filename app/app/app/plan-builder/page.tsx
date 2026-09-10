import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { LayoutTemplate } from "lucide-react";

export default function PlanBuilderPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Plan Builder"
        description="Design and configure care plan templates, treatment pathways, and clinical protocols. Set goals, milestones, task assignments, and follow-up cadences for specific diagnoses or specialties."
        icon={LayoutTemplate}
      />
    </AppLayout>
  );
}

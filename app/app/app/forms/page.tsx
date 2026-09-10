import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { FileText } from "lucide-react";

export default function FormsPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Forms"
        description="Build, manage, and version clinical and administrative form templates — intake forms, assessments (PHQ-9, GAD-7), consents, and custom questionnaires with conditional logic."
        icon={FileText}
      />
    </AppLayout>
  );
}

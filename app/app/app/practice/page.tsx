import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Briefcase } from "lucide-react";

export default function PracticePage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Practice"
        description="Configure and manage practices — groupings of related clinical services, specialties, or business units within the organization. Define care settings, billing groups, and service lines."
        icon={Briefcase}
      />
    </AppLayout>
  );
}

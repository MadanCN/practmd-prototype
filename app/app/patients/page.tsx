import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { PersonStanding } from "lucide-react";

export default function PatientsPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Patients"
        description="Manage the patient registry — demographics, insurance, care team assignments, access controls, and cross-clinic record visibility across the organization."
        icon={PersonStanding}
      />
    </AppLayout>
  );
}

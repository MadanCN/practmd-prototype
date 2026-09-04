import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Building2 } from "lucide-react";

export default function OrganizationPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Organization"
        description="Manage the tenant or legal healthcare entity — NPI, billing identifiers, contracts, branding, and top-level compliance settings that govern all practices and clinics beneath it."
        icon={Building2}
      />
    </AppLayout>
  );
}

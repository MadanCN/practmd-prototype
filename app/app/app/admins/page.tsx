import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { ShieldCheck } from "lucide-react";

export default function AdminsPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Admins"
        description="Manage platform and clinic administrators — invite users, assign roles, configure permission scopes, and control access across organizations, practices, and clinics."
        icon={ShieldCheck}
      />
    </AppLayout>
  );
}

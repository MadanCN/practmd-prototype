import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Profile"
        description="Manage your admin profile — personal information, notification preferences, two-factor authentication, session management, and activity history."
        icon={UserCircle}
      />
    </AppLayout>
  );
}

import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Settings"
        description="Platform-wide configuration — integrations, API keys, notification preferences, security policies, feature flags, and system maintenance controls."
        icon={Settings}
      />
    </AppLayout>
  );
}

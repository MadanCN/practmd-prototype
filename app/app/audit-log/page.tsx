import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { ClipboardList } from "lucide-react";

export default function AuditLogPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Audit Log"
        description="Immutable, searchable audit trail of all system events — user actions, data access, configuration changes, and security events. Supports HIPAA compliance reporting and forensic review."
        icon={ClipboardList}
      />
    </AppLayout>
  );
}

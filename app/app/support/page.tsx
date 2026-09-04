import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { MessageSquareHeart } from "lucide-react";

export default function SupportPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Support & Feedback"
        description="Submit support tickets, report issues, suggest features, and access contextual documentation and resource links — all organized by module and workflow."
        icon={MessageSquareHeart}
      />
    </AppLayout>
  );
}

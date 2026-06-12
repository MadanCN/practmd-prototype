import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { MessageSquare } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Messages" description="Provider messaging coming soon." icon={MessageSquare} />
    </ProviderLayout>
  );
}

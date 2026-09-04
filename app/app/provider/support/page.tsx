import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { HelpCircle } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Support" description="Provider help and support coming soon." icon={HelpCircle} />
    </ProviderLayout>
  );
}

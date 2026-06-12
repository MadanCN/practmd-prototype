import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Analytics" description="Provider analytics and reporting coming soon." icon={BarChart3} />
    </ProviderLayout>
  );
}

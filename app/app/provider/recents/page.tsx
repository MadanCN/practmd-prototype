import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Clock } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Recents" description="Recently viewed patients and records coming soon." icon={Clock} />
    </ProviderLayout>
  );
}

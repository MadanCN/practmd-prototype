import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { CheckSquare } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Tasks" description="Provider task management coming soon." icon={CheckSquare} />
    </ProviderLayout>
  );
}

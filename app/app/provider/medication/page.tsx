import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Pill } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Medication" description="Prescription management and medication history coming soon." icon={Pill} />
    </ProviderLayout>
  );
}

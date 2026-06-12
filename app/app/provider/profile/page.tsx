import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { UserCircle } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Profile" description="Provider profile management coming soon." icon={UserCircle} />
    </ProviderLayout>
  );
}

import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { Settings } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Settings" description="Provider account settings coming soon." icon={Settings} />
    </ProviderLayout>
  );
}

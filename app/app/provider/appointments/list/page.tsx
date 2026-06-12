import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { List } from "lucide-react";

export default function Page() {
  return (
    <ProviderLayout>
      <ComingSoon title="Appointments List" description="A dedicated list view for appointments is coming soon." icon={List} />
    </ProviderLayout>
  );
}

import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <ComingSoon
        title="Analytics"
        description="Real-time operational and clinical analytics — patient volume trends, provider utilization, appointment metrics, form completion rates, and cross-clinic performance benchmarks."
        icon={BarChart3}
      />
    </AppLayout>
  );
}

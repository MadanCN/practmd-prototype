import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function RecentsPage() {
  return (
    <CcLayout>
      <ComingSoon title="Recents" description="Recently viewed patients and activities coming soon." />
    </CcLayout>
  );
}
